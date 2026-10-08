import { useState, useEffect, useCallback } from 'react'
import { getPricing, updateFee, updateSubscriptionPlanPrice, getWalletTransactions, deleteTransaction, getFinanceRegistrationFeeRates, setFinanceCategoryRegistrationFee } from '../../api/finance'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'
import SearchableSelect from '../../components/SearchableSelect'

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

const TYPE_LABELS = {
  CREDIT_PURCHASE: 'Purchase',
  CREDIT_REFERRAL: 'Referral Credit',
  DEBIT_BOOST: 'Ad Boost',
  DEBIT_LEAD_UNLOCK: 'Lead Unlock',
}

const TYPE_CLS = {
  CREDIT_PURCHASE: 'bg-success/10 text-success',
  CREDIT_REFERRAL: 'bg-info/10 text-info',
  DEBIT_BOOST: 'bg-warning/10 text-warning',
  DEBIT_LEAD_UNLOCK: 'bg-slate-100 text-slate-500',
}

// Purchase-type transactions carry a `meta.source` when they came from a
// specific self-serve flow (subscription/AdManager) rather than a plain coin
// pack — surfaces which pricing knob actually generated the money.
function sourceLabel(item) {
  if (item.type !== 'CREDIT_PURCHASE') return null
  if (item.meta?.subscriptionPlan) return `Subscription — ${item.meta.subscriptionPlan}`
  if (item.meta?.source === 'AD_MANAGER_ACCESS') return 'AdManager Access'
  return 'Coin Pack'
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
    <div className="bg-white rounded-2xl p-4 border border-slate-100">
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
          <p className="text-xl font-black text-slate-800">₹{rupees}</p>
          <button onClick={startEdit} className="text-xs font-bold text-brand hover:underline">Edit</button>
        </div>
      )}
    </div>
  )
}

/* ── Modal: every category's resolved registration fee (override or global) ── */
function AllFeesModal({ data, onClose }) {
  const [search, setSearch] = useState('')

  const globalRupees = ((data?.globalFee ?? 0) / 100).toFixed(2)
  const categories = (data?.categories || [])
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-sm">All Categories — Registration Fee</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Global fee: ₹{globalRupees} — applies unless overridden below.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 pt-4 pb-2 shrink-0">
          <input
            type="text"
            placeholder="Search category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No categories match.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                  {c.customFee !== null ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/8 text-brand text-[11px] font-bold">
                      ₹{(c.customFee / 100).toFixed(2)} <span className="text-brand/60 font-semibold">(override)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">₹{globalRupees} <span className="text-slate-300">(global)</span></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Per-Category Registration Fee override (FULL access only) ──
   Categories are managed in Admin Panel -> Categories; this list always
   reflects whatever's live there (active categories only) — nothing to
   sync, a deleted category simply stops being returned by the API. */
function RegistrationFeeOverrideCard() {
  const [data, setData] = useState(null)
  const [categoryId, setCategoryId] = useState('')
  const [categoryFee, setCategoryFee] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(() => {
    getFinanceRegistrationFeeRates()
      .then(setData)
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load registration fee rates.'))
  }, [])

  useEffect(() => { load() }, [load])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const save = async (clear = false) => {
    if (!categoryId) return
    const rupees = clear ? null : Number(categoryFee)
    if (!clear && (Number.isNaN(rupees) || rupees <= 0)) { setError('Enter a valid amount.'); return }
    setSaving(true); setError('')
    try {
      await setFinanceCategoryRegistrationFee(categoryId, clear ? null : Math.round(rupees * 100))
      flash(clear ? 'Category override cleared.' : 'Category fee set.')
      setCategoryFee('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save category fee.')
    } finally { setSaving(false) }
  }

  const customCategories = (data?.categories || []).filter(c => c.customFee !== null)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-800 text-sm">Per-Category Registration Fee Override</h3>
          <p className="text-xs text-slate-400 mt-0.5">The global fee above applies to every business unless its category has an override set here. A new business's registration order uses whichever fee (category override or global) is live at creation time.</p>
        </div>
        <button onClick={() => setShowAll(true)} className="shrink-0 text-xs font-bold text-brand hover:underline whitespace-nowrap">View All</button>
      </div>

      {error && <p className="text-xs text-danger font-semibold">{error}</p>}
      {msg && <p className="text-xs text-success font-semibold">{msg}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <SearchableSelect
          value={categoryId}
          onChange={v => { setCategoryId(v); const found = data?.categories.find(x => x.id === v); setCategoryFee(found?.customFee != null ? (found.customFee / 100).toFixed(2) : '') }}
          options={(data?.categories || []).map(c => ({ value: c.id, label: `${c.name}${c.customFee != null ? ` — ₹${(c.customFee / 100).toFixed(2)}` : ''}` }))}
          placeholder="Select category…"
          buttonClassName="min-w-52"
        />
        <span className="text-slate-400 text-sm font-bold">₹</span>
        <input type="number" min="1" step="1" placeholder="Amount" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 w-28" value={categoryFee} onChange={e => setCategoryFee(e.target.value)} />
        <button onClick={() => save(false)} disabled={saving || !categoryId} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 disabled:opacity-40">Set</button>
        <button onClick={() => save(true)} disabled={saving || !categoryId} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200 disabled:opacity-40">Clear</button>
      </div>

      {customCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customCategories.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/8 text-brand text-[11px] font-bold">
              {c.name}: ₹{(c.customFee / 100).toFixed(2)}
            </span>
          ))}
        </div>
      )}

      {showAll && <AllFeesModal data={data} onClose={() => setShowAll(false)} />}
    </div>
  )
}

