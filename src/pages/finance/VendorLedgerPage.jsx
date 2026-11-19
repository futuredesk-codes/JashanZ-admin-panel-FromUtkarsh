import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorLedgerList } from '../../api/finance'
import { ApiError } from '../../api/client'
import { fmtMoney, fmtDate, selectCls, splitPercents } from './vendorLedgerUtils'

const SORT_OPTIONS = [
  { value: 'pending', label: 'Most pending' },
  { value: 'earned', label: 'Most earned' },
  { value: 'paid', label: 'Most paid' },
  { value: 'onHold', label: 'Most on hold' },
]

function StatCard({ label, value, hint, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
    </div>
  )
}

function SplitBar({ row }) {
  const p = splitPercents(row)
  if (!row.earned) return <span className="text-xs text-slate-300">—</span>
  return (
    <div className="w-28" title={`Paid ${p.paid}% · Pending ${p.pending}% · On hold ${p.onHold}%`}>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
        <div className="bg-success" style={{ width: `${p.paid}%` }} />
        <div className="bg-warning" style={{ width: `${p.pending}%` }} />
        <div className="bg-slate-300" style={{ width: `${p.onHold}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">{p.paid}% paid</p>
    </div>
  )
}

export default function VendorLedgerPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState('pending')
  const [onlyPending, setOnlyPending] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], totals: null, pagination: { total: 0, page: 1, totalPages: 1, hasNextPage: false } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getVendorLedgerList({ page, limit: 20, search: debouncedSearch || undefined, sort, onlyPending: onlyPending ? 'true' : undefined })
      .then(res => setData(res))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load the vendor ledger.'))
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, sort, onlyPending])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const { items, totals, pagination } = data
  const open = (id) => navigate(`/finance/vendor-ledger/${id}`)

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Vendor Ledger</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Every vendor's money in one place — what they earned, what has been paid, what is still owed. Open a vendor to see each booking and payout behind the numbers.
        </p>
      </div>

      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Earned by vendors" value={fmtMoney(totals.service.earned)} hint={`${totals.vendors} vendors · vendor share of completed bookings`} tone="text-slate-800" />
          <StatCard label="Paid" value={fmtMoney(totals.service.paid)} hint="Already settled to vendors" tone="text-success" />
          <StatCard label="Pending payout" value={fmtMoney(totals.service.pending)} hint="Owed now — pay from Pending Vendor Settlements" tone="text-warning" />
          <StatCard label="On hold" value={fmtMoney(totals.service.onHold)} hint="Waiting on a refund before it can be paid" tone="text-slate-500" />
        </div>
      )}

      {totals && totals.event.earned > 0 && (
        <div className="bg-info/8 border border-info/20 text-slate-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
          <b>Event ticket earnings: {fmtMoney(totals.event.earned)}</b> ({fmtMoney(totals.event.pending)} pending). These are shown separately on each vendor's page and are <b>not</b> included in the numbers above or in Pending Vendor Settlements — there is no payout flow for event tickets yet.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by vendor username..."
          className={`${selectCls} flex-1 min-w-52`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={selectCls} value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} aria-label="Sort vendors">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 font-semibold cursor-pointer select-none">
          <input type="checkbox" className="accent-brand w-4 h-4" checked={onlyPending} onChange={e => { setOnlyPending(e.target.checked); setPage(1) }} />
          Only vendors with pending payout
        </label>
      </div>

      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Vendor', 'Earned', 'Paid', 'Pending', 'On hold', 'Progress', 'Event earnings', 'Last paid'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">Loading vendors...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No vendors match</td></tr>
              ) : items.map(row => (
                <tr key={row.businessId} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => open(row.businessId)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.vendor.profileImg
                        ? <img src={row.vendor.profileImg} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black shrink-0">{row.vendor.username?.[0]?.toUpperCase()}</div>}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          {row.vendor.username}
                          {row.vendor.isDeleted && <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-bold">Deleted</span>}
                          {!row.vendor.isDeleted && !row.vendor.isActive && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">Inactive</span>}
                        </p>
                        <p className="text-[11px] text-slate-400">{[row.vendor.category, row.vendor.city].filter(Boolean).join(' · ') || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{fmtMoney(row.service.earned)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-success whitespace-nowrap">{fmtMoney(row.service.paid)}</td>
                  <td className="px-4 py-3 text-sm font-black text-warning whitespace-nowrap">{fmtMoney(row.service.pending)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{fmtMoney(row.service.onHold)}</td>
                  <td className="px-4 py-3"><SplitBar row={row.service} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{row.event.count ? `${fmtMoney(row.event.earned)} (${row.event.count})` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(row.service.lastPaidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} vendors</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
