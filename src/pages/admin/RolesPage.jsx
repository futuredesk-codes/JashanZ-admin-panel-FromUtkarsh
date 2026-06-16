import { useState } from 'react'

/* ── Mock data ── */
const ALL_PERMISSIONS = [
  {id:'biz_approve',label:'Business Approval',group:'Businesses'},
  {id:'biz_view',label:'View Businesses',group:'Businesses'},
  {id:'biz_ban',label:'Ban/Suspend Businesses',group:'Businesses'},
  {id:'cust_view',label:'View Customers',group:'Customers'},
  {id:'cust_manage',label:'Manage Customers',group:'Customers'},
  {id:'ticket_access',label:'Ticket Access',group:'Support'},
  {id:'ticket_assign',label:'Assign Tickets',group:'Support'},
  {id:'rev_view',label:'View Revenue Reports',group:'Finance'},
  {id:'commission',label:'Commission Settings',group:'Finance'},
  {id:'recharge',label:'Recharge Settings',group:'Finance'},
  {id:'settlement',label:'Settlement Management',group:'Finance'},
  {id:'export',label:'Export Data',group:'Reports'},
  {id:'audit',label:'View Audit Logs',group:'Reports'},
  {id:'user_mgmt',label:'User Management',group:'Administration'},
  {id:'role_mgmt',label:'Role Management',group:'Administration'},
  {id:'system',label:'System Settings',group:'Administration'},
]

const INITIAL_ROLES = [
  {id:'ROLE001',name:'Super Admin',description:'Full system access',color:'bg-brand text-white',users:2,permissions:ALL_PERMISSIONS.map(p=>p.id)},
  {id:'ROLE002',name:'Support Admin',description:'Vendor approval and ticket management',color:'bg-success/10 text-success',users:5,permissions:['biz_approve','biz_view','ticket_access','ticket_assign','cust_view']},
  {id:'ROLE003',name:'Finance Admin',description:'Revenue and settlement management',color:'bg-warning/10 text-warning',users:3,permissions:['rev_view','commission','recharge','settlement','export']},
  {id:'ROLE004',name:'Content Manager',description:'Category and content management',color:'bg-info/10 text-info',users:2,permissions:['biz_view','cust_view','export']},
  {id:'ROLE005',name:'Viewer',description:'Read-only access to all sections',color:'bg-slate-100 text-slate-500',users:4,permissions:['biz_view','cust_view','rev_view','audit']},
]

const MOCK_ROLE_USERS = {
  ROLE001: [{name:'Super Admin',img:'https://i.pravatar.cc/32?img=1'},{name:'System Admin',img:'https://i.pravatar.cc/32?img=2'}],
  ROLE002: [{name:'Aisha Bhat',img:'https://i.pravatar.cc/32?img=47'},{name:'Rohan Desai',img:'https://i.pravatar.cc/32?img=15'},{name:'Meera Nair',img:'https://i.pravatar.cc/32?img=44'},{name:'Priya Iyer',img:'https://i.pravatar.cc/32?img=49'},{name:'Arjun Tiwari',img:'https://i.pravatar.cc/32?img=8'}],
  ROLE003: [{name:'Sandeep Kulkarni',img:'https://i.pravatar.cc/32?img=11'},{name:'Ritu Saxena',img:'https://i.pravatar.cc/32?img=48'},{name:'Manish Tomar',img:'https://i.pravatar.cc/32?img=6'}],
  ROLE004: [{name:'Content Mgr A',img:'https://i.pravatar.cc/32?img=20'},{name:'Content Mgr B',img:'https://i.pravatar.cc/32?img=21'}],
  ROLE005: [{name:'Viewer A',img:'https://i.pravatar.cc/32?img=30'},{name:'Viewer B',img:'https://i.pravatar.cc/32?img=31'},{name:'Viewer C',img:'https://i.pravatar.cc/32?img=32'},{name:'Viewer D',img:'https://i.pravatar.cc/32?img=33'}],
}

const PERM_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))]

/* ── Icons ── */
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconUsers = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>

