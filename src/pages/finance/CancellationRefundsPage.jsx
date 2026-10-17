import { useState, useEffect, useCallback, useMemo } from 'react'
import { getCancellationRefunds, initiateCancellationRefund, getCancellationRefundHistory } from '../../api/finance'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'

const STATUS_STYLES = {
  PROCESSED: 'bg-success/10 text-success',
  INITIATED: 'bg-info/10 text-info',
  FAILED: 'bg-danger/10 text-danger',
}
const REFUND_STATUSES = ['INITIATED', 'PROCESSED', 'FAILED']

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const shortId = id => (id ? String(id).slice(-8).toUpperCase() : '—')
const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

function DetailRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? 'font-black text-slate-800' : 'font-semibold text-slate-800'}>{value}</span>
    </div>
  )
}

const fmtRate = r => (r != null ? `${Number(r).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%` : null)

/* ── View order details + fee breakdown ── */
function ViewModal({ booking, onClose }) {
  const feesKnown = booking.platformFee != null && booking.markupAmount != null
  const unknownRefund = booking.refunded && booking.refundAmount == null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Booking Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconClose /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5 text-sm">
            <DetailRow label="Booking ID" value={shortId(booking.sourceId)} />
            <DetailRow label="Payer" value={booking.payer?.name} />
            <DetailRow label="Vendor" value={booking.vendor?.name} />
            <DetailRow label="Service" value={booking.description} />
            <DetailRow label="Paid on" value={fmtDate(booking.paidAt)} />
            <DetailRow label="Gateway order" value={booking.orderId || 'None (manual refund)'} />
            <DetailRow
              label="Status"
              value={booking.refunded ? (booking.refundStatus === 'FAILED' ? 'Refund failed' : 'Refunded') : 'Not yet refunded'}
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Amount Breakdown</p>
            <DetailRow label="Total booking amount" value={fmtMoney(booking.grossAmount)} bold />
            <DetailRow
              label={`Platform commission${booking.commissionRate != null ? ` (${fmtRate(booking.commissionRate)})` : ''}`}
              value={feesKnown ? `- ${fmtMoney(booking.platformFee)}` : '—'}
            />
            <DetailRow
              label={`Markup charges${booking.markupRate != null ? ` (${fmtRate(booking.markupRate)})` : ''}`}
              value={feesKnown ? `- ${fmtMoney(booking.markupAmount)}` : '—'}
            />
            {!feesKnown && !unknownRefund && <DetailRow label="Total withheld" value={`- ${fmtMoney(booking.deductedFee)}`} />}
            <p className="text-[10px] text-slate-400 pt-0.5">Rate applied at the time this booking was created.</p>
            <div className="border-t border-slate-200 pt-1.5 mt-1.5">
              {unknownRefund
                ? <DetailRow label="Refunded amount" value="Unknown — refunded outside this flow" bold />
                : <DetailRow label={booking.refunded ? 'Refunded amount' : 'Refundable amount'} value={fmtMoney(booking.refundAmount)} bold />}
            </div>
            {unknownRefund && (
              <p className="text-[10px] text-slate-400 pt-1">This booking's payment is marked REFUNDED, but no cancellation-refund record exists for it — it was likely refunded through the generic Refund Management flow before this page's fee-withholding logic applied.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Confirm-refund modal ── */
function RefundModal({ booking, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (reason.trim().length < 3) { setError('Please give a short reason (min 3 characters).'); return }
    setSubmitting(true); setError('')
    try {
      const res = await initiateCancellationRefund({ bookingId: booking.sourceId, reason: reason.trim() })
      onDone(res?.refund)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not process the refund.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Refund Cancelled Booking</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconClose /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
            {[
              ['Refund to', booking.payer?.name],
              ['Vendor', booking.vendor?.name],
              ['Payment', booking.description],
              ['Amount paid', fmtMoney(booking.grossAmount)],
              ['Commission + markup withheld', `- ${fmtMoney(booking.deductedFee)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 mt-1.5">
              <span className="text-slate-700 font-bold">Refund amount</span>
              <span className="font-black text-slate-800">{fmtMoney(booking.refundAmount)}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {booking.orderId ? 'Issued via the payment gateway.' : 'No gateway order on file — this will be recorded as a manual refund.'}
          </p>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Reason <span className="text-danger">*</span></label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this being refunded?" className={`${selectCls} w-full resize-none`} />
          </div>
          {error && <p className="text-xs text-danger font-semibold">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button onClick={submit} disabled={submitting} className="flex-1 bg-danger text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-danger/90 disabled:opacity-50">
              {submitting ? 'Processing…' : `Refund ${fmtMoney(booking.refundAmount)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── View a history row's full details ── */
function HistoryViewModal({ refund, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Refund Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconClose /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5 text-sm">
            <DetailRow label="Booking ID" value={shortId(refund.sourceId)} />
            <DetailRow label="Refunded to" value={refund.payer?.name} />
            <DetailRow label="Vendor" value={refund.vendor?.name} />
            <DetailRow label="Reason" value={refund.reason} />
            <DetailRow label="Method" value={refund.method === 'GATEWAY' ? 'Payment gateway' : 'Manual'} />
            <DetailRow label="Gateway refund ID" value={refund.gatewayRefundId || 'None'} />
            <DetailRow label="Initiated by" value={refund.initiatedBy} />
            <DetailRow label="Date" value={fmtDate(refund.createdAt)} />
            <DetailRow
              label="Status"
              value={<span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[refund.status] || 'bg-slate-100 text-slate-500'}`}>{refund.status}</span>}
            />
            {refund.failureReason && <DetailRow label="Failure reason" value={refund.failureReason} />}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Amount Breakdown</p>
            <DetailRow label="Commission + markup withheld" value={refund.deductedFee != null ? `- ${fmtMoney(refund.deductedFee)}` : '—'} />
            <div className="border-t border-slate-200 pt-1.5 mt-1.5">
              <DetailRow label="Refunded amount" value={fmtMoney(refund.amount)} bold />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Refund history — only refunds issued through this page's own flow ── */
function HistoryPanel() {
  const [items, setItems] = useState([])
  const [viewingRefund, setViewingRefund] = useState(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', from: '', to: '' })
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to)
  const anyFilter = filters.status || filters.from || filters.to

  const params = useMemo(() => {
    const p = { page, limit: 20 }
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v })
    return p
  }, [page, filters])

  const load = useCallback(() => {
    if (invalidRange) return
    setLoading(true); setError('')
    getCancellationRefundHistory(params)
      .then(d => {
        setItems(d.items || [])
        setPagination(d.pagination || { total: 0, page: 1, hasNextPage: false })
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load refund history.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-black text-slate-800 mr-1">Refund History</span>
        <select className={selectCls} value={filters.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Any status</option>
          {REFUND_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ status: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Refunded To', 'Vendor', 'Refunded Amount', 'Withheld', 'Reason', 'Method', 'Status', 'Gateway Ref', 'By', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400 text-sm">No cancellation refunds match your filters</td></tr>
              ) : items.map(r => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.payer?.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{r.deductedFee != null ? `- ${fmtMoney(r.deductedFee)}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-48 truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.method === 'GATEWAY' ? 'Gateway' : 'Manual'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-500'}`} title={r.failureReason || ''}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">{r.gatewayRefundId ? shortId(r.gatewayRefundId) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.initiatedBy}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewingRefund(r)} title="View details" className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><IconEye /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} refunds</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {viewingRefund && <HistoryViewModal refund={viewingRefund} onClose={() => setViewingRefund(null)} />}
    </div>
  )
}

export default function CancellationRefundsPage() {
  const { can } = usePermissions()
  const canInitiate = can('financeBookingCancellations', 'FULL')
  const [view, setView] = useState('cancellable')

  const [vendorId, setVendorId] = useState('')
  const [vendors, setVendors] = useState([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalBooking, setModalBooking] = useState(null)
  const [viewingBooking, setViewingBooking] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoading(true); setError('')
    getCancellationRefunds({ vendorId: vendorId || undefined, page, limit: 20, search: debounced || undefined })
      .then(d => {
        setItems(d.items || [])
        setVendors(d.vendors || [])
        setPagination(d.pagination || { total: 0, page: 1, hasNextPage: false })
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load cancelled bookings.'))
      .finally(() => setLoading(false))
  }, [vendorId, page, debounced])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-change trigger
  useEffect(() => { load() }, [load])

  const handleDone = (refund) => {
    setModalBooking(null)
    setToast(refund?.status === 'FAILED' ? 'Gateway refused the refund — check the refund logs.' : 'Refund processed.')
    setTimeout(() => setToast(''), 3500)
    load()
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Booking Cancellation Refunds</h1>
        <p className="text-sm text-slate-500 mt-0.5">Refund cancelled or rejected bookings — commission and markup are withheld automatically before the refund is issued.</p>
      </div>

      {!canInitiate && (
        <p className="text-xs text-slate-400">Refunding needs full access on this page — ask a Finance Admin.</p>
      )}

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'cancellable', label: 'Cancelled Bookings' },
          { key: 'history', label: 'Refund History' },
        ].map(b => (
          <button
            key={b.key}
            onClick={() => setView(b.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${view === b.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {view === 'history' ? <HistoryPanel /> : (
      <>
      {toast && <p className="text-xs font-semibold text-success bg-success/10 rounded-xl px-3 py-2">{toast}</p>}
      {error && <p className="text-xs text-danger font-semibold">{error}</p>}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select className={selectCls} value={vendorId} onChange={e => { setVendorId(e.target.value); setPage(1) }}>
            <option value="">All vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input className={`${selectCls} flex-1 min-w-48`} placeholder="Search payer / vendor / booking id…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Payer', 'Vendor', 'Payment', 'Amount Paid', 'Withheld', 'Refund Amount', 'Paid', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">No cancelled bookings here</td></tr>
              ) : items.map(b => (
                <tr key={String(b.sourceId)} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-800">{b.payer?.name}</p>
                    <p className="text-[10px] text-slate-300 font-mono">{shortId(b.sourceId)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{b.vendor?.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.description}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{fmtMoney(b.grossAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{b.deductedFee != null ? `- ${fmtMoney(b.deductedFee)}` : '—'}</td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{b.refunded && b.refundAmount == null ? <span className="font-normal text-slate-400 text-xs">Unknown</span> : fmtMoney(b.refundAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(b.paidAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingBooking(b)} title="View details" className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><IconEye /></button>
                      {b.refunded
                        ? <span className="text-[11px] font-bold text-slate-400">{b.refundStatus === 'FAILED' ? 'Failed' : 'Refunded'}</span>
                        : canInitiate
                          ? <button onClick={() => setModalBooking(b)} className="text-xs font-bold text-danger hover:underline">Refund</button>
                          : <span className="text-[11px] text-slate-300">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
      </>
      )}

      {modalBooking && <RefundModal booking={modalBooking} onClose={() => setModalBooking(null)} onDone={handleDone} />}
      {viewingBooking && <ViewModal booking={viewingBooking} onClose={() => setViewingBooking(null)} />}
    </div>
  )
}
