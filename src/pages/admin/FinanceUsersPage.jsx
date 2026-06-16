import { useState } from 'react'

/* ── Mock data ── */
const INITIAL_FINANCE_USERS = [
  {id:'FIN001',name:'Sandeep Kulkarni',empId:'EMP2001',mobile:'+91 9912345678',email:'sandeep@jashanz.in',role:'Finance Manager',status:'Active',img:'https://i.pravatar.cc/48?img=11'},
  {id:'FIN002',name:'Ritu Saxena',empId:'EMP2002',mobile:'+91 9923456789',email:'ritu@jashanz.in',role:'Finance Executive',status:'Active',img:'https://i.pravatar.cc/48?img=48'},
  {id:'FIN003',name:'Manish Tomar',empId:'EMP2003',mobile:'+91 9934567890',email:'manish@jashanz.in',role:'Finance Executive',status:'Active',img:'https://i.pravatar.cc/48?img=6'},
  {id:'FIN004',name:'Sneha Malhotra',empId:'EMP2004',mobile:'+91 9945678901',email:'sneha@jashanz.in',role:'Finance Viewer',status:'Active',img:'https://i.pravatar.cc/48?img=45'},
  {id:'FIN005',name:'Vivek Agarwal',empId:'EMP2005',mobile:'+91 9956789012',email:'vivek@jashanz.in',role:'Finance Manager',status:'Inactive',img:'https://i.pravatar.cc/48?img=14'},
  {id:'FIN006',name:'Pooja Chadha',empId:'EMP2006',mobile:'+91 9967890123',email:'pooja@jashanz.in',role:'Finance Viewer',status:'Active',img:'https://i.pravatar.cc/48?img=50'},
]

const FINANCE_ROLES = ['Finance Viewer','Finance Executive','Finance Manager']

const ROLE_STYLES = {
  'Finance Viewer':    'bg-slate-100 text-slate-500',
  'Finance Executive': 'bg-info/8 text-info',
  'Finance Manager':   'bg-brand/8 text-brand',
}

/* ── Icons ── */
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconDeactivate = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Add Finance User Modal ── */
function AddFinanceUserModal({ editingUser, onClose, onSave }) {
  const [form, setForm] = useState(editingUser ? {
    name: editingUser.name, empId: editingUser.empId,
    mobile: editingUser.mobile, email: editingUser.email,
    role: editingUser.role,
  } : { name:'', empId:'', mobile:'', email:'', role:'Finance Viewer' })

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
          <h3 className="font-black text-slate-800">{editingUser ? 'Edit Finance User' : 'Add Finance User'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Full Name</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Employee ID</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="EMP2007" value={form.empId} onChange={e => set('empId', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Mobile</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="+91 9900000000" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Email</label>
              <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="user@jashanz.in" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Role</label>
            <div className="space-y-2">
              {FINANCE_ROLES.map(r => (
                <label key={r} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${form.role===r ? 'bg-brand/8 border-brand/30' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input type="radio" name="role" className="hidden" checked={form.role===r} onChange={() => set('role', r)} />
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.role===r ? 'border-brand' : 'border-slate-300'}`}>
                    {form.role===r && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${form.role===r ? 'text-brand' : 'text-slate-700'}`}>{r}</p>
                    <p className="text-xs text-slate-400">
                      {r==='Finance Viewer' && 'Read-only access to financial data'}
                      {r==='Finance Executive' && 'Can process settlements and refunds'}
                      {r==='Finance Manager' && 'Full finance access including commission settings'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90">{editingUser ? 'Save Changes' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function FinanceUsersPage() {
  const [users, setUsers] = useState(INITIAL_FINANCE_USERS)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const handleEdit = u => { setEditingUser(u); setShowModal(true) }
  const handleAdd = () => { setEditingUser(null); setShowModal(true) }
  const handleDeactivate = id => {
    setUsers(us => us.map(u => u.id===id ? { ...u, status: u.status==='Active' ? 'Inactive' : 'Active' } : u))
  }
  const handleSave = form => {
    if (editingUser) {
      setUsers(us => us.map(u => u.id===editingUser.id ? { ...u, ...form } : u))
    } else {
      const newUser = {
        id: `FIN${String(users.length+1).padStart(3,'0')}`,
        status: 'Active',
        img: `https://i.pravatar.cc/48?img=${users.length+20}`,
        ...form,
      }
      setUsers(us => [...us, newUser])
    }
  }

  const total = users.length
  const managers = users.filter(u => u.role==='Finance Manager').length
  const executives = users.filter(u => u.role==='Finance Executive').length
  const viewers = users.filter(u => u.role==='Finance Viewer').length

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Finance Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage finance team members and their roles</p>
        </div>
        <button onClick={handleAdd} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90">
          <IconPlus /> Add Finance User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Total Finance Users', value:total, cls:'text-brand'},
          {label:'Finance Managers', value:managers, cls:'text-warning'},
          {label:'Finance Executives', value:executives, cls:'text-info'},
          {label:'Finance Viewers', value:viewers, cls:'text-slate-500'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['User','Email','Mobile','Role','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.img} alt={u.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-slate-800 leading-tight">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.empId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.mobile}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.status==='Active' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(u)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="Edit"><IconEdit /></button>
                      <button onClick={() => handleDeactivate(u.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-warning/8 text-warning hover:bg-warning/15" title={u.status==='Active' ? 'Deactivate' : 'Activate'}><IconDeactivate /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          {users.length} finance users total
        </div>
      </div>

      {showModal && (
        <AddFinanceUserModal
          editingUser={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
