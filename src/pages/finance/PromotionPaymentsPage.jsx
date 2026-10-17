import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPromotionPayments, getPromotionPaymentDetails } from '../../api/finance'
import { ApiError } from '../../api/client'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN') : '—')

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const IconEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

function DetailRow({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}

const PAYMENT_STATUS_STYLES = {
  PENDING: 'bg-warning/10 text-warning',
  PAID: 'bg-success/10 text-success',
}
const REQUEST_STATUS_STYLES = {
  PAYMENT_PENDING: 'bg-warning/10 text-warning',
  PENDING: 'bg-info/10 text-info',
  ACCEPTED: 'bg-success/10 text-success',
  DECLINED: 'bg-danger/10 text-danger',
}

function PromotionPaymentDetailModal({ requestId, onClose }) {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error is the external-clock reset when requestId changes, not a derived-render value
    setLoading(true)
    setError('')
    getPromotionPaymentDetails(requestId)
      .then(data => { if (!cancelled) setRequest(data.request) })
      .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load promotion payment details.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [requestId])

  const payerName = request?.requestedByModel === 'Business'
    ? (request?.business?.username || '—')
    : (request?.user?.name || request?.user?.username || '—')
  const creatorName = request?.creator?.username || '—'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-800">Promotion Payment Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
          ) : error ? (
            <p className="text-sm text-danger font-semibold text-center py-8">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Paid By">{payerName} <span className="text-slate-400 text-xs">({request.requestedByModel})</span></DetailRow>
                <DetailRow label="Creator">{creatorName}</DetailRow>
              </div>
              <DetailRow label="Product / Service">{request.productServiceName}</DetailRow>
              {request.description && <DetailRow label="Description">{request.description}</DetailRow>}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Promotion Type">{request.promotionType?.replace('_', ' ')}</DetailRow>
                <DetailRow label="Delivery Timeline">{request.deliveryTimelineDays} days</DetailRow>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Request Status">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${REQUEST_STATUS_STYLES[request.status] || 'bg-slate-100 text-slate-500'}`}>{request.status?.replace('_', ' ')}</span>
                </DetailRow>
                <DetailRow label="Payment Status">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STATUS_STYLES[request.paymentStatus] || 'bg-slate-100 text-slate-500'}`}>{request.paymentStatus}</span>
                </DetailRow>
              </div>
              {Array.isArray(request.charges) && request.charges.length > 0 && (
                <DetailRow label="Payment Summary">
                  <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                    {request.charges.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500">{c.label}</span>
                        <span className="text-slate-700 font-semibold">{fmtMoney(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </DetailRow>
              )}
              <DetailRow label="Total Amount">{fmtMoney(request.totalAmount)}</DetailRow>
              <DetailRow label="Ad Policy Consent">{request.adPolicyConsent ? 'Yes' : 'No'}</DetailRow>
              <DetailRow label="Order ID">
                <span className="font-mono text-xs break-all">{request.razorpayOrderId ?? '—'}</span>
              </DetailRow>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Created">{fmtDateTime(request.createdAt)}</DetailRow>
                <DetailRow label="Responded On">{fmtDate(request.respondedAt)}</DetailRow>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PromotionPaymentsPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ paymentStatus: '', status: '', from: '', to: '' })
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }

  const [viewingId, setViewingId] = useState(null)

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
    getPromotionPayments(params)
      .then(data => {
        setItems(data.items || [])
        setPagination(data.pagination || { total: 0, page: 1, hasNextPage: false })
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load promotion payments.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const anyFilter = filters.paymentStatus || filters.status || filters.from || filters.to

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Promotion Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every Creator Promotion request payment (Business or User → Creator), as it happens — independent of the request's own accept/decline status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <select className={selectCls} value={filters.paymentStatus} onChange={e => setF('paymentStatus', e.target.value)}>
          <option value="">Any payment status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
        </select>
        <select className={selectCls} value={filters.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Any request status</option>
          <option value="PAYMENT_PENDING">Payment Pending</option>
          <option value="PENDING">Pending (awaiting creator)</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="DECLINED">Declined</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Created</span>
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ paymentStatus: '', status: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Paid By', 'Creator', 'Product/Service', 'Amount', 'Request Status', 'Payment Status', 'Order ID', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No promotion payments match your filters</td></tr>
              ) : items.map(r => (
                <tr key={r.requestId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-xs text-slate-800 leading-tight">{r.payer.name}</p>
                    <p className="text-[11px] text-slate-400">{r.payer.kind}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{r.creator.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{r.productServiceName}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{fmtMoney(r.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${REQUEST_STATUS_STYLES[r.requestStatus] || 'bg-slate-100 text-slate-500'}`}>{r.requestStatus?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STATUS_STYLES[r.paymentStatus] || 'bg-slate-100 text-slate-500'}`}>{r.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">{r.orderId || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewingId(r.requestId)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand/8 text-brand hover:bg-brand/15" title="View details"><IconEye /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} payments</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {viewingId && <PromotionPaymentDetailModal requestId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  )
}
