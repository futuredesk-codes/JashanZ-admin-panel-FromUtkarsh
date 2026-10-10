import { useState, useEffect, useCallback } from 'react'
import {
  getVendorSettlementSummary, getVendorPendingCommissions, getVendorSettlementHistory, markVendorPaymentDone,
} from '../../api/finance'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const PAYMENT_METHOD_LABEL = { BANK_TRANSFER: 'Bank Transfer', UPI: 'UPI', CASH: 'Cash', OTHER: 'Other' }
const SETTLEMENT_STATUS_STYLES = {
  TRANSFERRED: 'bg-success/10 text-success',
  QUEUED: 'bg-warning/10 text-warning',
  PROCESSING: 'bg-info/10 text-info',
  FAILED: 'bg-danger/10 text-danger',
}

/* ── Icons ── */
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconHistory = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 106 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Vendor Detail Modal — overview + the bookings/commissions making up the pending total ── */
function VendorDetailModal({ row, onClose, onMarkPaid }) {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the fetch's own setState calls are the fetch-on-mount trigger, not a derived-render value
    setLoading(true)
    setError('')
    getVendorPendingCommissions(row.businessId)
      .then(data => setCommissions(data.commissions || []))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load pending bookings.'))
      .finally(() => setLoading(false))
  }, [row.businessId])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {row.business.profileImg
              ? <img src={row.business.profileImg} alt={row.business.username} className="w-10 h-10 rounded-xl object-cover" />
              : <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black">{row.business.username?.[0]?.toUpperCase()}</div>}
            <div>
              <h3 className="font-black text-slate-800 text-base">{row.business.username}</h3>
              <p className="text-xs text-slate-400">{row.business.category || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Pending Amount</p>
              <p className="text-lg font-black text-warning">{fmtMoney(row.pendingAmount)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Pending Bookings</p>
              <p className="text-lg font-black text-slate-800">{row.pendingCount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Oldest Pending</p>
              <p className="text-sm font-bold text-slate-800">{fmtDate(row.oldestPendingAt)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Last Paid</p>
              <p className="text-sm font-bold text-slate-800">{fmtDate(row.lastPaidAt)}</p>
            </div>
          </div>

          {/* Bank details */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Payout Bank Details</p>
            {row.bank ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Account Holder', row.bank.holderName],
                  ['Account Number', row.bank.accountMasked],
                  ['Bank', row.bank.bankName],
                  ['IFSC Code', row.bank.bankIfsc],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                    <p className="text-sm font-bold text-slate-800">{v || '—'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No bank details on file for this vendor.</p>
            )}
          </div>

          {/* Bookings making up the pending total */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Bookings in This Pending Total</p>
            {loading ? (
              <p className="text-sm text-slate-400 py-8 text-center">Loading bookings...</p>
            ) : error ? (
              <p className="text-sm text-danger py-4">{error}</p>
            ) : commissions.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No pending bookings for this vendor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      {['Customer', 'Booking Date', 'Booking Amount', 'Commission', 'Vendor Payout', 'Completed On'].map(h => (
                        <th key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commissions.map(c => (
                      <tr key={c._id}>
                        <td className="py-2.5 pr-3 font-semibold text-slate-700 whitespace-nowrap">{c.booking?.user?.name || c.booking?.bookerBusiness?.username || '—'}</td>
                        <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">{fmtDate(c.booking?.bookingDate)}</td>
                        <td className="py-2.5 pr-3 text-slate-700 whitespace-nowrap">{fmtMoney(c.bookingAmount)}</td>
                        <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">{fmtMoney(c.commissionAmount)} ({c.commissionRate}%)</td>
                        <td className="py-2.5 pr-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(c.vendorRevenue)}</td>
                        <td className="py-2.5 text-slate-500 whitespace-nowrap">{fmtDateTime(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <button
            onClick={() => onMarkPaid(row)}
            disabled={row.pendingAmount <= 0}
            className="bg-success text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-success/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark Payment as Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Mark Payment as Done modal ── */
function MarkPaidModal({ row, onClose, onDone }) {
  const [amount, setAmount] = useState(String(row.pendingAmount))
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [note, setNote] = useState('')
  const [razorpayPayoutId, setRazorpayPayoutId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async () => {
    const amt = Number(amount)
    if (Number.isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    if (amt > row.pendingAmount) { setError(`Amount can't exceed the pending total of ${fmtMoney(row.pendingAmount)}.`); return }
    setSubmitting(true)
    setError('')
    try {
      const data = await markVendorPaymentDone(row.businessId, {
        amount: amt,
        paidAt: paidAt || undefined,
        paymentMethod,
        note: note.trim() || undefined,
        razorpayPayoutId: razorpayPayoutId.trim() || undefined,
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not mark payment as done.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onDone()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto"><IconCheck /></div>
          <div className="text-center">
            <h3 className="font-black text-slate-800 text-base">Payment Recorded</h3>
            <p className="text-sm text-slate-500 mt-1">
              {fmtMoney(result.settledAmount)} marked as paid to {row.business.username}.
              {result.remainingPending > 0 && ` ${result.remainingPending} booking(s) still pending — amount didn't cover the full total.`}
            </p>
          </div>
          <button onClick={onDone} className="w-full bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-base">Mark Payment as Done</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Paying <span className="font-bold text-slate-700">{row.business.username}</span> — pending total {fmtMoney(row.pendingAmount)} across {row.pendingCount} booking(s).
            Entering less than the full amount bundles only the oldest bookings that fit (never splits a single booking's commission).
          </p>

          {error && <div className="bg-danger/8 text-danger rounded-xl px-3 py-2.5 text-xs font-semibold">{error}</div>}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Amount (₹)</label>
            <input type="number" min="1" max={row.pendingAmount} className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Payment Date</label>
            <input type="date" className={inputCls} value={paidAt} onChange={e => setPaidAt(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Payment Method</label>
            <select className={inputCls} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              {Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Payout Reference (optional)</label>
            <input type="text" placeholder="Transaction / UTR / Razorpay payout ID" className={inputCls} value={razorpayPayoutId} onChange={e => setRazorpayPayoutId(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Note (optional)</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-success text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-success/90 disabled:opacity-50">
            {submitting ? 'Recording…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Settlement History modal ── */
function HistoryModal({ row, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the fetch's own setState calls are the fetch-on-mount trigger, not a derived-render value
    setLoading(true)
    setError('')
    getVendorSettlementHistory(row.businessId, { limit: 50 })
      .then(data => setItems(data.items || []))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load settlement history.'))
      .finally(() => setLoading(false))
  }, [row.businessId])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-base">Settlement History</h3>
            <p className="text-xs text-slate-400">{row.business.username}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Loading history...</p>
          ) : error ? (
            <p className="text-sm text-danger py-4">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No past settlements for this vendor yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    {['Amount', 'Bookings', 'Method', 'Reference', 'Status', 'Paid On', 'Note'].map(h => (
                      <th key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(s => (
                    <tr key={s._id}>
                      <td className="py-2.5 pr-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(s.totalAmount)}</td>
                      <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">{s.bookingCount}</td>
                      <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">{PAYMENT_METHOD_LABEL[s.paymentMethod] || '—'}</td>
                      <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap font-mono text-xs">{s.razorpayPayoutId || '—'}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${SETTLEMENT_STATUS_STYLES[s.status] || 'bg-slate-100 text-slate-500'}`}>{s.status}</span></td>
                      <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">{fmtDate(s.processedAt || s.scheduledAt)}</td>
                      <td className="py-2.5 text-slate-500 max-w-[200px] truncate" title={s.note || ''}>{s.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function VendorSettlementsPage() {
  const { can } = usePermissions()
  const canAct = can('adminFinance', 'WRITE')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [viewRow, setViewRow] = useState(null)
  const [payRow, setPayRow] = useState(null)
  const [historyRow, setHistoryRow] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getVendorSettlementSummary({ page, limit: 20, search: debouncedSearch })
      .then(data => { setItems(data.items || []); setPagination(data.pagination || { total: 0, page: 1, limit: 20, hasNextPage: false }) })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load vendor settlements.'))
      .finally(() => setLoading(false))
  }, [page, debouncedSearch])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const totalPending = items.reduce((sum, r) => sum + r.pendingAmount, 0)

  const handleMarkPaidFromView = (row) => {
    setViewRow(null)
    setPayRow(row)
  }

  const handlePaymentDone = () => {
    setPayRow(null)
    load()
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Vendor Settlements</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every vendor with a pending payout — view their bookings, record a payment, or check their settlement history</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vendors with Pending Payouts</p>
          <p className="text-2xl font-black text-slate-800">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Pending on This Page</p>
          <p className="text-2xl font-black text-warning">{fmtMoney(totalPending)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <input
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 w-full max-w-sm"
          placeholder="Search by vendor username..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Vendor', 'Category', 'Pending Amount', 'Pending Bookings', 'Oldest Pending', 'Last Paid', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading vendors...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No vendors with pending payouts</td></tr>
              ) : items.map(row => (
                <tr key={row.businessId} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewRow(row)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.business.profileImg
                        ? <img src={row.business.profileImg} alt={row.business.username} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black shrink-0">{row.business.username?.[0]?.toUpperCase()}</div>}
                      <p className="font-bold text-slate-800 text-xs">{row.business.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold whitespace-nowrap">{row.business.category || '—'}</td>
                  <td className="px-4 py-3 text-sm font-black text-warning whitespace-nowrap">{fmtMoney(row.pendingAmount)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{row.pendingCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(row.oldestPendingAt)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(row.lastPaidAt)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewRow(row)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15 transition-colors" title="View details"><IconEye /></button>
                      {canAct && (
                        <button onClick={() => setPayRow(row)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-success/8 text-success hover:bg-success/15 transition-colors" title="Mark payment as done"><IconCheck /></button>
                      )}
                      <button onClick={() => setHistoryRow(row)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" title="Payment history"><IconHistory /></button>
                    </div>
                  </td>
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

      {viewRow && (
        <VendorDetailModal
          row={viewRow}
          onClose={() => setViewRow(null)}
          onMarkPaid={canAct ? handleMarkPaidFromView : () => {}}
        />
      )}

      {payRow && <MarkPaidModal row={payRow} onClose={() => setPayRow(null)} onDone={handlePaymentDone} />}

      {historyRow && <HistoryModal row={historyRow} onClose={() => setHistoryRow(null)} />}
    </div>
  )
}
