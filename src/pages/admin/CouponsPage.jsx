import { useState, useEffect } from 'react'
import { listCoupons, createCoupon, updateCoupon, toggleCoupon, listCouponRedemptions } from '../../api/coupons'
import { getPublicCategories } from '../../api/categories'
import { ApiError } from '../../api/client'

const PAGE_SIZE = 10
const inr = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`)
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
// <input type="datetime-local"> works in the browser's own time; the server gets a real ISO time
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STATUS_STYLE = {
  ACTIVE: 'bg-success/10 text-success',
  PAUSED: 'bg-slate-100 text-slate-500',
  SCHEDULED: 'bg-info/10 text-info',
  EXPIRED: 'bg-danger/10 text-danger',
  EXHAUSTED: 'bg-warning/10 text-warning',
}
const STATUS_LABEL = { ACTIVE: 'Active', PAUSED: 'Paused', SCHEDULED: 'Scheduled', EXPIRED: 'Expired', EXHAUSTED: 'Used up' }

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'
const labelCls = 'text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5'

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconList = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1" fill="currentColor"/><circle cx="3.5" cy="12" r="1" fill="currentColor"/><circle cx="3.5" cy="18" r="1" fill="currentColor"/></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>

const discountText = (c) => (c.type === 'PERCENT' ? `${c.value}% off${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ''}` : `${inr(c.value)} off`)

const emptyForm = () => ({
  code: '', title: '', type: 'PERCENT', value: '', maxDiscount: '', categories: [],
  validFrom: toLocalInput(new Date()), validTo: '', totalLimit: '', maxTotalDiscount: '',
})

/* ── Create / Edit ── */
function CouponModal({ editing, categories, onClose, onSave }) {
  const [form, setForm] = useState(editing ? {
    code: editing.code, title: editing.title || '', type: editing.type, value: String(editing.value),
    maxDiscount: editing.maxDiscount == null ? '' : String(editing.maxDiscount),
    categories: (editing.categories || []).map(c => c._id),
    validFrom: toLocalInput(editing.validFrom), validTo: toLocalInput(editing.validTo),
    totalLimit: editing.totalLimit == null ? '' : String(editing.totalLimit),
    maxTotalDiscount: editing.maxTotalDiscount == null ? '' : String(editing.maxTotalDiscount),
  } : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (id) => set('categories', form.categories.includes(id) ? form.categories.filter(x => x !== id) : [...form.categories, id])
  const numOrNull = (v) => (v === '' ? null : Number(v))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.validFrom || !form.validTo) { setError('Choose when the coupon starts and ends.'); return }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      value: Number(form.value),
      maxDiscount: form.type === 'PERCENT' ? numOrNull(form.maxDiscount) : null,
      categories: form.categories,
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
      totalLimit: numOrNull(form.totalLimit),
      maxTotalDiscount: numOrNull(form.maxTotalDiscount),
    }
    if (!editing) payload.code = form.code.trim()
    setSaving(true)
    try {
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the coupon.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-800">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
         <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Coupon Code</label>
              <input required disabled={!!editing} className={`${inputCls} uppercase disabled:opacity-60`} placeholder="e.g. WELCOME20" maxLength={20}
                value={form.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} />
              <p className="text-[11px] text-slate-400 mt-1">{editing ? 'The code cannot be changed.' : '3–20 letters or numbers. Vendors do not need to match the case.'}</p>
            </div>
            <div>
              <label className={labelCls}>Title <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <input className={inputCls} placeholder="e.g. Welcome offer" maxLength={80} value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Discount Type</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{form.type === 'PERCENT' ? 'Percentage (1–100)' : 'Amount off (₹)'}</label>
              <input required type="number" min="0.01" max={form.type === 'PERCENT' ? 100 : undefined} step="any" className={inputCls}
                value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
          </div>

          {form.type === 'PERCENT' && (
            <div>
              <label className={labelCls}>Maximum discount per vendor (₹) <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <input type="number" min="1" step="any" className={inputCls} placeholder="e.g. 200 — leave empty for no cap" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Starts</label>
              <input required type="datetime-local" className={inputCls} value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Ends</label>
              <input required type="datetime-local" className={inputCls} value={form.validTo} onChange={e => set('validTo', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Total uses <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <input type="number" min="1" step="1" className={inputCls} placeholder="Empty = unlimited" value={form.totalLimit} onChange={e => set('totalLimit', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Total budget (₹) <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <input type="number" min="1" step="any" className={inputCls} placeholder="Most discount to give away" value={form.maxTotalDiscount} onChange={e => set('maxTotalDiscount', e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 -mt-2">Each vendor can use a coupon once, on their registration fee. The coupon stops by itself when the uses or the budget run out.</p>

          <div>
            <label className={labelCls}>Business categories <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">No categories loaded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map(c => {
                  const on = form.categories.includes(c._id)
                  return (
                    <button type="button" key={c._id} onClick={() => toggleCat(c._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${on ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">{form.categories.length ? `Only vendors in ${form.categories.length} selected categor${form.categories.length === 1 ? 'y' : 'ies'} can use it.` : 'Nothing selected: vendors of every category can use it.'}</p>
          </div>

          {error && <p className="text-sm text-danger font-semibold">{error}</p>}
         </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Who used it ── */
function RedemptionsModal({ coupon, onClose }) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await listCouponRedemptions(coupon._id, { page, limit: PAGE_SIZE })
        if (!live) return
        setRows(data.redemptions || [])
        setTotal(data.total || 0)
      } catch (err) {
        if (live) setError(err instanceof ApiError ? err.message : 'Could not load the list.')
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => { live = false }
  }, [coupon._id, page])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 truncate">{coupon.code} — who used it</h3>
            <p className="text-xs text-slate-400">{coupon.usedCount} paid · {coupon.reservedCount} in progress · {inr(coupon.discountGiven)} given</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0"><IconX /></button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Vendor', 'Status', 'Fee', 'Discount', 'Paid', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-danger text-sm font-semibold">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Nobody has used this coupon yet.</td></tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.business?.username || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === 'REDEEMED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{r.status === 'REDEEMED' ? 'Paid' : 'In progress'}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{inr(r.originalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{inr(r.discountAmount)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{inr(r.finalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(r.redeemedAt || r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {page} of {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)

  // search waits until typing pauses, so the server is not asked on every key
  useEffect(() => {
    const t = setTimeout(() => { setSearchApplied(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const params = { page, limit: PAGE_SIZE }
        if (searchApplied) params.search = searchApplied
        if (statusFilter) params.status = statusFilter
        const data = await listCoupons(params)
        if (!live) return
        setCoupons(data.coupons || [])
        setTotal(data.total || 0)
        setStats(data.stats || { total: 0, active: 0 })
      } catch (err) {
        if (live) setError(err instanceof ApiError ? err.message : 'Could not load coupons.')
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => { live = false }
  }, [page, searchApplied, statusFilter, reload])

  useEffect(() => {
    getPublicCategories().then(list => setCategories(Array.isArray(list) ? list : [])).catch(() => {})
  }, [])

  const refresh = () => setReload(n => n + 1)

  const handleSave = async (payload) => {
    if (editing) await updateCoupon(editing._id, payload)
    else await createCoupon(payload)
    refresh()
  }

  const handleToggle = async (c) => {
    try {
      const res = await toggleCoupon(c._id)
      setCoupons(list => list.map(x => (x._id === c._id ? res.coupon : x)))
      refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the coupon.')
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-800">Coupons</h1>
          <p className="text-sm text-slate-500 mt-0.5">Discount codes vendors can use on their registration fee</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90">
          <IconPlus /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ label: 'Total Coupons', value: stats.total, cls: 'text-brand' }, { label: 'Switched On', value: stats.active, cls: 'text-success' }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <input className={`${inputCls} flex-1 min-w-45`} placeholder="Search by code…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className={`${inputCls} w-auto`} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="active">Switched on</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Coupon', 'Discount', 'Valid', 'Uses', 'Given away', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading coupons…</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  {stats.total === 0 ? 'No coupons yet. Create the first one.' : 'No coupons match your search.'}
                </td></tr>
              ) : coupons.map(c => (
                <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-black text-xs text-slate-800 font-mono">{c.code}</p>
                    {c.title && <p className="text-[11px] text-slate-400">{c.title}</p>}
                    {c.categories?.length > 0 && <p className="text-[11px] text-slate-400">{c.categories.length} categor{c.categories.length === 1 ? 'y' : 'ies'} only</p>}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{discountText(c)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.validFrom)} – {fmtDate(c.validTo)}</td>
                  <td className="px-4 py-3 text-xs text-slate-800 whitespace-nowrap">
                    <span className="font-bold">{c.usedCount}</span>{c.totalLimit != null ? ` / ${c.totalLimit}` : ''}
                    {c.reservedCount > 0 && <span className="text-slate-400"> (+{c.reservedCount} in progress)</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-800 whitespace-nowrap">
                    <span className="font-bold">{inr(c.discountGiven)}</span>{c.maxTotalDiscount != null ? ` / ${inr(c.maxTotalDiscount)}` : ''}
                  </td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_STYLE[c.status] || STATUS_STYLE.PAUSED}`}>{STATUS_LABEL[c.status] || c.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewing(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="Who used it"><IconList /></button>
                      <button onClick={() => { setEditing(c); setShowModal(true) }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200" title="Edit"><IconEdit /></button>
                      <button onClick={() => handleToggle(c)} className={`w-7 h-7 flex items-center justify-center rounded-lg ${c.isActive ? 'bg-warning/8 text-warning hover:bg-warning/15' : 'bg-success/8 text-success hover:bg-success/15'}`} title={c.isActive ? 'Pause' : 'Resume'}>
                        {c.isActive ? <IconPause /> : <IconPlay />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>{total} coupon{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {page} of {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {showModal && <CouponModal editing={editing} categories={categories} onClose={() => setShowModal(false)} onSave={handleSave} />}
      {viewing && <RedemptionsModal coupon={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
