import { useState, useEffect, useCallback } from 'react'
import { getPricing, updateFee, getWalletTransactions, deleteTransaction } from '../../api/finance'
import { ApiError } from '../../api/client'

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

function TransactionDetailModal({ transaction, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">AdManager Payment Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>
        <div className="p-6 space-y-4">
          <DetailRow label="Business">{transaction.business?.username ?? '—'}</DetailRow>
          <DetailRow label="Amount Paid">{transaction.amountPaid ? `₹${transaction.amountPaid}` : '—'}</DetailRow>
          <DetailRow label="Order ID">
            <span className="font-mono text-xs break-all">{transaction.razorpayOrderId ?? '—'}</span>
          </DetailRow>
          {transaction.meta?.expiresAt && (
            <DetailRow label="Access Expires">{new Date(transaction.meta.expiresAt).toLocaleString()}</DetailRow>
          )}
          <DetailRow label="Date">{new Date(transaction.createdAt).toLocaleString()}</DetailRow>
        </div>
      </div>
    </div>
  )
}

function FeeEditor({ label, keyName, valueInPaise, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const rupees = (valueInPaise / 100).toFixed(2)

  const startEdit = () => {
    setDraft(rupees)
    setError('')
    setEditing(true)
  }

  const handleSave = async () => {
    const rupeeValue = Number(draft)
    if (!rupeeValue || rupeeValue <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateFee(keyName, Math.round(rupeeValue * 100))
      setEditing(false)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 max-w-sm">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-bold">₹</span>
            <input
              type="number"
              min="1"
              step="1"
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          {error && <p className="text-[11px] text-danger font-semibold">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} disabled={saving} className="flex-1 bg-slate-100 text-slate-600 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-slate-200 disabled:opacity-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-brand/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-slate-800">₹{rupees}</p>
          <button onClick={startEdit} className="text-xs font-bold text-brand hover:underline">Edit</button>
        </div>
      )}
    </div>
  )
}

// Split out of the former Recharge Management page so AdManager's one-time
// access fee AND the payment history it generates have their own dedicated
// page — same AdminConfig key ('adManagerFee') and same
// GET /finance/pricing / POST /finance/pricing/fee endpoints as before for
// the fee, plus GET /finance/transactions?source=AD_MANAGER_ACCESS (new
// server-side filter) so this page's table shows only AdManager purchases,
// not every CREDIT_PURCHASE transaction.
export default function AdManagerFeePage() {
  const [pricing, setPricing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [txError, setTxError] = useState('')
  const [viewingTx, setViewingTx] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPricing(await getPricing())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pricing.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setTxLoading(true)
    setTxError('')
    try {
      const data = await getWalletTransactions({ source: 'AD_MANAGER_ACCESS', limit: 50 })
      setTransactions(data.items || [])
    } catch (err) {
      setTxError(err instanceof ApiError ? err.message : 'Failed to load payments.')
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => { (async () => { await load() })() }, [load])
  useEffect(() => { (async () => { await loadTransactions() })() }, [loadTransactions])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record? It will be hidden from this list but kept in the database for records.')) return
    setDeletingId(id)
    setTxError('')
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t._id !== id))
    } catch (err) {
      setTxError(err instanceof ApiError ? err.message : 'Failed to delete payment record.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">AdManager Access Fee</h1>
        <p className="text-sm text-slate-500 mt-0.5">One-time fee a business pays to unlock AdManager (boosted ads / wider reach) — plus every payment made for it.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-12">Loading pricing...</p>
      ) : error ? (
        <p className="text-sm text-danger font-semibold text-center py-12">{error}</p>
      ) : (
        <FeeEditor label="AdManager Access Fee" keyName="adManagerFee" valueInPaise={pricing.adManagerFee} onSaved={load} />
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">AdManager Access Payments</p>
        </div>

        {txError && <p className="text-sm text-danger font-semibold px-5 py-3">{txError}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Business', 'Amount Paid', 'Order ID', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {txLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">No AdManager access payments yet</td></tr>
              ) : transactions.map(t => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.business?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{t.amountPaid ? `₹${t.amountPaid}` : '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono truncate max-w-40">{t.razorpayOrderId ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewingTx(t)} disabled={deletingId === t._id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand/8 text-brand hover:bg-brand/15 disabled:opacity-50" title="View details"><IconEye /></button>
                      <button onClick={() => handleDelete(t._id)} disabled={deletingId === t._id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15 disabled:opacity-50" title="Delete"><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {transactions.length} payment{transactions.length === 1 ? '' : 's'}
        </div>
      </div>

      {viewingTx && <TransactionDetailModal transaction={viewingTx} onClose={() => setViewingTx(null)} />}
    </div>
  )
}
