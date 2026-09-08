import { useState, useEffect, useCallback, useMemo } from 'react'
import { getVendorPayments } from '../../api/finance'
import { ApiError } from '../../api/client'
import SearchableSelect from '../../components/SearchableSelect'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const YesNo = ({ ok, yes = 'Yes', no = 'No' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ok ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{ok ? yes : no}</span>
)

export default function VendorPaymentsPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [feeRef, setFeeRef] = useState(null)
  const [filterOptions, setFilterOptions] = useState({ cities: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ category: '', city: '', paymentStatus: '', from: '', to: '' })
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
    getVendorPayments(params)
      .then(data => {
        setItems(data.items || [])
        setPagination(data.pagination || { total: 0, page: 1, hasNextPage: false })
        setFeeRef(data.feeReference || null)
        if (data.filterOptions) setFilterOptions(data.filterOptions)
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load vendor payment records.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const anyFilter = filters.category || filters.city || filters.paymentStatus || filters.from || filters.to

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Vendor Payment Records</h1>
        <p className="text-sm text-slate-500 mt-0.5">Each vendor's registration fee, premium upgrade, and payment details</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
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
        <select className={selectCls} value={filters.paymentStatus} onChange={e => setF('paymentStatus', e.target.value)}>
          <option value="">Any payment status</option>
          <option value="PAID">Registration Paid</option>
          <option value="UNPAID">Registration Unpaid</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Registered</span>
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ category: '', city: '', paymentStatus: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {feeRef && (
        <p className="text-xs text-slate-400 -mt-2">
          Current fees: registration {fmtMoney(feeRef.registrationFeeAmount)}, premium {fmtMoney(feeRef.premiumFeeAmount)}. Shown per vendor only when paid — the exact amount charged isn't stored per vendor, so it reflects today's fee.
        </p>
      )}

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Vendor', 'City', 'Registration Fee', 'Premium Upgrade', 'Upgrade Date', 'Payment Method', 'Invoice', 'QR Revenue', 'Registered'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No vendor payment records match your filters</td></tr>
              ) : items.map(v => (
                <tr key={v.business._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-xs text-slate-800 leading-tight">{v.business.username}</p>
                    <p className="text-[11px] text-slate-400">{v.business.category || 'Uncategorized'}</p>
                    <p className="text-[10px] text-slate-300 font-mono">{v.business._id}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{v.city || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <YesNo ok={v.registrationFeePaid} yes="Paid" no="Unpaid" />
                    {v.registrationFeePaid && <span className="ml-2 text-xs font-bold text-slate-700">{fmtMoney(v.registrationFeeAmount)}</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <YesNo ok={v.premiumUpgrade} />
                    {v.premiumUpgrade && <span className="ml-2 text-xs font-bold text-slate-700">{fmtMoney(v.premiumFeeAmount)}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(v.upgradeDate)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{v.paymentMethod || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.invoiceUrl
                      ? <a href={v.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand hover:underline">View</a>
                      : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{v.qrRevenue ? fmtMoney(v.qrRevenue) : 'Planned'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} vendors</span>
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
