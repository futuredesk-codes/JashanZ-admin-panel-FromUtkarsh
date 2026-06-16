import { useState } from 'react'

/* ── Mock data ── */
const AUDIT_LOGS = [
  {id:'AUD001',user:'Super Admin',role:'Admin',action:'Created Finance User',module:'Finance',target:'FIN006 - Pooja Chadha',ip:'192.168.1.1',date:'2024-06-16',time:'10:23:45',oldVal:'—',newVal:'Finance Viewer'},
  {id:'AUD002',user:'Aisha Bhat',role:'Support',action:'Approved Vendor',module:'Businesses',target:'BUS1004 - Glam Studio',ip:'192.168.1.22',date:'2024-06-16',time:'09:51:12',oldVal:'Pending',newVal:'Approved'},
  {id:'AUD003',user:'Sandeep Kulkarni',role:'Finance',action:'Changed Commission Rate',module:'Commission',target:'Global Commission',ip:'10.0.0.5',date:'2024-06-15',time:'16:40:33',oldVal:'8%',newVal:'10%'},
  {id:'AUD004',user:'Super Admin',role:'Admin',action:'Banned Customer',module:'Customers',target:'CUST2007 - Ananya Singh',ip:'192.168.1.1',date:'2024-06-15',time:'14:22:18',oldVal:'Active',newVal:'Banned'},
  {id:'AUD005',user:'Rohan Desai',role:'Support',action:'Rejected Vendor',module:'Businesses',target:'BUS1012 - Flash Events',ip:'192.168.1.45',date:'2024-06-15',time:'11:05:44',oldVal:'Pending',newVal:'Rejected'},
  {id:'AUD006',user:'Ritu Saxena',role:'Finance',action:'Processed Settlement',module:'Settlements',target:'SET890123',ip:'10.0.0.8',date:'2024-06-14',time:'15:30:20',oldVal:'Pending',newVal:'Completed'},
  {id:'AUD007',user:'Super Admin',role:'Admin',action:'Created Support User',module:'Team',target:'SUP008 - Nikhil Joshi',ip:'192.168.1.1',date:'2024-06-14',time:'09:15:00',oldVal:'—',newVal:'Support Executive'},
  {id:'AUD008',user:'Meera Nair',role:'Support',action:'Approved Vendor',module:'Businesses',target:'BUS1019 - Stellar Caterers 9',ip:'192.168.1.33',date:'2024-06-13',time:'17:45:52',oldVal:'Pending',newVal:'Approved'},
  {id:'AUD009',user:'Manish Tomar',role:'Finance',action:'Initiated Refund',module:'Refunds',target:'BK10045',ip:'10.0.0.6',date:'2024-06-13',time:'12:20:11',oldVal:'—',newVal:'₹8,500'},
  {id:'AUD010',user:'Super Admin',role:'Admin',action:'Suspended Vendor',module:'Businesses',target:'BUS1007 - Beats & Vibes',ip:'192.168.1.1',date:'2024-06-12',time:'10:00:35',oldVal:'Approved',newVal:'Suspended'},
  {id:'AUD011',user:'Karan Shah',role:'Support',action:'Assigned Ticket',module:'Tickets',target:'TKT5521',ip:'192.168.1.61',date:'2024-06-12',time:'09:30:00',oldVal:'Open',newVal:'Assigned'},
  {id:'AUD012',user:'Ritu Saxena',role:'Finance',action:'Changed Recharge Plan',module:'Recharge',target:'Monthly Plan',ip:'10.0.0.8',date:'2024-06-11',time:'16:10:22',oldVal:'₹999',newVal:'₹1199'},
  {id:'AUD013',user:'Super Admin',role:'Admin',action:'Created Role',module:'Roles',target:'Content Manager',ip:'192.168.1.1',date:'2024-06-11',time:'11:00:00',oldVal:'—',newVal:'New Role'},
  {id:'AUD014',user:'Priya Iyer',role:'Support',action:'Approved Vendor',module:'Businesses',target:'BUS1021 - Royal Palace Banquet 11',ip:'192.168.1.82',date:'2024-06-10',time:'14:55:30',oldVal:'Pending',newVal:'Approved'},
  {id:'AUD015',user:'Sandeep Kulkarni',role:'Finance',action:'Exported Report',module:'Reports',target:'Commission Revenue Report',ip:'10.0.0.5',date:'2024-06-10',time:'10:25:14',oldVal:'—',newVal:'CSV'},
  {id:'AUD016',user:'Super Admin',role:'Admin',action:'Revoked Access',module:'Team',target:'SUP008 - Nikhil Joshi',ip:'192.168.1.1',date:'2024-06-09',time:'17:00:00',oldVal:'Active',newVal:'Inactive'},
  {id:'AUD017',user:'Arjun Tiwari',role:'Support',action:'Closed Ticket',module:'Tickets',target:'TKT5498',ip:'192.168.1.74',date:'2024-06-09',time:'13:40:22',oldVal:'Resolved',newVal:'Closed'},
  {id:'AUD018',user:'Vivek Agarwal',role:'Finance',action:'Viewed Settlement',module:'Settlements',target:'SET890098',ip:'10.0.0.9',date:'2024-06-08',time:'11:15:30',oldVal:'—',newVal:'—'},
  {id:'AUD019',user:'Super Admin',role:'Admin',action:'Reset Password',module:'Team',target:'FIN003 - Manish Tomar',ip:'192.168.1.1',date:'2024-06-08',time:'09:05:11',oldVal:'—',newVal:'Password Reset'},
  {id:'AUD020',user:'Divya Kapoor',role:'Support',action:'Updated Ticket',module:'Tickets',target:'TKT5510',ip:'192.168.1.55',date:'2024-06-07',time:'15:22:44',oldVal:'In Progress',newVal:'Waiting User'},
]

