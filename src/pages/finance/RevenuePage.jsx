import { useState, useEffect, useCallback, useMemo } from 'react'
import { getFinanceRevenue } from '../../api/finance'
import { ApiError } from '../../api/client'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const STATUS_LABELS = { WITHHELD_ON_CANCELLATION: 'Withheld (cancelled booking)' }
const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN') : '—')

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const STREAMS = [
  { value: '', label: 'All revenue' },
  { value: 'VENDOR_BOOKING', label: 'Vendor Bookings' },
  { value: 'COMMISSION', label: 'Commission (10.5%)' },
  { value: 'MARKUP', label: 'Platform Markup' },
  { value: 'SUBSCRIPTION', label: 'Inquiry-Unlock Plans' },
  { value: 'AD_MANAGER_FEE', label: 'AdManager Access Fee' },
  { value: 'VENDOR_REGISTRATION_FEE', label: 'Vendor Registration Fee' },
]

const STREAM_LABELS = Object.fromEntries(STREAMS.filter(s => s.value).map(s => [s.value, s.label]))
const STREAM_STYLES = {
  VENDOR_BOOKING: 'bg-brand/10 text-brand',
  COMMISSION: 'bg-success/10 text-success',
  MARKUP: 'bg-info/10 text-info',
  SUBSCRIPTION: 'bg-warning/10 text-warning',
  AD_MANAGER_FEE: 'bg-purple-500/10 text-purple-600',
  VENDOR_REGISTRATION_FEE: 'bg-slate-200 text-slate-600',
}

function SummaryCard({ label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border p-4 transition-colors ${active ? 'border-brand ring-2 ring-brand/15' : 'border-slate-100 hover:border-slate-200'}`}
    >
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-black text-slate-800">{fmtMoney(value)}</p>
    </button>
  )
}

export default function RevenuePage() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({})
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ stream: '', from: '', to: '' })
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
    getFinanceRevenue(params)
      .then(data => {
        setItems(data.items || [])
        setSummary(data.summary || {})
        setTotalRevenue(data.totalRevenue || 0)
        setPagination(data.pagination || { total: 0, page: 1, hasNextPage: false })
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load revenue data.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const anyFilter = filters.stream || filters.from || filters.to

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Jashanz Revenue</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every revenue stream in one place — vendor bookings, commission, markup, subscriptions, ad-manager fees and vendor registration fees</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <SummaryCard label="Total Revenue" value={totalRevenue} active={!filters.stream} onClick={() => setF('stream', '')} />
        {STREAMS.filter(s => s.value).map(s => (
          <SummaryCard key={s.value} label={s.label} value={summary[s.value]} active={filters.stream === s.value} onClick={() => setF('stream', s.value)} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <select className={selectCls} value={filters.stream} onChange={e => setF('stream', e.target.value)}>
          {STREAMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">From</span>
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ stream: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Revenue Type', 'Vendor', 'Customer', 'Amount', 'Status', 'Date', 'Reference'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No revenue entries match your filters</td></tr>
              ) : items.map((item, i) => (
                <tr key={`${item.revenueType}-${item.reference}-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STREAM_STYLES[item.revenueType] || 'bg-slate-100 text-slate-500'}`}>
                      {STREAM_LABELS[item.revenueType] || item.revenueType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{item.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{item.customer?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{fmtMoney(item.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{STATUS_LABELS[item.status] || item.status || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(item.date)}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">{item.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} entries</span>
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