function PlanEditor({ plan, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startEdit = () => {
    setDraft(String(plan.price))
    setError('')
    setEditing(true)
  }

  const handleSave = async () => {
    const price = Number(draft)
    if (!price || price <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateSubscriptionPlanPrice(plan._id, price)
      setEditing(false)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{plan.name}</p>
      <p className="text-[11px] text-slate-400 mb-2">{plan.durationDays} days{!plan.isActive && <span className="text-danger font-bold"> · inactive</span>}</p>
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
          <p className="text-xl font-black text-slate-800">₹{plan.price}</p>
          <button onClick={startEdit} className="text-xs font-bold text-brand hover:underline">Edit</button>
        </div>
      )}
    </div>
  )
}

function TransactionDetailModal({ transaction, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Transaction Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>
        <div className="p-6 space-y-4">
          <DetailRow label="Business">{transaction.business?.username ?? '—'}</DetailRow>
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Type">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_CLS[transaction.type] || 'bg-slate-100 text-slate-500'}`}>{TYPE_LABELS[transaction.type] ?? transaction.type}</span>
            </DetailRow>
            <DetailRow label="Source">{sourceLabel(transaction) ?? '—'}</DetailRow>
            <DetailRow label="Coins">{transaction.coins}</DetailRow>
            <DetailRow label="Amount Paid">{transaction.amountPaid ? `₹${transaction.amountPaid}` : '—'}</DetailRow>
          </div>
          <DetailRow label="Order ID">
            <span className="font-mono text-xs break-all">{transaction.razorpayOrderId ?? '—'}</span>
          </DetailRow>
          {transaction.meta && Object.keys(transaction.meta).length > 0 && (
            <DetailRow label="Additional Details">
              <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                {Object.entries(transaction.meta).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 font-semibold">{key}</span>
                    <span className="text-slate-700 text-right break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </DetailRow>
          )}
          <DetailRow label="Date">{new Date(transaction.createdAt).toLocaleString()}</DetailRow>
        </div>
      </div>
    </div>
  )
}

export default function RechargeManagementPage() {
  const { can } = usePermissions()
  const canEditRates = can('financeRecharge', 'FULL')

  const [pricing, setPricing] = useState(null)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [pricingError, setPricingError] = useState('')

  const [transactions, setTransactions] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [txLoading, setTxLoading] = useState(true)
  const [txError, setTxError] = useState('')
  const [viewingTx, setViewingTx] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadPricing = useCallback(async () => {
    setPricingLoading(true)
    setPricingError('')
    try {
      setPricing(await getPricing())
    } catch (err) {
      setPricingError(err instanceof ApiError ? err.message : 'Failed to load pricing.')
    } finally {
      setPricingLoading(false)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setTxLoading(true)
    setTxError('')
    try {
      const data = await getWalletTransactions(typeFilter ? { type: typeFilter, limit: 50 } : { limit: 50 })
      setTransactions(data.items || [])
    } catch (err) {
      setTxError(err instanceof ApiError ? err.message : 'Failed to load transactions.')
    } finally {
      setTxLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { (async () => { await loadPricing() })() }, [loadPricing])
  useEffect(() => { (async () => { await loadTransactions() })() }, [loadTransactions])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? It will be hidden from this list but kept in the database for records.')) return
    setDeletingId(id)
    setTxError('')
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t._id !== id))
    } catch (err) {
      setTxError(err instanceof ApiError ? err.message : 'Failed to delete transaction.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Recharge Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Pricing for business registration, AdManager access, and inquiry-unlock subscriptions — plus a live log of every recharge/purchase transaction.</p>
      </div>

      {pricingLoading ? (
        <p className="text-sm text-slate-400 text-center py-12">Loading pricing...</p>
      ) : pricingError ? (
        <p className="text-sm text-danger font-semibold text-center py-12">{pricingError}</p>
      ) : (
        <>
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">One-Time Fees</p>
            <div className="grid grid-cols-2 gap-4">
              <FeeEditor label="Business Registration Fee" keyName="businessRegistrationFee" valueInPaise={pricing.businessRegistrationFee} onSaved={loadPricing} />
              <FeeEditor label="AdManager Access Fee" keyName="adManagerFee" valueInPaise={pricing.adManagerFee} onSaved={loadPricing} />
            </div>
          </div>

          {canEditRates
            ? <RegistrationFeeOverrideCard />
            : <p className="text-xs text-slate-400">Per-business fee overrides need full access on this page — ask a Finance Admin.</p>}

          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Inquiry-Unlock Subscription Plans</p>
            {pricing.subscriptionPlans.length === 0 ? (
              <p className="text-sm text-slate-400">No plans configured.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {pricing.subscriptionPlans.map(plan => (
                  <PlanEditor key={plan._id} plan={plan} onSaved={loadPricing} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recent Transactions</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setTypeFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${typeFilter==='' ? 'bg-brand text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>All</button>
            {Object.keys(TYPE_LABELS).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${typeFilter===t ? 'bg-brand text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{TYPE_LABELS[t]}</button>
            ))}
          </div>
        </div>

        {txError && <p className="text-sm text-danger font-semibold px-5 py-3">{txError}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Business', 'Type', 'Source', 'Coins', 'Amount Paid', 'Order ID', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {txLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No transactions found</td></tr>
              ) : transactions.map(t => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.business?.username ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${TYPE_CLS[t.type] || 'bg-slate-100 text-slate-500'}`}>{TYPE_LABELS[t.type] ?? t.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{sourceLabel(t) ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{t.coins}</td>
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
          Showing {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
        </div>
      </div>

      {viewingTx && <TransactionDetailModal transaction={viewingTx} onClose={() => setViewingTx(null)} />}
    </div>
  )
}
