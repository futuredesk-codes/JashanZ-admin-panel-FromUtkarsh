import { useState, useEffect, useCallback, useMemo } from 'react'
import { exportFinanceReport } from '../../api/finance'
import { ApiError } from '../../api/client'

/* ── Report definitions: each maps a UI card to a real backend `type` + expected columns ── */
const REPORT_SECTIONS = [
  {
    key: 'users',
    title: 'User Reports',
    colorClass: 'bg-brand/8 text-brand',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    reports: [
      { type: 'customers', name: 'Customer Registrations Report', desc: 'New customer signups by date range',
        columns: [['name','Name'],['username','Username'],['phoneNumber','Phone'],['email','Email'],['isVerified','Verified'],['createdAt','Registered On']] },
      { type: 'customerActivity', name: 'Customer Activity Report', desc: 'Active vs inactive customer metrics and engagement',
        columns: [['name','Name'],['username','Username'],['isActive','Active'],['isProfileComplete','Profile Complete'],['updatedAt','Last Updated']] },
      { type: 'suspendedAccounts', name: 'Suspended Accounts Report', desc: 'All suspended/deactivated accounts',
        columns: [['name','Name'],['username','Username'],['phoneNumber','Phone'],['updatedAt','Suspended/Updated On']] },
    ],
  },
  {
    key: 'businesses',
    title: 'Business Reports',
    colorClass: 'bg-success/8 text-success',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    reports: [
      { type: 'vendor', name: 'Vendor Registration Report', desc: 'All registered vendors with status breakdown',
        columns: [['username','Business'],['category','Category'],['status','Status'],['isPaid','Registration Paid'],['createdAt','Registered On']] },
      { type: 'approvedVendors', name: 'Approved Vendors Report', desc: 'Active approved businesses by category and area',
        columns: [['username','Business'],['category','Category'],['area','Area'],['createdAt','Approved/Registered On']] },
      { type: 'categoryVendors', name: 'Category-wise Vendor Report', desc: 'Vendor distribution across all service categories',
        columns: [['category','Category'],['vendorCount','Vendor Count']] },
      { type: 'cityVendors', name: 'City-wise Vendor Report', desc: 'Geographic distribution of vendors across areas',
        columns: [['area','Area'],['vendorCount','Vendor Count']] },
    ],
  },
  {
    key: 'revenue',
    title: 'Booking & Revenue Reports',
    colorClass: 'bg-warning/8 text-warning',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    reports: [
      { type: 'bookings', name: 'Booking Summary Report', desc: 'Total bookings with status breakdown and trends',
        columns: [['business','Business'],['serviceType','Service'],['status','Status'],['paymentMethod','Payment Method'],['totalAmount','Amount'],['createdAt','Booked On']] },
      { type: 'commissions', name: 'Commission Revenue Report', desc: 'Platform commission earnings by period',
        columns: [['business','Business'],['bookingAmount','Booking Amount'],['commissionRate','Rate %'],['commissionAmount','Commission'],['platformRevenue','Platform Revenue'],['status','Status'],['createdAt','Date']] },
      { type: 'recharges', name: 'Recharge Revenue Report', desc: 'Vendor wallet recharge transactions and totals',
        columns: [['business','Business'],['coins','Coins'],['amountPaid','Amount Paid'],['razorpayOrderId','Order ID'],['createdAt','Date']] },
      { type: 'settlements', name: 'Settlement Report', desc: 'Completed vendor settlements and pending amounts',
        columns: [['business','Business'],['totalAmount','Amount'],['status','Status'],['razorpayPayoutId','Payout ID'],['processedAt','Processed On'],['createdAt','Created On']] },
      { type: 'refunds', name: 'Refund Report', desc: 'All refund transactions with statuses',
        columns: [['business','Business'],['user','Customer'],['totalAmount','Amount'],['razorpayRefundId','Refund ID'],['status','Status'],['createdAt','Date']] },
    ],
  },
  {
    key: 'support',
    title: 'Support Reports',
    colorClass: 'bg-info/8 text-info',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.81 19.79 19.79 0 01.63 2.18 2 2 0 012.62.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    reports: [
      { type: 'vendorApproval', name: 'Vendor Approval Report', desc: 'Approval and rejection summary for vendor onboarding',
        columns: [['status','Status'],['count','Count']] },
      { type: 'tickets', name: 'Ticket Summary Report', desc: 'Support ticket volume by status and type',
        columns: [['status','Status'],['type','Type'],['count','Count']] },
      { type: 'escalatedTickets', name: 'Escalated Tickets Report', desc: 'Tickets escalated beyond first-level support',
        columns: [['raisedByModel','Raised By'],['subject','Subject'],['status','Status'],['createdAt','Date']] },
    ],
  },
]

