import { useState } from 'react'

/* ── Mock data ── */
const BOOKING_TYPES = ['Slot Booking','Per Day Booking','Ticket Booking','Appointment Booking','Home Service Booking']

const INITIAL_CATEGORIES = [
  {id:'CAT001',name:'DJ',icon:'🎵',desc:'Professional disc jockeys and music entertainment',bookingType:'Slot Booking',businesses:145,status:'Active'},
  {id:'CAT002',name:'Decorator',icon:'🎨',desc:'Event decoration specialists for all occasions',bookingType:'Per Day Booking',businesses:128,status:'Active'},
  {id:'CAT003',name:'Makeup Artist',icon:'💄',desc:'Professional makeup and beauty artists',bookingType:'Appointment Booking',businesses:89,status:'Active'},
  {id:'CAT004',name:'Event Organizer',icon:'📋',desc:'Complete event planning and management',bookingType:'Per Day Booking',businesses:67,status:'Active'},
  {id:'CAT005',name:'Photographer',icon:'📸',desc:'Professional photography for events',bookingType:'Home Service Booking',businesses:234,status:'Active'},
  {id:'CAT006',name:'Influencer',icon:'⚡',desc:'Social media content creators and promoters',bookingType:'Slot Booking',businesses:56,status:'Active'},
  {id:'CAT007',name:'Banquet Hall',icon:'🏛️',desc:'Event venues and banquet facilities',bookingType:'Slot Booking',businesses:98,status:'Active'},
  {id:'CAT008',name:'Catering',icon:'🍽️',desc:'Food and catering services for all events',bookingType:'Per Day Booking',businesses:112,status:'Active'},
  {id:'CAT009',name:'Anchor',icon:'🎤',desc:'Event anchoring and hosting professionals',bookingType:'Slot Booking',businesses:34,status:'Inactive'},
  {id:'CAT010',name:'Light & Sound',icon:'💡',desc:'Audio visual equipment and lighting solutions',bookingType:'Per Day Booking',businesses:78,status:'Active'},
]

const EMPTY_FORM = { name:'', desc:'', icon:'', bookingType:'Slot Booking', status:'Active' }

/* ── Icons ── */
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Add/Edit Modal ── */
function AddEditModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState(editing ? {
    name: editing.name,
    desc: editing.desc,
    icon: editing.icon,
    bookingType: editing.bookingType,
    status: editing.status,
  } : EMPTY_FORM)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              placeholder="Short description of this category..."
              value={form.desc} onChange={e => set('desc', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Icon / Emoji</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="Paste an emoji e.g. 🎵"
              value={form.icon} onChange={e => set('icon', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Booking Type</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              value={form.bookingType} onChange={e => set('bookingType', e.target.value)}
            >
              {BOOKING_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Status</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              value={form.status} onChange={e => set('status', e.target.value)}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function CategoriesPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)

  const handleAdd = () => { setEditingCat(null); setShowModal(true) }
  const handleEdit = cat => { setEditingCat(cat); setShowModal(true) }
  const handleToggle = id => {
    setCategories(cats => cats.map(c => c.id===id ? { ...c, status: c.status==='Active' ? 'Inactive' : 'Active' } : c))
  }
  const handleSave = form => {
    if (editingCat) {
      setCategories(cats => cats.map(c => c.id===editingCat.id ? { ...c, ...form } : c))
    } else {
      const newId = `CAT${String(categories.length+1).padStart(3,'0')}`
      setCategories(cats => [...cats, { id:newId, businesses:0, ...form }])
    }
  }

  const total = categories.length
  const active = categories.filter(c => c.status==='Active').length
  const inactive = categories.filter(c => c.status==='Inactive').length

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
          {label:'Total Categories', value:total, cls:'bg-brand/8 text-brand'},
          {label:'Active', value:active, cls:'bg-success/8 text-success'},
          {label:'Inactive', value:inactive, cls:'bg-slate-100 text-slate-500'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid of category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{cat.icon}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.status==='Active' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{cat.status}</span>
              </div>
              <h3 className="font-black text-slate-800 text-base mb-1">{cat.name}</h3>
              <p className="text-sm text-slate-400 leading-snug line-clamp-2 mb-3">{cat.desc}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-info/8 text-info">{cat.bookingType}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span><strong className="text-slate-800">{cat.businesses}</strong> businesses</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => handleEdit(cat)} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-1.5">
                <IconEdit /> Edit
              </button>
              <button onClick={() => handleToggle(cat.id)} className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${cat.status==='Active' ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
                {cat.status==='Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <AddEditModal
          editing={editingCat}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
