import { useState, useEffect, useCallback, useMemo } from 'react'
import { getBookingPayments, getBookingPaymentDetails, deleteBookingPayment } from '../../api/finance'
import { ApiError } from '../../api/client'
import SearchableSelect from '../../components/SearchableSelect'
import ConfirmDialog from '../../components/ConfirmDialog'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN') : '—')

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const IconEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
  FAILED: 'bg-danger/10 text-danger',
  REFUNDED: 'bg-slate-100 text-slate-500',
}
const BOOKING_STATUS_STYLES = {
  PAYMENT_PENDING: 'bg-warning/10 text-warning',
  PENDING: 'bg-info/10 text-info',
  CONFIRMED: 'bg-brand/10 text-brand',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
}

function BookingPaymentDetailModal({ bookingId, onClose }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error is the external-clock reset when bookingId changes, not a derived-render value
    setLoading(true)
    setError('')
    getBookingPaymentDetails(bookingId)
      .then(data => { if (!cancelled) setBooking(data.booking) })
      .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load booking details.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [bookingId])

  const payerName = booking?.user?.name || booking?.user?.username || booking?.bookerBusiness?.username || '—'
  const vendorName = booking?.business?.username || '—'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-800">Booking Payment Details</h3>
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
                <DetailRow label="Paid By">{payerName}</DetailRow>
                <DetailRow label="Vendor">{vendorName}</DetailRow>
              </div>
              <DetailRow label="Service">{booking.service?.name ?? '—'}{booking.serviceType ? ` (${booking.serviceType})` : ''}</DetailRow>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Booking Status">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BOOKING_STATUS_STYLES[booking.status] || 'bg-slate-100 text-slate-500'}`}>{booking.status?.replace('_', ' ')}</span>
                </DetailRow>
                <DetailRow label="Payment Status">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STATUS_STYLES[booking.paymentStatus] || 'bg-slate-100 text-slate-500'}`}>{booking.paymentStatus}</span>
                </DetailRow>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Subtotal">{fmtMoney(booking.subtotal)}</DetailRow>
                <DetailRow label="Facilities Total">{fmtMoney(booking.facilitiesTotal)}</DetailRow>
              </div>
              <DetailRow label="Total Amount">{fmtMoney(booking.totalAmount)}</DetailRow>
              {Array.isArray(booking.selectedTickets) && booking.selectedTickets.length > 0 && (
                <DetailRow label="Tickets">
                  <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                    {booking.selectedTickets.map((t, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500">{t.name || t.className || `Ticket ${i + 1}`} × {t.quantity ?? 1}</span>
                        <span className="text-slate-700 font-semibold">{fmtMoney(t.price)}</span>
                      </div>
                    ))}
                  </div>
                </DetailRow>
              )}
              {Array.isArray(booking.selectedFacilities) && booking.selectedFacilities.length > 0 && (
                <DetailRow label="Facilities">
                  <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                    {booking.selectedFacilities.map((f, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500">{f.name || `Facility ${i + 1}`}</span>
                        <span className="text-slate-700 font-semibold">{fmtMoney(f.price)}</span>
                      </div>
                    ))}
                  </div>
                </DetailRow>
              )}
              <DetailRow label="Order ID">
                <span className="font-mono text-xs break-all">{booking.razorpayOrderId ?? '—'}</span>
              </DetailRow>
              {booking.notes && <DetailRow label="Notes">{booking.notes}</DetailRow>}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Booking Date">{fmtDate(booking.bookingDate)}</DetailRow>
                <DetailRow label="Paid On">{fmtDateTime(booking.createdAt)}</DetailRow>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingPaymentsPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [filterOptions, setFilterOptions] = useState({ cities: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ category: '', city: '', paymentStatus: '', from: '', to: '' })
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }

  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
    getBookingPayments(params)
      .then(data => {
        setItems(data.items || [])
        setPagination(data.pagination || { total: 0, page: 1, hasNextPage: false })
        if (data.filterOptions) setFilterOptions(data.filterOptions)
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load booking payments.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const anyFilter = filters.category || filters.city || filters.paymentStatus || filters.from || filters.to

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteBookingPayment(deleteTarget.bookingId)
      setItems(prev => prev.filter(b => b.bookingId !== deleteTarget.bookingId))
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this booking payment.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Booking Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every online booking payment made by a user, as it happens — independent of the booking's own status</p>
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
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Paid</span>
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ category: '', city: '', paymentStatus: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}
      {deleteError && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{deleteError}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Paid By', 'Vendor', 'Service', 'Amount', 'Booking Status', 'Payment Status', 'Order ID', 'Paid On', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No booking payments match your filters</td></tr>
              ) : items.map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-xs text-slate-800 leading-tight">{b.payer.name}</p>
                    <p className="text-[11px] text-slate-400">{b.payer.kind}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{b.vendor.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{b.service}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{fmtMoney(b.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BOOKING_STATUS_STYLES[b.bookingStatus] || 'bg-slate-100 text-slate-500'}`}>{b.bookingStatus?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STATUS_STYLES[b.paymentStatus] || 'bg-slate-100 text-slate-500'}`}>{b.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">{b.orderId || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(b.paidAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewingId(b.bookingId)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand/8 text-brand hover:bg-brand/15" title="View details"><IconEye /></button>
                      <button onClick={() => setDeleteTarget(b)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15" title="Delete"><IconTrash /></button>
                    </div>
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

      {viewingId && <BookingPaymentDetailModal bookingId={viewingId} onClose={() => setViewingId(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this booking payment?"
          message={`This will hide ${deleteTarget.payer?.name || 'this payment'}'s booking (₹${Number(deleteTarget.amount || 0).toLocaleString('en-IN')}) from this list and from the customer's/vendor's own booking lists. The record is kept, not permanently removed.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
        />
      )}
    </div>
  )
}
