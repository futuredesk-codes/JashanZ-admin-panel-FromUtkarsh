import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getVendorLedger, getVendorLedgerBookings, getVendorLedgerSettlements, getVendorLedgerEventSales,
} from '../../api/finance'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'
import {
  fmtMoney, fmtDate, fmtDateTime, STATUS_LABEL, STATUS_STYLES, PAYMENT_METHOD_LABEL, selectCls, splitPercents,
} from './vendorLedgerUtils'

/* ── small shared pieces ── */

function StatusPill({ status }) {
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABEL[status] || status}</span>
}

function Kpi({ label, value, hint, tone = 'text-slate-800' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{hint}</p>
    </div>
  )
}

function Pager({ pagination, page, setPage, noun }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
      <span>Showing {Math.min(pagination.limit * (page - 1) + 1, pagination.total) || 0}–{Math.min(pagination.limit * page, pagination.total)} of {pagination.total} {noun}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
        <span className="font-semibold text-slate-500">Page {page} of {pagination.totalPages}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
      </div>
    </div>
  )
}

const TH = ({ children }) => (
  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{children}</th>
)

const emptyPagination = { total: 0, limit: 20, totalPages: 1, hasNextPage: false }

// Loads one paginated list; refetches whenever its params change.
function useLedgerList(fetcher, businessId, params, page) {
  const [state, setState] = useState({ items: [], sums: null, pagination: emptyPagination })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const key = JSON.stringify(params)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetcher(businessId, { ...JSON.parse(key), page, limit: 20 })
      .then(res => setState({ items: res.items || [], sums: res.sums || null, pagination: res.pagination || emptyPagination }))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load this list.'))
      .finally(() => setLoading(false))
  }, [fetcher, businessId, key, page])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  return { ...state, loading, error }
}