/* ── Create Role Modal ── */
function CreateRoleModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', description:'', permissions:[] })

  const togglePerm = id => setForm(f => ({
    ...f, permissions: f.permissions.includes(id) ? f.permissions.filter(p => p!==id) : [...f.permissions, id]
  }))

  const toggleGroup = group => {
    const groupPerms = ALL_PERMISSIONS.filter(p => p.group===group).map(p => p.id)
    const allSelected = groupPerms.every(id => form.permissions.includes(id))
    setForm(f => ({
      ...f, permissions: allSelected
        ? f.permissions.filter(id => !groupPerms.includes(id))
        : [...new Set([...f.permissions, ...groupPerms])]
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Create New Role</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Role Name</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="e.g. Regional Manager" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" placeholder="Role description" value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Permissions</p>
            <div className="space-y-4">
              {PERM_GROUPS.map(group => {
                const groupPerms = ALL_PERMISSIONS.filter(p => p.group===group)
                const allSelected = groupPerms.every(p => form.permissions.includes(p.id))
                return (
                  <div key={group} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggleGroup(group)} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${allSelected ? 'bg-brand/8 text-brand' : 'bg-slate-50 text-slate-700'}`}>
                      <span>{group}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${allSelected ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>{groupPerms.filter(p => form.permissions.includes(p.id)).length}/{groupPerms.length}</span>
                    </button>
                    <div className="divide-y divide-slate-100">
                      {groupPerms.map(perm => (
                        <label key={perm.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
                          <input type="checkbox" className="hidden" checked={form.permissions.includes(perm.id)} onChange={() => togglePerm(perm.id)} />
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${form.permissions.includes(perm.id) ? 'bg-brand border-brand' : 'border-slate-300'}`}>
                            {form.permissions.includes(perm.id) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                          </span>
                          <span className="text-sm text-slate-700">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90">Create Role</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function RolesPage() {
  const [roles, setRoles] = useState(INITIAL_ROLES)
  const [selectedRole, setSelectedRole] = useState(INITIAL_ROLES[0])
  const [showModal, setShowModal] = useState(false)

  const handleSave = form => {
    const colors = ['bg-brand text-white','bg-success/10 text-success','bg-warning/10 text-warning','bg-info/10 text-info','bg-slate-100 text-slate-500']
    const newRole = {
      id: `ROLE${String(roles.length+1).padStart(3,'0')}`,
      color: colors[roles.length % colors.length],
      users: 0,
      ...form,
    }
    setRoles(r => [...r, newRole])
  }

  const roleUsers = MOCK_ROLE_USERS[selectedRole?.id] || []

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Define and manage access control roles for all team members</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Left: Role list */}
        <div className="w-72 shrink-0 space-y-3">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${selectedRole?.id===role.id ? 'border-brand shadow-md shadow-brand/10' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${role.color}`}>{role.name}</span>
                {selectedRole?.id===role.id && (
                  <span className="w-2 h-2 rounded-full bg-brand" />
                )}
              </div>
              <p className="text-xs text-slate-500 leading-snug mb-2">{role.description}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <IconUsers />
                <span><strong className="text-slate-600">{role.users}</strong> users</span>
                <span className="ml-auto text-[11px] text-slate-400">{role.permissions.length} perms</span>
              </div>
            </button>
          ))}

          {/* Add role card */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-white rounded-2xl border border-dashed border-slate-300 p-4 hover:border-brand/50 hover:bg-brand/4 transition-colors group"
          >
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-8 h-8 rounded-xl bg-brand/8 text-brand flex items-center justify-center group-hover:bg-brand/15 transition-colors">
                <IconPlus />
              </div>
              <p className="text-xs font-bold text-slate-500 group-hover:text-brand transition-colors">Create New Role</p>
            </div>
          </button>
        </div>

        {/* Right: Permission matrix */}
        {selectedRole && (
          <div className="flex-1 space-y-4">
            {/* Role header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedRole.color}`}>{selectedRole.name}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{selectedRole.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span><strong className="text-slate-700">{selectedRole.users}</strong> users with this role</span>
                    <span><strong className="text-slate-700">{selectedRole.permissions.length}</strong> of {ALL_PERMISSIONS.length} permissions granted</span>
                  </div>
                </div>
                <button className="bg-slate-100 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5">
                  <IconEdit /> Edit Role
                </button>
              </div>
            </div>

            {/* Permission groups */}
            {PERM_GROUPS.map(group => {
              const groupPerms = ALL_PERMISSIONS.filter(p => p.group===group)
              const grantedCount = groupPerms.filter(p => selectedRole.permissions.includes(p.id)).length
              return (
                <div key={group} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{group}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${grantedCount===groupPerms.length ? 'bg-success/10 text-success' : grantedCount>0 ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-400'}`}>
                      {grantedCount}/{groupPerms.length}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {groupPerms.map(perm => {
                      const granted = selectedRole.permissions.includes(perm.id)
                      return (
                        <div key={perm.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                          <span className="text-sm text-slate-700">{perm.label}</span>
                          <div className={`w-8 h-4 rounded-full flex items-center transition-colors ${granted ? 'bg-success justify-end' : 'bg-slate-200 justify-start'}`}>
                            <div className="w-3 h-3 bg-white rounded-full mx-0.5 shadow-sm" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Users with this role */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Users with this Role</p>
              {roleUsers.length === 0 ? (
                <p className="text-sm text-slate-400">No users assigned to this role yet</p>
              ) : (
                <div className="space-y-2">
                  {roleUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <img src={u.img} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                      <span className="text-sm font-semibold text-slate-700">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && <CreateRoleModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
