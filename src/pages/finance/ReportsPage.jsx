import { useState, useEffect, useCallback, useMemo } from 'react'
import { exportFinanceReport, getFinancePayouts } from '../../api/finance'
import { ApiError } from '../../api/client'
import {
  PRESETS, presetRange, rangeLabelFor, buildCsv, buildHtmlTable, downloadBlob,
  periodSlug, flattenValue, PREVIEW_ROW_CAP,
} from '../../utils/reportExport'
import SearchableSelect from '../../components/SearchableSelect'

/* ── Finance report definitions, grouped into sections ── */
const REPORT_SECTIONS = [
  {
    key: 'vendors',
    title: 'Vendor Reports',
    reports: [
      {
        type: 'financeVendorPayments',
        name: 'Vendor Payments Report',
        desc: 'Registration fee & premium upgrade status per vendor',
        columns: [
          ['vendor', 'Vendor'], ['category', 'Category'], ['city', 'City'],
          ['registrationPaid', 'Reg. Paid'], ['registrationFee', 'Reg. Fee (₹)'],
          ['premiumUpgrade', 'Premium'], ['premiumFee', 'Premium Fee (₹)'],
          ['paymentMethod', 'Method'], ['registeredOn', 'Registered On'],
        ],
        uses: { category: true, city: true, paymentStatus: true },
      },
      {
        type: 'financePremiumUpgrades',
        name: 'Premium Upgrades Report',
        desc: 'Every paid AdManager / premium access upgrade',
        columns: [
          ['vendor', 'Vendor'], ['category', 'Category'], ['city', 'City'],
          ['fee', 'Fee (₹)'], ['paidOn', 'Paid On'], ['approvalStatus', 'Approval'], ['orderId', 'Order ID'],
        ],
        uses: { category: true, city: true, paymentStatus: false },
      },
    ],
  },
  {
    key: 'adsRevenue',
    title: 'Ad Credits & Revenue Reports',
    reports: [
      {
        type: 'financeAdCredits',
        name: 'Ad Credit Purchases Report',
        desc: 'Vendor coin-pack purchases used for ad boosts',
        columns: [
          ['business', 'Business'], ['coins', 'Coins'], ['amountPaid', 'Amount Paid (₹)'],
          ['orderId', 'Order ID'], ['date', 'Date'],
        ],
        uses: { category: true, city: true, paymentStatus: false },
      },
      {
        type: 'financeMonthlyRevenue',
        name: 'Monthly Bookings & Revenue Report',
        desc: 'Bookings, booking value, commission & recharge revenue by month',
        columns: [
          ['month', 'Month'], ['bookings', 'Bookings'], ['bookingValue', 'Booking Value (₹)'],
          ['commissionRevenue', 'Commission Revenue (₹)'], ['rechargeRevenue', 'Recharge Revenue (₹)'],
        ],
        uses: { category: true, city: true, paymentStatus: false },
      },
    ],
  },
  {
    key: 'settlements',
    title: 'Settlement Reports',
    reports: [
      {
        type: 'financeSettlementPayouts',
        name: 'Settlement Payout Report',
        desc: 'Vendor settlements with status, payout ref & GST estimate',
        columns: [
          ['vendor', 'Vendor'], ['amount', 'Amount (₹)'], ['bookings', 'Bookings'],
          ['status', 'Status'], ['payoutId', 'Payout ID'], ['settlementDate', 'Settlement Date'],
          ['gstOnCommission', 'GST est. (₹)'], ['createdOn', 'Created On'],
        ],
        uses: { category: true, city: true, paymentStatus: false },
      },
    ],
  },
]

const IconDownload = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const IconCalendar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>