const MODULES = ['All','Businesses','Customers','Finance','Commission','Settlements','Recharge','Refunds','Team','Tickets','Roles','Reports']
const ROLES = ['All','Admin','Support','Finance']

const ROLE_STYLES = {
  Admin:   'bg-brand/8 text-brand',
  Support: 'bg-success/8 text-success',
  Finance: 'bg-warning/8 text-warning',
}

const MODULE_STYLES = {
  Businesses:  'bg-info/8 text-info',
  Customers:   'bg-brand/8 text-brand',
  Finance:     'bg-warning/8 text-warning',
  Commission:  'bg-warning/8 text-warning',
  Settlements: 'bg-success/8 text-success',
  Recharge:    'bg-info/8 text-info',
  Refunds:     'bg-danger/8 text-danger',
  Team:        'bg-slate-100 text-slate-500',
  Tickets:     'bg-info/8 text-info',
  Roles:       'bg-brand/8 text-brand',
  Reports:     'bg-slate-100 text-slate-500',
}

/* ── Icons ── */
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconArrow = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>

/* ── Main Page ── */
export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')

  const filtered = AUDIT_LOGS.filter(log => {
    const q = search.toLowerCase()
    return (
      (!q || log.action.toLowerCase().includes(q) || log.user.toLowerCase().includes(q) || log.target.toLowerCase().includes(q) || log.id.toLowerCase().includes(q)) &&
      (moduleFilter==='All' || log.module===moduleFilter) &&
      (roleFilter==='All' || log.role===roleFilter) &&
      (!dateFilter || log.date===dateFilter)
    )
  })

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Full trail of all admin actions across the platform</p>
        </div>
        <button className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90">
          <IconDownload /> Export Logs
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Total Log Entries', value:AUDIT_LOGS.length, cls:'text-brand'},
          {label:'Admin Actions', value:AUDIT_LOGS.filter(l=>l.role==='Admin').length, cls:'text-brand'},
          {label:'Support Actions', value:AUDIT_LOGS.filter(l=>l.role==='Support').length, cls:'text-success'},
          {label:'Finance Actions', value:AUDIT_LOGS.filter(l=>l.role==='Finance').length, cls:'text-warning'},
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
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 flex-1 min-w-[200px]"
          placeholder="Search by action, user, or target..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          {MODULES.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <input
          type="date"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
          value={dateFilter} onChange={e => setDateFilter(e.target.value)}
        />
        {(search||moduleFilter!=='All'||roleFilter!=='All'||dateFilter) && (
          <button onClick={() => { setSearch(''); setModuleFilter('All'); setRoleFilter('All'); setDateFilter('') }} className="bg-slate-100 text-slate-600 rounded-xl px-3 py-2.5 text-xs font-bold hover:bg-slate-200">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Log ID','User','Module','Action','Target','Change','IP Address','Date & Time'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-slate-400">{log.id}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{log.user}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_STYLES[log.role]||'bg-slate-100 text-slate-500'}`}>{log.role}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${MODULE_STYLES[log.module]||'bg-slate-100 text-slate-500'}`}>{log.module}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 whitespace-nowrap">{log.action}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-slate-600 max-w-[140px] truncate" title={log.target}>{log.target}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                      <span className="text-slate-400 font-mono">{log.oldVal}</span>
                      <span className="text-slate-300"><IconArrow /></span>
                      <span className="font-bold text-slate-700 font-mono">{log.newVal}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-slate-500">{log.ip}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{log.date}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{log.time}</p>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No audit logs match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {AUDIT_LOGS.length} log entries
        </div>
      </div>
    </div>
  )
}