/* ── Tab: bookings (the commissions behind Earned / Paid / Pending / On hold) ── */
function BookingsTab({ businessId, filter, setFilter, settlementInfo, onShowPayout }) {
  const [page, setPage] = useState(1)
  const params = {
    status: filter.status || undefined, from: filter.from || undefined, to: filter.to || undefined, settlementId: filter.settlementId || undefined,
  }
  const { items, sums, pagination, loading, error } = useLedgerList(getVendorLedgerBookings, businessId, params, page)
  const update = (patch) => { setFilter(f => ({ ...f, ...patch })); setPage(1) }
  const anyFilter = filter.status || filter.from || filter.to

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <select className={selectCls} value={filter.status} onChange={e => update({ status: e.target.value })} aria-label="Status">
          <option value="">All statuses</option>
          <option value="PENDING">Pending (owed)</option>
          <option value="SETTLED">Paid</option>
          <option value="ON_HOLD">On hold</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-500 font-semibold">From
          <input type="date" max={filter.to || undefined} className={selectCls} value={filter.from} onChange={e => update({ from: e.target.value })} />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500 font-semibold">To
          <input type="date" min={filter.from || undefined} className={selectCls} value={filter.to} onChange={e => update({ to: e.target.value })} />
        </label>
        {anyFilter && (
          <button onClick={() => update({ status: '', from: '', to: '' })} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
        <p className="ml-auto text-xs text-slate-400">Dates are the day the booking was marked completed.</p>
      </div>

      {filter.settlementId && (
        <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3 text-xs text-slate-700 flex items-center justify-between gap-3">
          <span>
            Showing only the bookings covered by the payout of <b>{settlementInfo ? fmtMoney(settlementInfo.amount) : '…'}</b>
            {settlementInfo?.paidAt ? <> on <b>{fmtDate(settlementInfo.paidAt)}</b></> : null}.
          </span>
          <button onClick={() => update({ settlementId: '' })} className="font-bold text-info hover:underline shrink-0">Show all bookings</button>
        </div>
      )}

      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Completed on', 'Booking', 'Booking amount', 'Commission', 'Vendor share', 'Status', 'Payout'].map(h => <TH key={h}>{h}</TH>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading bookings...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No bookings match</td></tr>
              ) : items.map(r => (
                <tr key={r.commissionId} className="hover:bg-slate-50/60 align-top">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.completedAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-800">{r.serviceName || 'Booking'}</p>
                    <p className="text-[11px] text-slate-400">{r.customer || '—'} · {fmtDate(r.bookingDate)}{r.startTime ? ` ${r.startTime}` : ''} · {r.paymentMethod === 'CASH' ? 'Cash' : 'Online'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">{fmtMoney(r.bookingAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {fmtMoney(r.commissionAmount + r.markupAmount)}
                    <span className="block text-[10px] text-slate-400">{r.commissionRate}%{r.markupAmount > 0 ? ` + ${fmtMoney(r.markupAmount)} markup` : ''}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-slate-800 whitespace-nowrap">{fmtMoney(r.vendorRevenue)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                    {r.holdReason && <p className="text-[10px] text-slate-400 mt-1 max-w-48 leading-snug">{r.holdReason}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.settlement ? (
                      <button onClick={() => onShowPayout(r.settlement.settlementId)} className="text-left group" title="Open this payout">
                        <span className="block text-xs font-bold text-info group-hover:underline">{fmtMoney(r.settlement.amount)} paid</span>
                        <span className="block text-[10px] text-slate-400">{fmtDate(r.settlement.paidAt || r.settledAt)} · {PAYMENT_METHOD_LABEL[r.settlement.method] || r.settlement.method || '—'}</span>
                      </button>
                    ) : <span className="text-xs text-slate-300">{r.status === 'PENDING' ? 'Not paid yet' : '—'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sums && !loading && items.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Vendor share (all {pagination.total} matching): <b className="text-slate-800">{fmtMoney(sums.vendorRevenue)}</b></span>
            <span>Platform revenue from them: <b className="text-slate-800">{fmtMoney(sums.platformRevenue)}</b></span>
          </div>
        )}
        <Pager pagination={pagination} page={page} setPage={setPage} noun="bookings" />
      </div>
    </div>
  )
}

/* ── Tab: payouts (every Settlement; each links to the bookings it covered) ── */
function PayoutsTab({ businessId, highlightId, onShowBookings }) {
  const [page, setPage] = useState(1)
  const { items, sums, pagination, loading, error } = useLedgerList(getVendorLedgerSettlements, businessId, {}, page)

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Paid on', 'Amount', 'Method', 'Reference / UTR', 'Note', 'Bookings covered', 'Status'].map(h => <TH key={h}>{h}</TH>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading payouts...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No payouts recorded for this vendor yet</td></tr>
              ) : items.map(s => (
                <tr key={s.settlementId} className={`align-top ${String(s.settlementId) === String(highlightId) ? 'bg-info/8' : 'hover:bg-slate-50/60'}`}>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtDateTime(s.paidAt || s.recordedAt)}</td>
                  <td className="px-4 py-3 text-sm font-black text-success whitespace-nowrap">{fmtMoney(s.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{PAYMENT_METHOD_LABEL[s.method] || s.method || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{s.reference || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-56">{s.note || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => onShowBookings(s)} className="text-xs font-bold text-info hover:underline whitespace-nowrap">
                      {s.bookingCount} booking{s.bookingCount === 1 ? '' : 's'} →
                    </button>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${s.status === 'TRANSFERRED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sums && !loading && items.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            Total recorded payouts: <b className="text-slate-800">{fmtMoney(sums.amount)}</b>
          </div>
        )}
        <Pager pagination={pagination} page={page} setPage={setPage} noun="payouts" />
      </div>
    </div>
  )
}

/* ── Tab: event ticket earnings (no payout flow exists yet) ── */
function EventsTab({ businessId }) {
  const [page, setPage] = useState(1)
  const { items, sums, pagination, loading, error } = useLedgerList(getVendorLedgerEventSales, businessId, {}, page)

  return (
    <div className="space-y-4">
      <div className="bg-warning/8 border border-warning/25 rounded-xl px-4 py-3 text-xs text-slate-700 leading-relaxed">
        <b>No payout flow for event tickets yet.</b> Amounts here are what the vendor earned from accepted tickets (ticket price after the 10.5% platform commission). They are not part of Pending Vendor Settlements, so paying them out has to be tracked outside this portal for now.
      </div>
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Accepted on', 'Event', 'Customer', 'Ticket total', 'Commission', 'Vendor share', 'Status'].map(h => <TH key={h}>{h}</TH>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading event tickets...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No event ticket earnings</td></tr>
              ) : items.map(r => (
                <tr key={r.commissionId} className="hover:bg-slate-50/60 align-top">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.acceptedAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-800">{r.eventName || 'Event'}</p>
                    <p className="text-[11px] text-slate-400">{fmtDate(r.eventDate)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.customer || '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">{r.ticketTotal != null ? fmtMoney(r.ticketTotal) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtMoney(r.commissionAmount)}<span className="block text-[10px] text-slate-400">{r.commissionRate}%</span></td>
                  <td className="px-4 py-3 text-sm font-black text-slate-800 whitespace-nowrap">{fmtMoney(r.vendorRevenue)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                    {r.holdReason && <p className="text-[10px] text-slate-400 mt-1 max-w-48 leading-snug">{r.holdReason}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sums && !loading && items.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex flex-wrap gap-x-6">
            <span>Vendor share (all {pagination.total}): <b className="text-slate-800">{fmtMoney(sums.vendorRevenue)}</b></span>
            <span>Platform revenue: <b className="text-slate-800">{fmtMoney(sums.platformRevenue)}</b></span>
          </div>
        )}
        <Pager pagination={pagination} page={page} setPage={setPage} noun="tickets" />
      </div>
    </div>
  )
}

/* ── Page ── */
export default function VendorLedgerDetailPage() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canPay = can('financeVendorSettlements', 'FULL')

  const [ledger, setLedger] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('bookings')
  const [bookingFilter, setBookingFilter] = useState({ status: '', from: '', to: '', settlementId: '' })
  const [settlementInfo, setSettlementInfo] = useState(null)
  const [highlightId, setHighlightId] = useState('')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getVendorLedger(businessId)
        if (!cancelled) setLedger(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this vendor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [businessId])

  // payout → the bookings it paid
  const showBookingsOfPayout = (s) => {
    setSettlementInfo({ amount: s.amount, paidAt: s.paidAt || s.recordedAt })
    setBookingFilter({ status: '', from: '', to: '', settlementId: s.settlementId })
    setTab('bookings')
  }
  // booking → the payout that paid it
  const showPayout = (settlementId) => {
    setHighlightId(settlementId)
    setTab('payouts')
  }
  const changeTab = (next) => {
    if (next === 'bookings' && tab !== 'bookings') setBookingFilter(f => ({ ...f, settlementId: '' }))
    if (next !== 'payouts') setHighlightId('')
    setTab(next)
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Loading vendor ledger...</div>
  if (error || !ledger) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/finance/vendor-ledger')} className="text-xs font-bold text-info hover:underline">← Vendor Ledger</button>
        <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error || 'Vendor not found.'}</div>
      </div>
    )
  }

  const { vendor, service, event, settlements, bookings, checks } = ledger
  const p = splitPercents(service)
  const reconciled = checks.statusesAddUp.ok && checks.settlementsMatch.ok

  const tabs = [
    { id: 'bookings', label: 'Bookings', count: service.count },
    { id: 'payouts', label: 'Payouts', count: settlements.count },
    { id: 'events', label: 'Event tickets', count: event.count },
  ]

  return (
    <div className="space-y-5 pb-6">
      <button onClick={() => navigate('/finance/vendor-ledger')} className="text-xs font-bold text-info hover:underline">← Vendor Ledger</button>

      {/* Vendor header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-wrap items-start gap-5">
        {vendor.profileImg
          ? <img src={vendor.profileImg} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          : <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-black shrink-0">{vendor.username?.[0]?.toUpperCase()}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-800">{vendor.username}</h2>
            {vendor.isDeleted && <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[11px] font-bold">Account deleted</span>}
            {!vendor.isDeleted && !vendor.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">Inactive</span>}
            {vendor.status === 'VERIFIED' && <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-bold">Verified</span>}
            {vendor.isRegistrationPaid && <span className="px-2 py-0.5 rounded-full bg-info/10 text-info text-[11px] font-bold">Registration fee paid</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{[vendor.category, vendor.city].filter(Boolean).join(' · ') || '—'}{vendor.joinedAt ? ` · joined ${fmtDate(vendor.joinedAt)}` : ''}</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs">
            <div><span className="text-slate-400">Phone</span><p className="font-semibold text-slate-700">{vendor.phone || '—'}</p></div>
            <div>
              <span className="text-slate-400">Commission rate</span>
              <p className="font-semibold text-slate-700">{vendor.commissionRate}% <span className="text-slate-400 font-normal">{vendor.hasCustomCommissionRate ? '(custom for this vendor)' : '(platform default)'}</span></p>
            </div>
            <div>
              <span className="text-slate-400">Payout bank account</span>
              {vendor.bank ? (
                <p className="font-semibold text-slate-700">
                  {vendor.bank.bankName || 'Bank'} {vendor.bank.accountMasked}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${vendor.bank.verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{vendor.bank.verified ? 'Verified' : 'Not verified'}</span>
                  <span className="block text-slate-400 font-normal">{vendor.bank.holderName || '—'} · {vendor.bank.ifsc || '—'}</span>
                </p>
              ) : <p className="font-semibold text-danger">No bank account on file</p>}
            </div>
          </div>
        </div>
        {canPay && service.pending > 0 && !vendor.isDeleted && (
          <button
            onClick={() => navigate(`/finance/vendor-settlements?search=${encodeURIComponent(vendor.username)}`)}
            className="px-4 py-2.5 rounded-xl bg-success text-white text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
          >
            Pay {fmtMoney(service.pending)}
          </button>
        )}
      </div>

      {/* Money flow */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="In progress" value={fmtMoney(bookings.inProgressAmount)} hint={`${bookings.inProgress} upcoming / active booking${bookings.inProgress === 1 ? '' : 's'} — not earned until completed`} tone="text-slate-400" />
        <Kpi label="Earned" value={fmtMoney(service.earned)} hint={`Vendor share of ${service.count} completed booking${service.count === 1 ? '' : 's'}`} />
        <Kpi label="Paid" value={fmtMoney(service.paid)} hint={service.lastPaidAt ? `Last payout ${fmtDate(service.lastPaidAt)}${service.lastPaidAmount != null ? ` · ${fmtMoney(service.lastPaidAmount)}` : ''}` : 'No payout yet'} tone="text-success" />
        <Kpi label="Pending payout" value={fmtMoney(service.pending)} hint={service.pendingCount ? `${service.pendingCount} booking${service.pendingCount === 1 ? '' : 's'} · oldest since ${fmtDate(service.oldestPendingAt)}` : 'Nothing owed'} tone="text-warning" />
        <Kpi label="On hold" value={fmtMoney(service.onHold)} hint="Held because the payment was refunded" tone="text-slate-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-bold text-slate-700">Where the {fmtMoney(service.earned)} earned stands</span>
          <span className="text-slate-400">Platform kept {fmtMoney(service.platformRevenue)} (commission + markup) on these bookings</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100" role="img" aria-label={`Paid ${p.paid}%, pending ${p.pending}%, on hold ${p.onHold}%`}>
          <div className="bg-success" style={{ width: `${p.paid}%` }} />
          <div className="bg-warning" style={{ width: `${p.pending}%` }} />
          <div className="bg-slate-300" style={{ width: `${p.onHold}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[11px] text-slate-500">
          <span><i className="inline-block w-2 h-2 rounded-full bg-success mr-1.5" />Paid {p.paid}%</span>
          <span><i className="inline-block w-2 h-2 rounded-full bg-warning mr-1.5" />Pending {p.pending}%</span>
          <span><i className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1.5" />On hold {p.onHold}%</span>
        </div>
        <div className={`mt-3 rounded-lg px-3 py-2 text-[11px] leading-relaxed ${reconciled ? 'bg-success/8 text-success' : 'bg-danger/8 text-danger'}`}>
          {reconciled ? (
            <>✓ Numbers reconcile: Earned = Paid + Pending + On hold, and recorded payouts ({fmtMoney(settlements.transferred)}) match the bookings marked paid.</>
          ) : (
            <>
              ⚠ These numbers don't reconcile — check before paying.
              {!checks.statusesAddUp.ok && <> Earned {fmtMoney(checks.statusesAddUp.earned)} ≠ Paid + Pending + On hold {fmtMoney(checks.statusesAddUp.accountedFor)}.</>}
              {!checks.settlementsMatch.ok && <> Payouts recorded {fmtMoney(checks.settlementsMatch.transferredSettlements)} ≠ bookings marked paid {fmtMoney(checks.settlementsMatch.settledCommissions)}.</>}
            </>
          )}
        </div>
      </div>

      {event.count > 0 && (
        <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3 text-xs text-slate-700">
          Also earned from <b>{event.count} event ticket{event.count === 1 ? '' : 's'}</b>: <b>{fmtMoney(event.earned)}</b> ({fmtMoney(event.pending)} pending). Kept separate because event tickets have no payout flow yet — see the “Event tickets” tab.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => changeTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold -mb-px border-b-2 transition-colors ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t.label} <span className="ml-1 text-[11px] font-semibold text-slate-400">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <BookingsTab businessId={businessId} filter={bookingFilter} setFilter={setBookingFilter} settlementInfo={settlementInfo} onShowPayout={showPayout} />
      )}
      {tab === 'payouts' && <PayoutsTab businessId={businessId} highlightId={highlightId} onShowBookings={showBookingsOfPayout} />}
      {tab === 'events' && <EventsTab businessId={businessId} />}
    </div>
  )
}