/* ── Preview + export modal ── */
function ReportPreviewModal({ report, filters, label, onClose, onError }) {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [downloading, setDownloading] = useState(null)

  const apiParams = useMemo(() => {
    const p = { type: report.type }
    if (filters.from) p.from = filters.from
    if (filters.to) p.to = filters.to
    if (report.uses.category && filters.category) p.category = filters.category
    if (report.uses.city && filters.city) p.city = filters.city
    if (report.uses.paymentStatus && filters.paymentStatus) p.paymentStatus = filters.paymentStatus
    return p
  }, [report, filters])

  useEffect(() => {
    let cancelled = false
    exportFinanceReport(apiParams)
      .then((res) => { if (!cancelled) setRows(res?.data || []) })
      .catch((e) => { if (!cancelled) setErr(e instanceof ApiError ? e.message : e.message || 'Failed to load report') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [apiParams])

  const filterBits = [
    label,
    report.uses.category && filters.categoryName ? `Category: ${filters.categoryName}` : null,
    report.uses.city && filters.city ? `City: ${filters.city}` : null,
    report.uses.paymentStatus && filters.paymentStatus ? `Status: ${filters.paymentStatus}` : null,
  ].filter(Boolean).join('  ·  ')

  const handleDownload = (format) => {
    if (!rows) return
    setDownloading(format)
    try {
      const base = `${report.type}_${periodSlug(filters.from, filters.to)}`
      const subtitle = `${filterBits}  ·  ${rows.length} row${rows.length === 1 ? '' : 's'}  ·  Generated ${new Date().toLocaleString('en-IN')}`
      if (format === 'CSV') {
        downloadBlob(buildCsv(report.columns, rows), 'text/csv;charset=utf-8;', `${base}.csv`)
      } else if (format === 'Excel') {
        downloadBlob(buildHtmlTable(report.columns, rows, report.name, subtitle), 'application/vnd.ms-excel;charset=utf-8;', `${base}.xls`)
      } else {
        const html = buildHtmlTable(report.columns, rows, report.name, subtitle)
        const win = window.open('', '_blank')
        if (!win) throw new Error('Popup blocked — allow popups to export PDF')
        win.document.write(html)
        win.document.close()
        win.onload = () => win.print()
      }
    } catch (e) {
      onError(e.message || 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  const shown = rows ? rows.slice(0, PREVIEW_ROW_CAP) : []

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-base leading-tight">{report.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{report.desc}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0"><IconClose /></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600"><IconCalendar /> {filterBits}</span>
          <span className="text-xs text-slate-400 font-semibold">{loading ? 'Loading…' : rows ? `${rows.length} row${rows.length === 1 ? '' : 's'}` : ''}</span>
        </div>

        <div className="overflow-auto flex-1 p-6">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-16">Loading report…</p>
          ) : err ? (
            <p className="text-sm text-danger font-semibold text-center py-16">{err}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">No data for these filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-100">
                  <tr>
                    {report.columns.map(([, lbl]) => (
                      <th key={lbl} className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{lbl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {report.columns.map(([key, lbl]) => (
                        <td key={lbl} className="px-3 py-2 text-slate-600 whitespace-nowrap">{String(flattenValue(row[key]) ?? '') || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > PREVIEW_ROW_CAP && (
                <p className="text-[11px] text-slate-400 font-semibold px-3 py-2 bg-slate-50/70 border-t border-slate-100">
                  Showing first {PREVIEW_ROW_CAP} of {rows.length} rows — the download contains all {rows.length}.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <div className="flex items-center gap-1.5">
            {['CSV', 'Excel', 'PDF'].map((fmt) => {
              const styles = { CSV: 'bg-success/8 text-success hover:bg-success/15', Excel: 'bg-info/8 text-info hover:bg-info/15', PDF: 'bg-danger/8 text-danger hover:bg-danger/15' }
              return (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  disabled={loading || !!err || downloading !== null}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${styles[fmt]} ${downloading === fmt ? 'opacity-60' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <IconDownload />{fmt}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ report, onOpen }) {
  return (
    <button onClick={onOpen} className="text-left bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-brand/40 transition-all">
      <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{report.name}</p>
      <p className="text-xs text-slate-400 leading-snug">{report.desc}</p>
      <span className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold text-brand">
        Preview &amp; export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  )
}

export default function ReportsPage() {
  const initial = presetRange('thisMonth')
  const [preset, setPreset] = useState('thisMonth')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [options, setOptions] = useState({ cities: [], categories: [] })
  const [error, setError] = useState('')
  const [openReport, setOpenReport] = useState(null)
  const [generating, setGenerating] = useState(false)

  const visibleSections = sectionFilter ? REPORT_SECTIONS.filter((s) => s.key === sectionFilter) : REPORT_SECTIONS
  const scopedReports = visibleSections.flatMap((s) => s.reports)

  useEffect(() => {
    getFinancePayouts({ page: 1, limit: 1 })
      .then((d) => { if (d.filterOptions) setOptions(d.filterOptions) })
      .catch(() => {})
  }, [])

  const invalidRange = Boolean(from && to && from > to)
  const label = rangeLabelFor(from, to)
  const categoryName = options.categories.find((c) => c.id === category)?.name || ''

  const filters = useMemo(
    () => ({ from, to, city, category, categoryName, paymentStatus }),
    [from, to, city, category, categoryName, paymentStatus],
  )

  const applyPreset = useCallback((key) => {
    setPreset(key)
    setError('')
    if (key === 'custom') return
    const r = presetRange(key)
    if (r) { setFrom(r.from); setTo(r.to) }
  }, [])

  const handleGenerateAll = async () => {
    if (invalidRange) { setError('"From" date is after "To" date — fix the range first.'); return }
    const scopeLabel = sectionFilter ? `the "${visibleSections[0].title}" section` : 'all sections'
    const rangeText = !from && !to ? 'with NO date range (every record)' : `for ${label}`
    const n = scopedReports.length
    if (!window.confirm(`Download ${n} CSV report${n === 1 ? '' : 's'} — ${scopeLabel}, ${rangeText}?`)) return
    setGenerating(true)
    setError('')
    try {
      for (const report of scopedReports) {
        const p = { type: report.type }
        if (from) p.from = from
        if (to) p.to = to
        if (report.uses.category && category) p.category = category
        if (report.uses.city && city) p.city = city
        if (report.uses.paymentStatus && paymentStatus) p.paymentStatus = paymentStatus
        const res = await exportFinanceReport(p)
        downloadBlob(buildCsv(report.columns, res?.data || []), 'text/csv;charset=utf-8;', `${report.type}_${periodSlug(from, to)}.csv`)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err.message || 'Failed to generate all reports')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">Finance Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Preview and download finance reports in CSV, Excel or PDF</p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generating || invalidRange}
          className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90 disabled:opacity-60"
        >
          {generating ? 'Generating…' : <><IconDownload />Generate All (CSV)</>}
        </button>
      </div>

      {error && <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-xl px-4 py-2.5">{error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 mr-1"><IconCalendar /> Date Range</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${preset === p.key ? 'bg-brand text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-slate-400">From</span>
            <input type="date" max={to || undefined} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={from} onChange={(e) => { setFrom(e.target.value); setError('') }} />
            <span className="text-xs text-slate-400">To</span>
            <input type="date" min={from || undefined} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={to} onChange={(e) => { setTo(e.target.value); setError('') }} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <SearchableSelect
            value={category}
            onChange={setCategory}
            options={options.categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="All categories"
          />
          <SearchableSelect
            value={city}
            onChange={setCity}
            options={options.cities.map((c) => ({ value: c, label: c }))}
            placeholder="All cities"
          />
          <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="">Any payment status</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
          {(city || category || paymentStatus) && (
            <button onClick={() => { setCity(''); setCategory(''); setPaymentStatus('') }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear filters</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs font-semibold text-slate-500">Section</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All sections</option>
            {REPORT_SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.title} ({s.reports.length})</option>
            ))}
          </select>
          <span className="text-xs text-slate-400 font-semibold ml-auto">Reports reflect:</span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${invalidRange ? 'bg-danger/10 text-danger' : 'bg-brand/8 text-brand'}`}>
            {invalidRange ? '"From" is after "To"' : label}
          </span>
        </div>
      </div>

      {visibleSections.map((section) => (
        <div key={section.key}>
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">{section.title}</h2>
            <span className="text-xs text-slate-400 font-semibold">({section.reports.length} report{section.reports.length === 1 ? '' : 's'})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.reports.map((report) => (
              <ReportCard key={report.type} report={report} onOpen={() => { setError(''); setOpenReport(report) }} />
            ))}
          </div>
        </div>
      ))}

      {openReport && (
        <ReportPreviewModal
          report={openReport}
          filters={filters}
          label={label}
          onClose={() => setOpenReport(null)}
          onError={setError}
        />
      )}
    </div>
  )
}