const ALL_REPORTS = REPORT_SECTIONS.flatMap((s) => s.reports)

// Aggregate/count reports have no per-row date column, so a date range can't
// meaningfully scope them the way it does a row-level list — surfaced in the
// preview so an operator isn't misled into thinking "August" filtered these.
const DATE_SCOPED_TYPES = new Set([
  'customers', 'customerActivity', 'suspendedAccounts', 'vendor', 'approvedVendors',
  'bookings', 'commissions', 'recharges', 'settlements', 'refunds', 'escalatedTickets',
  'categoryVendors', 'vendorApproval', 'tickets',
])
// cityVendors ignores the range entirely on the backend (no createdAt match).
const RANGE_IGNORED_TYPES = new Set(['cityVendors'])

const PREVIEW_ROW_CAP = 500

/* ── Date range presets ── */
const pad = (n) => String(n).padStart(2, '0')
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const DAY_MS = 86400000

const PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 90 days' },
  { key: 'thisYear', label: 'This year' },
  { key: 'custom', label: 'Custom' },
]

function presetRange(key) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (key) {
    case 'all': return { from: '', to: '' }
    case 'thisMonth': return { from: isoDay(new Date(y, m, 1)), to: isoDay(now) }
    case 'lastMonth': return { from: isoDay(new Date(y, m - 1, 1)), to: isoDay(new Date(y, m, 0)) }
    case 'last7': return { from: isoDay(new Date(now.getTime() - 6 * DAY_MS)), to: isoDay(now) }
    case 'last30': return { from: isoDay(new Date(now.getTime() - 29 * DAY_MS)), to: isoDay(now) }
    case 'last90': return { from: isoDay(new Date(now.getTime() - 89 * DAY_MS)), to: isoDay(now) }
    case 'thisYear': return { from: isoDay(new Date(y, 0, 1)), to: isoDay(now) }
    default: return null // 'custom' — keep whatever the inputs hold
  }
}

const fmtDay = (s) =>
  s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

function rangeLabelFor(from, to) {
  if (!from && !to) return 'All time'
  return `${fmtDay(from) || 'the beginning'} – ${fmtDay(to) || 'today'}`
}

/* ── Icons ── */
const IconDownload = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconCalendar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── CSV / export helpers ── */
const csvEscape = (v) => {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const flattenValue = (v) => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') {
    if (v.username) return v.username
    if (v.name) return v.name
    if (v._id) return String(v._id)
    return ''
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('en-IN')
  return v
}

const downloadBlob = (content, mime, filename) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const buildCsv = (columns, rows) => {
  const header = columns.map(([, label]) => label)
  const lines = [header.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(columns.map(([key]) => csvEscape(flattenValue(row[key]))).join(','))
  }
  return lines.join('\n')
}

