import { useState, useEffect, useCallback, useMemo } from 'react'
import { getFinancePayouts } from '../../api/finance'
import { ApiError } from '../../api/client'
import SearchableSelect from '../../components/SearchableSelect'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN') : '—')

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const STATUS_STYLES = {
  QUEUED: 'bg-info/10 text-info',
  PROCESSING: 'bg-warning/10 text-warning',
  TRANSFERRED: 'bg-success/10 text-success',
  FAILED: 'bg-danger/10 text-danger',
}
const STATUSES = ['QUEUED', 'PROCESSING', 'TRANSFERRED', 'FAILED']

const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconReceipt = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>

/* ── Auto-generated payment receipt (client-side print → "Save as PDF") ── */
function openReceipt(item) {
  const g = item.gst || {}
  const bank = item.bank || {}
  const esc = s => String(s ?? '—').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const line = (k, v) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payment Receipt ${esc(item._id)}</title>
    <style>
      *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:32px;font-size:13px}
      h1{font-size:18px;margin:0 0 2px} .muted{color:#6b7280;font-size:12px}
      .sec{margin-top:22px} .sec h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
      table{border-collapse:collapse;width:100%} td{padding:5px 0;vertical-align:top}
      td.k{color:#6b7280;width:45%} td.v{font-weight:600;text-align:right}
      .total td{border-top:2px solid #111827;padding-top:8px;font-size:15px}
      .status{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:700;font-size:11px;background:#ecfdf5;color:#059669}
      .foot{margin-top:28px;color:#9ca3af;font-size:11px}
    </style></head><body>
    <h1>Payment Receipt</h1>
    <p class="muted">Jashanz · Vendor Settlement Payout</p>
    <p class="muted">Receipt No: ${esc(item._id)} &nbsp;·&nbsp; Generated: ${esc(new Date().toLocaleString('en-IN'))}</p>

    <div class="sec"><h2>Payout</h2><table>
      ${line('Vendor', item.vendor?.name)}
      ${line('Vendor ID', item.vendor?.id)}
      ${line('Payout Method', item.payoutMethod)}
      ${line('Bank', bank.bankName)}
      ${line('Account Holder', bank.holderName)}
      ${line('Account', bank.accountMasked)}
      ${line('IFSC', bank.ifsc)}
      ${line('Settlement Date', fmtDate(item.settlementDate))}
      ${line('Payout Reference', item.payoutId)}
      <tr><td class="k">Status</td><td class="v"><span class="status">${esc(item.status)}</span></td></tr>
    </table></div>

    <div class="sec"><h2>Bundled Bookings (${esc(item.bookingCount)})</h2>
      <p class="muted">${(item.bookingRefs || []).map(esc).join(' &nbsp; ') || '—'}</p>
    </div>

    <div class="sec"><h2>GST Breakdown (derived @ ${esc(g.rate)}% on platform commission)</h2><table>
      ${line('Gross Booking Value', fmtMoney(g.grossBookingValue))}
      ${line('Platform Commission', fmtMoney(g.platformCommission))}
      ${line(`GST @ ${g.rate ?? 18}%`, fmtMoney(g.gstOnCommission))}
      ${line('Commission (excl. GST)', fmtMoney(g.commissionExclGst))}
      <tr class="total"><td class="k">Net Payout to Vendor</td><td class="v">${esc(fmtMoney(item.amount))}</td></tr>
    </table></div>

    <p class="foot">GST figures are derived at ${esc(g.rate)}% on the platform commission for the bundled bookings — they are not stored per settlement and are shown for reconciliation only. This is a system-generated receipt.</p>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Popup blocked — allow popups to download the receipt.'); return }
  w.document.write(html)
  w.document.close()
}

/* ── Detail modal ── */
function PayoutDetailModal({ item, onClose }) {
  const g = item.gst || {}
  const bank = item.bank || {}
  const rows = [
    ['Vendor', item.vendor?.name],
    ['Vendor ID', item.vendor?.id],
    ['Amount', fmtMoney(item.amount)],
    ['Bundled Bookings', item.bookingCount],
    ['Payout Method', item.payoutMethod],
    ['Bank', bank.bankName || '—'],
    ['Account Holder', bank.holderName || '—'],
    ['Account', bank.accountMasked || 'Not on file'],
    ['IFSC', bank.ifsc || '—'],
    ['Settlement Date', fmtDate(item.settlementDate)],
    ['Payout Reference', item.payoutId || '—'],
    ['Created', fmtDateTime(item.createdAt)],
  ]
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base">{item.vendor?.name}</h3>
            <p className="text-xs text-slate-400">Payout {fmtMoney(item.amount)} · {item.bookingCount} booking{item.bookingCount === 1 ? '' : 's'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-500'}`}>{item.status}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconClose /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                <p className="text-sm font-bold text-slate-800 break-all">{String(v ?? '—')}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Booking References</p>
            <div className="flex flex-wrap gap-1.5">
              {(item.bookingRefs || []).length
                ? item.bookingRefs.map((r, i) => <span key={i} className="px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-600">{r}</span>)
                : <span className="text-xs text-slate-400">—</span>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3">GST Breakdown · derived @ {g.rate ?? 18}% on platform commission</p>
            <div className="space-y-1.5 text-sm">
              {[
                ['Gross Booking Value', g.grossBookingValue],
                ['Platform Commission', g.platformCommission],
                [`GST @ ${g.rate ?? 18}%`, g.gstOnCommission],
                ['Commission (excl. GST)', g.commissionExclGst],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800">{fmtMoney(v)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200">
                <span className="font-black text-slate-800">Net Payout to Vendor</span>
                <span className="font-black text-slate-800">{fmtMoney(item.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <button onClick={() => openReceipt(item)} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 flex items-center gap-1.5">
            <IconReceipt /> Download Receipt (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PayoutsPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [gstRate, setGstRate] = useState(18)
  const [filterOptions, setFilterOptions] = useState({ cities: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewItem, setViewItem] = useState(null)

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
    getFinancePayouts(params)
      .then(data => {
        setItems(data.items || [])
        setPagination(data.pagination || { total: 0, page: 1, hasNextPage: false })
        if (typeof data.gstRate === 'number') setGstRate(data.gstRate)
        if (data.filterOptions) setFilterOptions(data.filterOptions)
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load payout records.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const anyFilter = filters.status || filters.city || filters.category || filters.from || filters.to

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Payouts &amp; Settlement Tracking</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vendor payout lifecycle — bank transfers, status, GST breakdown, and receipts</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <select className={selectCls} value={filters.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Any status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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

      <p className="text-xs text-slate-400 -mt-2">
        Read-only. Creating settlements and marking payouts transferred is done from the Admin portal. GST is derived at {gstRate}% on the platform commission for reconciliation — it isn't stored per settlement.
      </p>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Vendor', 'Amount', 'Bookings', 'Payout Method', 'Settlement Date', 'Status', 'GST', 'Receipt'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No payout records match your filters</td></tr>
              ) : items.map(v => (
                <tr key={v._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setViewItem(v)}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-xs text-slate-800 leading-tight">{v.vendor?.name}</p>
                    <p className="text-[10px] text-slate-300 font-mono">{v.vendor?.id}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(v.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap" title={(v.bookingRefs || []).join(', ')}>{v.bookingCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {v.payoutMethod}
                    {v.bank?.accountMasked && <span className="text-slate-400"> · {v.bank.accountMasked}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(v.settlementDate)}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[v.status] || 'bg-slate-100 text-slate-500'}`}>{v.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtMoney(v.gst?.gstOnCommission)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openReceipt(v)} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                      <IconReceipt /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} payouts</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {viewItem && <PayoutDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
    </div>
  )
}
