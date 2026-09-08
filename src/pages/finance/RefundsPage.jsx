import { useState, useEffect, useCallback, useMemo } from 'react'
import { getRefundablePayments, getRefunds, initiateRefund } from '../../api/finance'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'

const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN') : '—')
const shortId = id => (id ? String(id).slice(-8).toUpperCase() : '—')
const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

const SOURCE_TABS = [
  { key: 'BOOKING', label: 'Bookings' },
  { key: 'WALLET_TXN', label: 'Wallet Purchases' },
  { key: 'REGISTRATION_FEE', label: 'Registration Fees' },
]
const SOURCE_LABEL = { BOOKING: 'Booking', WALLET_TXN: 'Wallet Purchase', REGISTRATION_FEE: 'Registration Fee' }
const STATUS_STYLES = {
  PROCESSED: 'bg-success/10 text-success',
  INITIATED: 'bg-info/10 text-info',
  FAILED: 'bg-danger/10 text-danger',
}
const REFUND_STATUSES = ['INITIATED', 'PROCESSED', 'FAILED']

const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>

/* ── Refund receipt (client-side print → Save as PDF) ── */
function openRefundReceipt(r) {
  const esc = s => String(s ?? '—').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
  const row = (k, v) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Refund Receipt ${esc(shortId(r._id))}</title>
    <style>
      *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:32px;font-size:13px}
      h1{font-size:18px;margin:0 0 2px} .muted{color:#6b7280;font-size:12px}
      .sec{margin-top:22px} .sec h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
      table{border-collapse:collapse;width:100%} td{padding:5px 0;vertical-align:top}
      td.k{color:#6b7280;width:45%} td.v{font-weight:600;text-align:right}
      .total td{border-top:2px solid #111827;padding-top:8px;font-size:15px}
      .foot{margin-top:28px;color:#9ca3af;font-size:11px}
    </style></head><body>
    <h1>Refund Receipt</h1>
    <p class="muted">Jashanz · Refund of an earlier payment</p>
    <p class="muted">Refund No: ${esc(r._id)} &nbsp;·&nbsp; Generated: ${esc(new Date().toLocaleString('en-IN'))}</p>

    <div class="sec"><h2>Details</h2><table>
      ${row('Refunded To', r.payer?.name)}
      ${row('Payment Type', SOURCE_LABEL[r.sourceType] || r.sourceType)}
      ${row('Source Reference', shortId(r.sourceId))}
      ${row('Method', r.method === 'GATEWAY' ? 'Payment gateway (Cashfree)' : 'Manual / offline')}
      ${row('Gateway Refund ID', r.gatewayRefundId)}
      ${row('Original Order ID', r.orderId)}
      ${row('Reason', r.reason)}
      ${row('Initiated By', r.initiatedBy)}
      ${row('Date', fmtDateTime(r.createdAt))}
      ${row('Status', r.status)}
      <tr class="total"><td class="k">Refund Amount</td><td class="v">${esc(fmtMoney(r.amount))}</td></tr>
    </table></div>

    <p class="foot">System-generated receipt. ${r.status === 'PROCESSED' ? 'The refund has been processed.' : 'This refund is ' + esc(r.status.toLowerCase()) + '.'}</p>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Popup blocked — allow popups to download the receipt.'); return }
  w.document.write(html)
  w.document.close()
}

/* ── Confirm-refund modal ── */
function RefundModal({ payment, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (reason.trim().length < 3) { setError('Please give a short reason (min 3 characters).'); return }
    setSubmitting(true); setError('')
    try {
      const res = await initiateRefund({ sourceType: payment.sourceType, sourceId: payment.sourceId, reason: reason.trim() })
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
          <h3 className="font-black text-slate-800">Refund Payment</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconClose /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
            {[
              ['Refund to', payment.payer?.name],
              ['Payment', payment.description],
              ['Type', SOURCE_LABEL[payment.sourceType]],
              ['Amount', fmtMoney(payment.amount)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Full-amount refund. {payment.orderId ? 'Issued via the payment gateway.' : 'No gateway order on file — this will be recorded as a manual refund.'}
            {payment.sourceType === 'REGISTRATION_FEE' && ' The business account stays active.'}
            {payment.sourceType === 'WALLET_TXN' && ' Coin balances are not auto-adjusted.'}
          </p>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Reason <span className="text-danger">*</span></label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this being refunded?" className={`${selectCls} w-full resize-none`} />
          </div>
          {error && <p className="text-xs text-danger font-semibold">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button onClick={submit} disabled={submitting} className="flex-1 bg-danger text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-danger/90 disabled:opacity-50">
              {submitting ? 'Processing…' : `Refund ${fmtMoney(payment.amount)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── "Initiate a refund" — pick a paid payment ── */
function RefundablePanel({ onRefunded }) {
  const [tab, setTab] = useState('BOOKING')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalPayment, setModalPayment] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoading(true); setError('')
    getRefundablePayments({ type: tab, page, limit: 20, search: debounced || undefined })
      .then(d => { setItems(d.items || []); setPagination(d.pagination || { total: 0, page: 1, hasNextPage: false }) })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load payments.'))
      .finally(() => setLoading(false))
  }, [tab, page, debounced])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-change trigger
  useEffect(() => { load() }, [load])

  const handleDone = (refund) => {
    setModalPayment(null)
    setToast(refund?.status === 'FAILED' ? 'Gateway refused the refund — see Refund History.' : 'Refund processed.')
    setTimeout(() => setToast(''), 3500)
    load()
    onRefunded()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div>
        <h3 className="font-black text-slate-800 text-sm">Initiate a Refund</h3>
        <p className="text-xs text-slate-400 mt-0.5">Pick an already-paid transaction to refund in full.</p>
      </div>

      {toast && <p className="text-xs font-semibold text-success bg-success/10 rounded-xl px-3 py-2">{toast}</p>}
      {error && <p className="text-xs text-danger font-semibold">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {SOURCE_TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1) }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === t.key ? 'bg-brand text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
        <input className={`${selectCls} flex-1 min-w-48`} placeholder="Search payer / description / id…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-100">
            <tr>
              {['Payer', 'Payment', 'Amount', 'Paid', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">No refundable payments here</td></tr>
            ) : items.map(p => (
              <tr key={String(p.sourceId)} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="text-xs font-bold text-slate-800">{p.payer?.name}</p>
                  <p className="text-[10px] text-slate-300 font-mono">{shortId(p.sourceId)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.description}</td>
                <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(p.amount)}</td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.paidAt)}</td>
                <td className="px-4 py-3">
                  {p.refunded
                    ? <span className="text-[11px] font-bold text-slate-400">Refunded</span>
                    : <button onClick={() => setModalPayment(p)} className="text-xs font-bold text-danger hover:underline">Refund</button>}
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

      {modalPayment && <RefundModal payment={modalPayment} onClose={() => setModalPayment(null)} onDone={handleDone} />}
    </div>
  )
}

export default function RefundsPage() {
  const { can } = usePermissions()
  const canInitiate = can('financeRefunds', 'FULL')
  const [view, setView] = useState(canInitiate ? 'initiate' : 'history') // one section at a time

  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, hasNextPage: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', sourceType: '', from: '', to: '' })
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to)

  const params = useMemo(() => {
    const p = { page, limit: 20 }
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v })
    return p
  }, [page, filters])

  const load = useCallback(() => {
    if (invalidRange) return
    setLoading(true); setError('')
    getRefunds(params)
      .then(d => {
        setItems(d.items || [])
        setSummary(d.summary || null)
        setPagination(d.pagination || { total: 0, page: 1, hasNextPage: false })
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load refunds.'))
      .finally(() => setLoading(false))
  }, [params, invalidRange])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger
  useEffect(() => { load() }, [load])

  const anyFilter = filters.status || filters.sourceType || filters.from || filters.to

  const tiles = summary ? [
    { label: 'Total Refunded', value: fmtMoney(summary.processedAmount), cls: 'text-danger' },
    { label: 'Processed', value: summary.processedCount, cls: 'text-success' },
    { label: 'Initiated', value: summary.initiatedCount, cls: 'text-info' },
    { label: 'Failed', value: summary.failedCount, cls: 'text-warning' },
  ] : []

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Refund Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Refund already-paid bookings, recharges and fees — and track every refund</p>
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

      {/* Section toggle — show one at a time */}
      {canInitiate ? (
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { key: 'initiate', label: 'Initiate a Refund' },
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
      ) : (
        <p className="text-xs text-slate-400">Initiating refunds needs full access on this page — ask a Finance Admin. The refund history is still visible below.</p>
      )}

      {canInitiate && view === 'initiate' && <RefundablePanel onRefunded={load} />}

      {(!canInitiate || view === 'history') && (
      <>
      {/* Refund history */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-black text-slate-800 mr-1">Refund History</span>
        <select className={selectCls} value={filters.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Any status</option>
          {REFUND_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectCls} value={filters.sourceType} onChange={e => setF('sourceType', e.target.value)}>
          <option value="">All payment types</option>
          {SOURCE_TABS.map(s => <option key={s.key} value={s.key}>{SOURCE_LABEL[s.key]}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        {anyFilter && (
          <button onClick={() => { setFilters({ status: '', sourceType: '', from: '', to: '' }); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Refunded To', 'Payment Type', 'Amount', 'Reason', 'Method', 'Status', 'Gateway Ref', 'By', 'Date', 'Receipt'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">No refunds match your filters</td></tr>
              ) : items.map(r => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.payer?.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{SOURCE_LABEL[r.sourceType] || r.sourceType}</td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmtMoney(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-48 truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.method === 'GATEWAY' ? 'Gateway' : 'Manual'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-500'}`} title={r.failureReason || ''}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">{r.gatewayRefundId ? shortId(r.gatewayRefundId) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.initiatedBy}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openRefundReceipt(r)} className="text-xs font-bold text-brand hover:underline">PDF</button>
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
      </>
      )}
    </div>
  )
}
