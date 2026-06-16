import { useState } from 'react'

/* ── Mock data ── */
const SUPPORT_USERS = [
  {id:'SUP001',name:'Aisha Bhat',empId:'EMP1001',mobile:'+91 9812345678',email:'aisha@jashanz.in',designation:'Senior Support Executive',location:['Mumbai','Pune'],categories:['DJ','Decorator'],permission:'Full Support Access',status:'Active',img:'https://i.pravatar.cc/48?img=47'},
  {id:'SUP002',name:'Rohan Desai',empId:'EMP1002',mobile:'+91 9823456789',email:'rohan@jashanz.in',designation:'Support Executive',location:['Delhi'],categories:['Photographer','Influencer'],permission:'Approval Access',status:'Active',img:'https://i.pravatar.cc/48?img=15'},
  {id:'SUP003',name:'Meera Nair',empId:'EMP1003',mobile:'+91 9834567890',email:'meera@jashanz.in',designation:'Support Lead',location:['Bangalore','Chennai'],categories:['Makeup Artist','Catering'],permission:'Ticket Access',status:'Active',img:'https://i.pravatar.cc/48?img=44'},
  {id:'SUP004',name:'Karan Shah',empId:'EMP1004',mobile:'+91 9845678901',email:'karan@jashanz.in',designation:'Junior Executive',location:['Hyderabad'],categories:['Event Organizer'],permission:'View Only',status:'Inactive',img:'https://i.pravatar.cc/48?img=12'},
  {id:'SUP005',name:'Priya Iyer',empId:'EMP1005',mobile:'+91 9856789012',email:'priya@jashanz.in',designation:'Support Executive',location:['Mumbai'],categories:['Banquet Hall','Anchor'],permission:'Full Support Access',status:'Active',img:'https://i.pravatar.cc/48?img=49'},
  {id:'SUP006',name:'Arjun Tiwari',empId:'EMP1006',mobile:'+91 9867890123',email:'arjun@jashanz.in',designation:'Senior Executive',location:['Kolkata','Ahmedabad'],categories:['DJ','Catering'],permission:'Approval Access',status:'Active',img:'https://i.pravatar.cc/48?img=8'},
  {id:'SUP007',name:'Divya Kapoor',empId:'EMP1007',mobile:'+91 9878901234',email:'divya@jashanz.in',designation:'Support Executive',location:['Pune'],categories:['Photographer'],permission:'Ticket Access',status:'Active',img:'https://i.pravatar.cc/48?img=46'},
  {id:'SUP008',name:'Nikhil Joshi',empId:'EMP1008',mobile:'+91 9889012345',email:'nikhil@jashanz.in',designation:'Junior Executive',location:['Delhi'],categories:['Decorator','Event Organizer'],permission:'View Only',status:'Inactive',img:'https://i.pravatar.cc/48?img=3'},
]

const PERMISSIONS = ['View Only','Approval Access','Ticket Access','Full Support Access']
const ALL_LOCATIONS = ['Mumbai','Delhi','Pune','Bangalore','Chennai','Hyderabad','Kolkata','Ahmedabad']
const ALL_CATEGORIES = ['DJ','Decorator','Makeup Artist','Event Organizer','Photographer','Influencer','Banquet Hall','Catering','Anchor','Light & Sound']

const PERMISSION_STYLES = {
  'View Only':          'bg-slate-100 text-slate-500',
  'Approval Access':    'bg-info/8 text-info',
  'Ticket Access':      'bg-warning/8 text-warning',
  'Full Support Access':'bg-success/8 text-success',
}

/* ── Icons ── */
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconBan = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Add Support User Modal ── */
function AddSupportUserModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name:'', empId:'', mobile:'', email:'', designation:'',
    location:[], categories:[], permission:'View Only',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleArr = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x!==v) : [...f[k], v]
  }))

  const handleSubmit = e => {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Add Support User</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Full Name</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Employee ID</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="EMP1001" value={form.empId} onChange={e => set('empId', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Mobile</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="+91 9800000000" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Email</label>
              <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="user@jashanz.in" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Designation</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="e.g. Support Executive" value={form.designation} onChange={e => set('designation', e.target.value)} />
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Assign Locations</label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_LOCATIONS.map(loc => (
                <label key={loc} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs font-semibold transition-colors ${form.location.includes(loc) ? 'bg-brand/8 border-brand/30 text-brand' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" className="hidden" checked={form.location.includes(loc)} onChange={() => toggleArr('location', loc)} />
                  <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.location.includes(loc) ? 'bg-brand border-brand' : 'border-slate-300'}`}>
                    {form.location.includes(loc) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  </span>
                  {loc}
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Assign Categories</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_CATEGORIES.map(cat => (
                <label key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs font-semibold transition-colors ${form.categories.includes(cat) ? 'bg-brand/8 border-brand/30 text-brand' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" className="hidden" checked={form.categories.includes(cat)} onChange={() => toggleArr('categories', cat)} />
                  <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.categories.includes(cat) ? 'bg-brand border-brand' : 'border-slate-300'}`}>
                    {form.categories.includes(cat) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  </span>
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Permission */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Permission Level</label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map(p => (
                <label key={p} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${form.permission===p ? 'bg-brand/8 border-brand/30' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="radio" name="permission" className="hidden" checked={form.permission===p} onChange={() => set('permission', p)} />
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.permission===p ? 'border-brand' : 'border-slate-300'}`}>
                    {form.permission===p && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </span>
                  <span className={`text-xs font-bold ${form.permission===p ? 'text-brand' : 'text-slate-600'}`}>{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90">Create User</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function SupportUsersPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState(SUPPORT_USERS)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.empId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const total = users.length
  const active = users.filter(u => u.status==='Active').length
  const inactive = users.filter(u => u.status==='Inactive').length

  const handleSave = form => {
    const newUser = {
      id: `SUP${String(users.length+1).padStart(3,'0')}`,
      status: 'Active',
      img: `https://i.pravatar.cc/48?img=${users.length+10}`,
      ...form,
    }
    setUsers(u => [...u, newUser])
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Support Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage support team members and their access permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Total Support Users', value:total, cls:'text-brand'},
          {label:'Active', value:active, cls:'text-success'},
          {label:'Inactive', value:inactive, cls:'text-slate-500'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header with search and add */}
      <div className="flex items-center gap-3">
        <input
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 flex-1"
          placeholder="Search by name, employee ID, or email..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => setShowModal(true)} className="bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand/90 whitespace-nowrap">
          <IconPlus /> Add Support User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['User','Designation','Locations','Permission','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.img} alt={u.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-slate-800 leading-tight">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.empId} &middot; {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{u.designation}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.location.map(l => (
                        <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold">{l}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PERMISSION_STYLES[u.permission]}`}>{u.permission}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.status==='Active' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="Edit"><IconEdit /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15" title="Revoke Access"><IconBan /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No support users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {total} support users
        </div>
      </div>

      {showModal && <AddSupportUserModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
