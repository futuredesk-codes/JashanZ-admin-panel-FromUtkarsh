import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getCategories, createCategory, updateCategory, toggleCategory, deleteCategory } from '../../api/categories'
import { getPresignedUrl } from '../../api/upload'
import { ApiError, uploadToPresignedUrl } from '../../api/client'
import ConfirmDialog from '../../components/ConfirmDialog'

const SERVICE_TYPES = ['SLOT_BASED', 'PACKAGE', 'TICKET', 'PER_HOUR', 'PER_DAY', 'FIXED_PRICE', 'APPOINTMENT']
const SERVICE_TYPE_LABEL = {
  SLOT_BASED: 'Slot Based',
  PACKAGE: 'Package Based',
  TICKET: 'Ticket Based',
  PER_HOUR: 'Per Hour Based',
  PER_DAY: 'Per Day Based',
  FIXED_PRICE: 'Fixed Price Based',
  APPOINTMENT: 'Appointment Based',
}

const EMPTY_FORM = { name: '', serviceType: SERVICE_TYPES[0], image: '', isTrending: false }
const PAGE_SIZE = 10

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

/* ── Icons ── */
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IconUpload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>

function CategoryThumb({ src, name, size = 'w-9 h-9', text = 'text-xs' }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken) {
    return <img src={src} alt={name} onError={() => setBroken(true)} className={`${size} rounded-lg object-cover shrink-0 bg-slate-100`} />
  }
  return (
    <span className={`${size} ${text} rounded-lg bg-brand/8 text-brand flex items-center justify-center font-black shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </span>
  )
}

/* ── Add/Edit Modal ── */
function AddEditModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState(editing ? {
    name: editing.name,
    serviceType: editing.serviceType,
    image: editing.image || '',
    isTrending: !!editing.isTrending,
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const { presignedUrl, fileUrl } = await getPresignedUrl(file.name, file.type, 'categories')
      await uploadToPresignedUrl(presignedUrl, file)
      set('image', fileUrl)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({ ...form, image: form.image.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">{editing ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Category Name</label>
            <input
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="e.g. DJ, Photographer..."
              value={form.name} onChange={e => set('name', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Service / Booking Type</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              value={form.serviceType} onChange={e => set('serviceType', e.target.value)}
            >
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{SERVICE_TYPE_LABEL[t]}</option>)}
            </select>
          </div>

          {/* Image — upload from device OR paste a URL */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Category Image <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <div className="flex items-start gap-3">
              <CategoryThumb src={form.image} name={form.name} size="w-16 h-16" text="text-xl" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 bg-brand/8 text-brand rounded-lg px-3 py-2 text-xs font-bold hover:bg-brand/15 disabled:opacity-60"
                  >
                    <IconUpload />{uploading ? 'Uploading…' : 'Upload from device'}
                  </button>
                  {form.image && !uploading && (
                    <button type="button" onClick={() => set('image', '')} className="text-xs font-semibold text-slate-400 hover:text-danger">Remove</button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="…or paste an image URL (https://…)"
                  value={form.image}
                  onChange={e => set('image', e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-bold text-slate-800">Show in Trending</p>
              <p className="text-xs text-slate-400 mt-0.5">Ranks this category's vendors in the user dashboard's "Trending" section, filtered to the viewer's city</p>
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand/30 accent-brand shrink-0"
              checked={form.isTrending} onChange={e => set('isTrending', e.target.checked)}
            />
          </label>

          {error && <p className="text-sm text-danger font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Detail (View) Modal ── */
function CategoryDetailModal({ cat, onClose, onEdit, onToggle }) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle(cat._id)
    } finally {
      setToggling(false)
    }
  }

  const rows = [
    ['Booking Type', SERVICE_TYPE_LABEL[cat.serviceType] || cat.serviceType],
    ['Status', cat.isActive ? 'Active' : 'Inactive'],
    ['Show in Trending', cat.isTrending ? 'Yes' : 'No'],
    ['Businesses Using It', String(cat.businessCount || 0)],
    ['Created On', fmtDate(cat.createdAt)],
    ['Last Updated', fmtDate(cat.updatedAt)],
  ]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <CategoryThumb src={cat.image} name={cat.name} size="w-10 h-10" />
            <div className="min-w-0">
              <h3 className="font-black text-slate-800 text-base truncate">{cat.name}</h3>
              <p className="text-xs text-slate-400">{SERVICE_TYPE_LABEL[cat.serviceType] || cat.serviceType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {cat.image && (
            <img src={cat.image} alt={cat.name} className="w-full max-h-56 object-contain rounded-xl bg-slate-50 border border-slate-100" />
          )}
          <div className="grid grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                <p className="text-sm font-bold text-slate-800">{v}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Category ID</p>
            <p className="text-xs font-mono text-slate-600 break-all">{cat._id}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${cat.isActive ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
            >
              {cat.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => onEdit(cat)} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-brand/90 flex items-center gap-1.5">
              <IconEdit /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [viewCat, setViewCat] = useState(null)
  const [deleteCat, setDeleteCat] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [trendingFilter, setTrendingFilter] = useState('')
  const [page, setPage] = useState(1)

  const loadCategories = useCallback(() => {
    setLoading(true)
    setError('')
    getCategories()
      .then(data => setCategories(data.categories || []))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load categories.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { (async () => { await loadCategories() })() }, [loadCategories])

  const handleAdd = () => { setEditingCat(null); setShowModal(true) }
  const handleEdit = (cat) => { setViewCat(null); setEditingCat(cat); setShowModal(true) }

  const handleToggle = async (id) => {
    const prev = categories
    setCategories(cats => cats.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c))
    setViewCat(v => v && v._id === id ? { ...v, isActive: !v.isActive } : v)
    try {
      await toggleCategory(id)
    } catch (err) {
      setCategories(prev)
      setViewCat(v => v && v._id === id ? { ...v, isActive: !v.isActive } : v)
      setError(err instanceof ApiError ? err.message : 'Could not update category.')
    }
  }

  const handleSave = async (form) => {
    if (editingCat) await updateCategory(editingCat._id, form)
    else await createCategory(form)
    loadCategories()
  }

  const handleDelete = async () => {
    if (!deleteCat) return
    setDeleting(true)
    try {
      await deleteCategory(deleteCat._id)
      setDeleteCat(null)
      loadCategories()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete category.')
    } finally {
      setDeleting(false)
    }
  }

  const total = categories.length
  const active = categories.filter(c => c.isActive).length
  const inactive = total - active

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return categories.filter(c => {
      if (q && !c.name?.toLowerCase().includes(q)) return false
      if (statusFilter === 'active' && !c.isActive) return false
      if (statusFilter === 'inactive' && c.isActive) return false
      if (typeFilter && c.serviceType !== typeFilter) return false
      if (trendingFilter === 'yes' && !c.isTrending) return false
      if (trendingFilter === 'no' && c.isTrending) return false
      return true
    })
  }, [categories, search, statusFilter, typeFilter, trendingFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Service Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all service categories and their booking types</p>
        </div>
        <button onClick={handleAdd} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90">
          <IconPlus /> Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Categories', value: total, cls: 'text-brand' },
          { label: 'Active', value: active, cls: 'text-success' },
          { label: 'Inactive', value: inactive, cls: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <input
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 flex-1 min-w-45"
          placeholder="Search by category name..."
          value={search}
          onChange={e => { setSearch(e.target.value); resetPage() }}
        />
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage() }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); resetPage() }}>
          <option value="">All Booking Types</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{SERVICE_TYPE_LABEL[t]}</option>)}
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={trendingFilter} onChange={e => { setTrendingFilter(e.target.value); resetPage() }}>
          <option value="">Trending: Any</option>
          <option value="yes">Trending only</option>
          <option value="no">Not trending</option>
        </select>
      </div>

      {error && (
        <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Category', 'Booking Type', 'Businesses', 'Trending', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading categories...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  {categories.length === 0 ? 'No categories yet — add the first one.' : 'No categories match your filters'}
                </td></tr>
              ) : visible.map(cat => (
                <tr key={cat._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <CategoryThumb src={cat.image} name={cat.name} />
                      <p className="font-bold text-xs text-slate-800 leading-tight">{cat.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-info/8 text-info whitespace-nowrap">{SERVICE_TYPE_LABEL[cat.serviceType] || cat.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{cat.businessCount || 0}</td>
                  <td className="px-4 py-3">
                    {cat.isTrending
                      ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning">Trending</span>
                      : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(cat.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewCat(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="View details"><IconEye /></button>
                      <button onClick={() => handleEdit(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200" title="Edit"><IconEdit /></button>
                      <button onClick={() => handleToggle(cat._id)} className={`w-7 h-7 flex items-center justify-center rounded-lg ${cat.isActive ? 'bg-warning/8 text-warning hover:bg-warning/15' : 'bg-success/8 text-success hover:bg-success/15'}`} title={cat.isActive ? 'Deactivate' : 'Activate'}>
                        {cat.isActive ? <IconPause /> : <IconPlay />}
                      </button>
                      <button onClick={() => setDeleteCat(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15" title="Delete"><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {visible.length} of {filtered.length} categories</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {safePage} of {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <AddEditModal
          editing={editingCat}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {viewCat && (
        <CategoryDetailModal
          cat={viewCat}
          onClose={() => setViewCat(null)}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      )}

      {deleteCat && (
        <ConfirmDialog
          title="Delete this category?"
          message={`"${deleteCat.name}" will be permanently and irreversibly deleted — this cannot be undone. It can no longer be picked when a business registers; businesses already using it keep working.`}
          confirmLabel="Delete Category"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteCat(null)}
        />
      )}
    </div>
  )
}
