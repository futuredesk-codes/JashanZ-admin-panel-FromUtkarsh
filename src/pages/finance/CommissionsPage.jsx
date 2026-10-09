import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getFinanceCommissions, getFinanceCommissionRates,
  setFinanceGlobalCommissionRate, setFinanceVendorCommissionRate,
  getFinanceMarkupRates, setFinanceGlobalMarkupRate, setFinanceCategoryMarkupRate,
} from '../../api/finance'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'
import SearchableSelect from '../../components/SearchableSelect'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const shortId = id => (id ? String(id).slice(-8).toUpperCase() : '—')
const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const STATUS_STYLES = {
  PENDING: 'bg-warning/10 text-warning',
  SETTLED: 'bg-success/10 text-success',
  ON_HOLD: 'bg-slate-100 text-slate-500',
  FAILED: 'bg-danger/10 text-danger',
}
const STATUS_LABEL = { PENDING: 'Pending', SETTLED: 'Settled', ON_HOLD: 'On Hold', FAILED: 'Failed' }

// A commission's effective status: FAILED settlement outranks the commission's own state.
const effectiveStatus = c => (c.settlementStatus === 'FAILED' ? 'FAILED' : c.status)

/* ── Client-side invoice (print → Save as PDF) ── */
function openInvoice(c) {
  const esc = s => String(s ?? '—').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
  const row = (k, v) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Commission Invoice ${esc(shortId(c.bookingId))}</title>
    <style>
      *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:32px;font-size:13px}
      h1{font-size:18px;margin:0 0 2px} .muted{color:#6b7280;font-size:12px}
      .sec{margin-top:22px} .sec h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
      table{border-collapse:collapse;width:100%} td{padding:5px 0;vertical-align:top}
      td.k{color:#6b7280;width:50%} td.v{font-weight:600;text-align:right}
      .total td{border-top:2px solid #111827;padding-top:8px;font-size:15px}
      .foot{margin-top:28px;color:#9ca3af;font-size:11px}
    </style></head><body>
    <h1>Commission Invoice</h1>
    <p class="muted">Jashanz · Platform Commission on a Booking</p>
    <p class="muted">Booking Ref: ${esc(shortId(c.bookingId))} &nbsp;·&nbsp; Generated: ${esc(new Date().toLocaleString('en-IN'))}</p>

    <div class="sec"><h2>Parties</h2><table>
      ${row('Vendor', c.vendor?.name)}
      ${row('Vendor ID', c.vendor?.id)}
      ${row('Customer', c.customer?.name)}
      ${row('Booking ID', c.bookingId)}
      ${row('Booking Date', fmtDate(c.bookingDate))}
    </table></div>

    <div class="sec"><h2>Commission</h2><table>
      ${row('Booking Amount', fmtMoney(c.bookingAmount))}
      ${row('Platform Commission Rate', `${c.commissionRate}%`)}
      ${row('Platform Commission', fmtMoney(c.commissionAmount))}
      ${c.markupAmount > 0 ? row('Platform Markup', fmtMoney(c.markupAmount)) : ''}
      ${row('Platform Revenue (auto-calculated)', fmtMoney(c.platformRevenue))}
      <tr class="total"><td class="k">Settlement to Vendor</td><td class="v">${esc(fmtMoney(c.settlementToVendor))}</td></tr>
    </table></div>

    <div class="sec"><h2>Settlement</h2><table>
      ${row('Status', STATUS_LABEL[effectiveStatus(c)] || effectiveStatus(c))}
      ${row('Scheduled Settlement Date', fmtDate(c.scheduledSettlementDate))}
      ${row('Payout Reference', c.payoutId)}
    </table></div>

    <p class="foot">System-generated invoice. Platform revenue = booking amount × commission rate.</p>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Popup blocked — allow popups to download the invoice.'); return }
  w.document.write(html)
  w.document.close()
}

/* ── All Vendors modal for Commission Rates ── */
function AllVendorRatesModal({ data, onClose }) {
  const [search, setSearch] = useState('')

  const vendors = (data?.vendors || [])
    .filter(v => v.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.username.localeCompare(b.username))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-sm">All Vendors — Commission Rate</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Global rate: {data?.globalRate ?? 0}% — applies unless overridden below.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 pt-4 pb-2 shrink-0">
          <input
            type="text"
            placeholder="Search vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          {vendors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No vendors match.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {vendors.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{v.username}</span>
                  {v.customRate !== null ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/8 text-brand text-[11px] font-bold">
                      {v.customRate}% <span className="text-brand/60 font-semibold">(override)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{data?.globalRate ?? 0}% <span className="text-slate-300">(global)</span></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Commission Rates card (FULL access only) ── */
function RatesCard() {
  const [data, setData] = useState(null)
  const [globalRate, setGlobalRate] = useState('')
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [vendorRate, setVendorRate] = useState('')
  const [savingVendor, setSavingVendor] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(() => {
    getFinanceCommissionRates()
      .then(d => { setData(d); setGlobalRate(String(d.globalRate)) })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load commission rates.'))
  }, [])

  useEffect(() => { load() }, [load])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const saveGlobal = async () => {
    const rate = Number(globalRate)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) { setError('Enter a rate between 0 and 100.'); return }
    setSavingGlobal(true); setError('')
    try {
      await setFinanceGlobalCommissionRate(rate)
      flash('Global rate updated.')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save global rate.')
    } finally { setSavingGlobal(false) }
  }

  const saveVendor = async (clear = false) => {
    if (!vendorId) return
    const rate = clear ? null : Number(vendorRate)
    if (!clear && (Number.isNaN(rate) || rate < 0 || rate > 100)) { setError('Enter a rate between 0 and 100.'); return }
    setSavingVendor(true); setError('')
    try {
      await setFinanceVendorCommissionRate(vendorId, rate)
      flash(clear ? 'Vendor override cleared.' : 'Vendor rate set.')
      setVendorRate('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save vendor rate.')
    } finally { setSavingVendor(false) }
  }

  const customVendors = (data?.vendors || []).filter(v => v.customRate !== null)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-800 text-sm">Commission Rates</h3>
          <p className="text-xs text-slate-400 mt-0.5">Global rate applies to every vendor unless a per-vendor override is set. New commissions use the rate live at the time a booking completes.</p>
        </div>
        <button onClick={() => setShowAll(true)} className="shrink-0 text-xs font-bold text-brand hover:underline whitespace-nowrap">View All</button>
      </div>

      {error && <p className="text-xs text-danger font-semibold">{error}</p>}
      {msg && <p className="text-xs text-success font-semibold">{msg}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Global Commission %</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="100" step="0.5" className={`${selectCls} w-28`} value={globalRate} onChange={e => setGlobalRate(e.target.value)} />
            <button onClick={saveGlobal} disabled={savingGlobal} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 disabled:opacity-50">{savingGlobal ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        <p className="text-xs text-slate-400 pb-2">Default fallback: {data?.defaultRate ?? 10}%</p>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Per-Vendor Override</label>
        <div className="flex flex-wrap items-center gap-2">
          <SearchableSelect
            value={vendorId}
            onChange={v => { setVendorId(v); const found = data?.vendors.find(x => x.id === v); setVendorRate(found?.customRate != null ? String(found.customRate) : '') }}
            options={(data?.vendors || []).map(v => ({ value: v.id, label: `${v.username}${v.customRate != null ? ` — ${v.customRate}%` : ''}` }))}
            placeholder="Select vendor…"
            buttonClassName="min-w-52"
          />
          <input type="number" min="0" max="100" step="0.5" placeholder="%" className={`${selectCls} w-24`} value={vendorRate} onChange={e => setVendorRate(e.target.value)} />
          <button onClick={() => saveVendor(false)} disabled={savingVendor || !vendorId} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 disabled:opacity-40">Set</button>
          <button onClick={() => saveVendor(true)} disabled={savingVendor || !vendorId} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200 disabled:opacity-40">Clear</button>
        </div>
        {customVendors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {customVendors.map(v => (
              <span key={v.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/8 text-brand text-[11px] font-bold">
                {v.username}: {v.customRate}%
              </span>
            ))}
          </div>
        )}
      </div>

      {showAll && <AllVendorRatesModal data={data} onClose={() => setShowAll(false)} />}
    </div>
  )
}

/* ── All Categories modal for Platform Markup ── */
function AllCategoryMarkupModal({ data, onClose }) {
  const [search, setSearch] = useState('')

  const categories = (data?.categories || [])
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-sm">All Categories — Platform Markup</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Global markup: {data?.globalRate ?? 0}% — applies unless overridden below.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 pt-4 pb-2 shrink-0">
          <input
            type="text"
            placeholder="Search category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No categories match.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                  {c.customRate !== null ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/8 text-brand text-[11px] font-bold">
                      {c.customRate}% <span className="text-brand/60 font-semibold">(override)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{data?.globalRate ?? 0}% <span className="text-slate-300">(global)</span></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Platform Markup card (FULL access only) ──
   Inflates what the customer sees/pays on top of a vendor's own basePrice —
   the vendor is always paid their real basePrice; the markup itself is pure
   platform revenue, folded invisibly into the price shown (no separate
   "platform fee" line anywhere). Global rate + per-category override, same
   shape as the Recharge Management page's Per-Category Registration Fee
   override — a markup is a pricing-policy call made per service category,
   not negotiated per vendor like commission. 0% (no override) means the
   customer sees exactly the vendor's own price, unchanged. */
function MarkupRatesCard() {
  const [data, setData] = useState(null)
  const [globalRate, setGlobalRate] = useState('')
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [categoryRate, setCategoryRate] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(() => {
    getFinanceMarkupRates()
      .then(d => { setData(d); setGlobalRate(String(d.globalRate)) })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load markup rates.'))
  }, [])

  useEffect(() => { load() }, [load])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const saveGlobal = async () => {
    const rate = Number(globalRate)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) { setError('Enter a rate between 0 and 100.'); return }
    setSavingGlobal(true); setError('')
    try {
      await setFinanceGlobalMarkupRate(rate)
      flash('Global markup updated.')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save global markup.')
    } finally { setSavingGlobal(false) }
  }

  const saveCategory = async (clear = false) => {
    if (!categoryId) return
    const rate = clear ? null : Number(categoryRate)
    if (!clear && (Number.isNaN(rate) || rate < 0 || rate > 100)) { setError('Enter a rate between 0 and 100.'); return }
    setSavingCategory(true); setError('')
    try {
      await setFinanceCategoryMarkupRate(categoryId, clear ? null : rate)
      flash(clear ? 'Category override cleared.' : 'Category markup set.')
      setCategoryRate('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save category markup.')
    } finally { setSavingCategory(false) }
  }

  const customCategories = (data?.categories || []).filter(c => c.customRate !== null)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-800 text-sm">Platform Markup</h3>
          <p className="text-xs text-slate-400 mt-0.5">Adds a % on top of the vendor's own price before the customer ever sees it — the vendor is always paid their real price, the markup is pure platform revenue. 0% (no override) shows the customer the vendor's price unchanged.</p>
        </div>
        <button onClick={() => setShowAll(true)} className="shrink-0 text-xs font-bold text-brand hover:underline whitespace-nowrap">View All</button>
      </div>

      {error && <p className="text-xs text-danger font-semibold">{error}</p>}
      {msg && <p className="text-xs text-success font-semibold">{msg}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Global Markup %</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="100" step="0.5" className={`${selectCls} w-28`} value={globalRate} onChange={e => setGlobalRate(e.target.value)} />
            <button onClick={saveGlobal} disabled={savingGlobal} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 disabled:opacity-50">{savingGlobal ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        <p className="text-xs text-slate-400 pb-2">Default fallback: {data?.defaultRate ?? 0}%</p>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Per-Category Override</label>
        <div className="flex flex-wrap items-center gap-2">
          <SearchableSelect
            value={categoryId}
            onChange={v => { setCategoryId(v); const found = data?.categories.find(x => x.id === v); setCategoryRate(found?.customRate != null ? String(found.customRate) : '') }}
            options={(data?.categories || []).map(c => ({ value: c.id, label: `${c.name}${c.customRate != null ? ` — ${c.customRate}%` : ''}` }))}
            placeholder="Select category…"
            buttonClassName="min-w-52"
          />
          <input type="number" min="0" max="100" step="0.5" placeholder="%" className={`${selectCls} w-24`} value={categoryRate} onChange={e => setCategoryRate(e.target.value)} />
          <button onClick={() => saveCategory(false)} disabled={savingCategory || !categoryId} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 disabled:opacity-40">Set</button>
          <button onClick={() => saveCategory(true)} disabled={savingCategory || !categoryId} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200 disabled:opacity-40">Clear</button>
        </div>
        {customCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {customCategories.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/8 text-brand text-[11px] font-bold">
                {c.name}: {c.customRate}%
              </span>
            ))}
          </div>
        )}
      </div>

      {showAll && <AllCategoryMarkupModal data={data} onClose={() => setShowAll(false)} />}
    </div>
  )
}

export default function CommissionsPage() {
  const { can } = usePermissions()
  const canEditRates = can('financeCommission', 'FULL')

  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [filterOptions, setFilterOptions] = useState({ cities: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', city: '', category: '', from: '', to: '' })
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to)

  const params = useMemo(() => {
    const p = { page, limit: 20 }
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v })
    return p
  }, [page, filters])

  const load = useCallback(() => {
    if (invalidRange) return
    setLoading(true)
    setError('')
    getFinanceCommissions(params)
      .then(data => {
        setItems(data.items || [])
        setSummary(data.summary || null)
        setPagination(data.pagination || { total: 0, page: 1, hasNextPage: false })
        if (data.filterOptions) setFilterOptions(data.filterOptions)
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load commissions.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const anyFilter = filters.status || filters.city || filters.category || filters.from || filters.to

  const tiles = summary ? [
    { label: 'Platform Revenue', value: fmtMoney(summary.platformRevenue), cls: 'text-success' },
    { label: 'Platform Pending', value: fmtMoney(summary.platformPending), cls: 'text-warning' },
    { label: 'Vendor Payable', value: fmtMoney(summary.vendorPayable), cls: 'text-info' },
    { label: 'Pending / Settled / On Hold', value: `${summary.pendingCount} / ${summary.settledCount} / ${summary.onHoldCount}`, cls: 'text-slate-700' },
  ] : []

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Bookings Revenue &amp; Commission Manager</h1>
        <p className="text-sm text-slate-500 mt-0.5">Commission earned per booking, settlement owed to vendors, and rate configuration</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map(t => (
            <div key={t.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{t.label}</p>
              <p className={`text-xl font-black ${t.cls}`}>{t.value}</p>
            </div>
          ))}
        </div>
      )}

      {canEditRates ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RatesCard />
          <MarkupRatesCard />
        </div>
      ) : (
        <p className="text-xs text-slate-400">Commission-rate and markup configuration needs full access on this page — ask a Finance Admin.</p>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <select className={selectCls} value={filters.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Any status</option>
          <option value="PENDING">Pending</option>
          <option value="SETTLED">Settled</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
        <SearchableSelect
          value={filters.category}
          onChange={v => setF('category', v)}
          options={filterOptions.categories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="All categories"
        />
        <SearchableSelect
          value={filters.city}
          onChange={v => setF('city', v)}
          options={filterOptions.cities.map(c => ({ value: c, label: c }))}
          placeholder="All cities"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Created</span>
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ status: '', city: '', category: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Booking', 'Vendor', 'Customer', 'Booking Amount', 'Rate', 'Markup', 'Platform Revenue', 'Settlement to Vendor', 'Status', 'Scheduled Settlement', 'Invoice'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400 text-sm">No commission records match your filters</td></tr>
              ) : items.map(c => {
                const es = effectiveStatus(c)
                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-slate-800">{shortId(c.bookingId)}</p>
                      <p className="text-[10px] text-slate-300 font-mono">{c.bookingId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800">{c.vendor?.name}</p>
                      <p className="text-[10px] text-slate-300 font-mono">{c.vendor?.id}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.customer?.name}
                      {c.customer?.id && <p className="text-[10px] text-slate-300 font-mono">{c.customer.id}</p>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(c.bookingAmount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.commissionRate}%</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.markupAmount > 0 ? fmtMoney(c.markupAmount) : '—'}</td>
                    <td className="px-4 py-3 font-bold text-success whitespace-nowrap">{fmtMoney(c.platformRevenue)}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmtMoney(c.settlementToVendor)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[es] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABEL[es] || es}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.scheduledSettlementDate)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openInvoice(c)} className="text-xs font-bold text-brand hover:underline">PDF</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} commissions</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