const buildHtmlTable = (columns, rows, title, subtitle) => {
  const head = columns.map(([, label]) => `<th>${label}</th>`).join('')
  const body = rows.length
    ? rows.map((row) => `<tr>${columns.map(([key]) => `<td>${flattenValue(row[key])}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" style="text-align:center;color:#94a3b8">No data for the selected date range</td></tr>`
  return `<html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px}
      h1{font-size:16px;margin-bottom:4px}
      p.sub{color:#64748b;font-size:11px;margin:0 0 14px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;text-align:left}
      th{background:#f1f5f9}
    </style></head>
    <body><h1>${title}</h1>${subtitle ? `<p class="sub">${subtitle}</p>` : ''}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
}

// Machine-safe filename fragment describing the exported period.
function periodSlug(from, to) {
  if (from || to) return `${from || 'start'}_to_${to || 'today'}`
  return `all-time_asof_${new Date().toISOString().slice(0, 10)}`
}

/* ── Preview + export modal ── */
function ReportPreviewModal({ report, dateRange, onClose, onError }) {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [downloading, setDownloading] = useState(null)

  const label = rangeLabelFor(dateRange.from, dateRange.to)

  // The modal is mounted fresh each time a report is opened and the date range
  // is locked behind it, so this fetch runs exactly once per open — initial
  // state (loading: true) already covers the pending UI, no setState needed in
  // the effect body itself.
  useEffect(() => {
    let cancelled = false
    exportFinanceReport({ type: report.type, from: dateRange.from, to: dateRange.to })
      .then((res) => { if (!cancelled) setRows(res?.data || []) })
      .catch((e) => { if (!cancelled) setErr(e instanceof ApiError ? e.message : e.message || 'Failed to load report') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [report.type, dateRange.from, dateRange.to])

  const handleDownload = (format) => {
    if (!rows) return
    setDownloading(format)
    try {
      const base = `${report.type}_${periodSlug(dateRange.from, dateRange.to)}`
      const subtitle = `Period: ${label}  ·  ${rows.length} row${rows.length === 1 ? '' : 's'}  ·  Generated ${new Date().toLocaleString('en-IN')}`
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <IconCalendar /> {label}
          </span>
          <span className="text-xs text-slate-400 font-semibold">
            {loading ? 'Loading…' : rows ? `${rows.length} row${rows.length === 1 ? '' : 's'}` : ''}
          </span>
          {RANGE_IGNORED_TYPES.has(report.type) && (
            <span className="text-[11px] font-semibold text-warning">Date range not applied — this report always covers all records.</span>
          )}
          {!DATE_SCOPED_TYPES.has(report.type) && !RANGE_IGNORED_TYPES.has(report.type) && (
            <span className="text-[11px] font-semibold text-slate-400">Summary report — counts reflect the selected range.</span>
          )}
        </div>

        <div className="overflow-auto flex-1 p-6">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-16">Loading report…</p>
          ) : err ? (
            <p className="text-sm text-danger font-semibold text-center py-16">{err}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">No data for {label === 'All time' ? 'this report' : `${label}`}.</p>
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
              const styles = {
                CSV: 'bg-success/8 text-success hover:bg-success/15',
                Excel: 'bg-info/8 text-info hover:bg-info/15',
                PDF: 'bg-danger/8 text-danger hover:bg-danger/15',
              }
              return (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  disabled={loading || !!err || downloading !== null}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${styles[fmt]} ${downloading === fmt ? 'opacity-60' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {downloading === fmt
                    ? <span className="flex items-center gap-1"><svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>{fmt}</span>
                    : <><IconDownload />{fmt}</>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Report card ── */
function ReportCard({ report, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="text-left bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-brand/40 transition-all"
    >
      <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{report.name}</p>
      <p className="text-xs text-slate-400 leading-snug">{report.desc}</p>
      <span className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold text-brand">
        Preview &amp; export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </button>
  )
}

/* ── Main page ── */
export default function ReportsPage() {
  const initial = presetRange('thisMonth')
  const [preset, setPreset] = useState('thisMonth')
  const [fromDate, setFromDate] = useState(initial.from)
  const [toDate, setToDate] = useState(initial.to)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [openReport, setOpenReport] = useState(null)

  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate)
  const label = rangeLabelFor(fromDate, toDate)
  const dateRange = useMemo(() => ({ from: fromDate, to: toDate }), [fromDate, toDate])

  const applyPreset = useCallback((key) => {
    setPreset(key)
    setError('')
    if (key === 'custom') return
    const r = presetRange(key)
    if (r) { setFromDate(r.from); setToDate(r.to) }
  }, [])

  const handleGenerateAll = async () => {
    if (invalidRange) { setError('"From" date is after "To" date — fix the range first.'); return }
    if (!fromDate && !toDate && !window.confirm('No date range is set. This exports every record across all reports. Continue?')) return

    setGenerating(true)
    setError('')
    try {
      for (const report of ALL_REPORTS) {
        const res = await exportFinanceReport({ type: report.type, from: fromDate, to: toDate })
        const rows = res?.data || []
        downloadBlob(buildCsv(report.columns, rows), 'text/csv;charset=utf-8;', `${report.type}_${periodSlug(fromDate, toDate)}.csv`)
        // stagger downloads so browsers don't block a burst of simultaneous file saves
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
          <h1 className="text-xl font-black text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Preview and download platform reports in CSV, Excel or PDF format</p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generating || invalidRange}
          className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90 disabled:opacity-60 transition-opacity"
        >
          {generating ? (
            <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>Generating…</>
          ) : (
            <><IconDownload />Generate All (CSV)</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-xl px-4 py-2.5">{error}</div>
      )}

      {/* Date range filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 mr-1">
            <IconCalendar /> Date Range
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                preset === p.key ? 'bg-brand text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">From</span>
              <input
                type="date"
                max={toDate || undefined}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setError('') }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To</span>
              <input
                type="date"
                min={fromDate || undefined}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setError('') }}
              />
            </div>
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate('') }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-semibold">Reports reflect:</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${invalidRange ? 'bg-danger/10 text-danger' : 'bg-brand/8 text-brand'}`}>
            {invalidRange ? '"From" is after "To"' : label}
          </span>
        </div>
      </div>

      {/* Report sections */}
      {REPORT_SECTIONS.map((section) => (
        <div key={section.key}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-8 h-8 rounded-xl ${section.colorClass} flex items-center justify-center`}>{section.icon}</div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">{section.title}</h2>
            <span className="text-xs text-slate-400 font-semibold">({section.reports.length} reports)</span>
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
          dateRange={dateRange}
          onClose={() => setOpenReport(null)}
          onError={setError}
        />
      )}
    </div>
  )
}
