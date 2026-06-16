import { useState } from 'react'

/* ── Mock data ── */
const CUSTOMERS = Array.from({length:20},(_,i)=>({
  id:`CUST${String(2001+i).padStart(4,'0')}`,
  name:['Priya Sharma','Amit Kumar','Neha Joshi','Rohit Mehta','Deepa Rao','Sanjay Patel','Ananya Singh','Kunal Verma','Ritu Gupta','Arjun Nair'][i%10]+(i>=10?` ${i}`:''),
  email:`user${i+1}@example.com`,
  mobile:`+91 70${String(10000000+i*2345678%90000000).slice(0,8)}`,
  city:['Mumbai','Delhi','Pune','Bangalore','Chennai','Hyderabad'][i%6],
  bookings:Math.floor((i+1)*3.7),
  spent:`₹${((i+1)*4200).toLocaleString('en-IN')}`,
  status:['Active','Active','Active','Suspended','Active','Active','Banned','Active','Active','Active'][i%10],
  joined:`2024-${String((i%12)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`,
  img:`https://i.pravatar.cc/40?img=${i+20}`,
}))

const STATUS_STYLES = {
  Active:    'bg-success/10 text-success',
  Suspended: 'bg-warning/10 text-warning',
  Banned:    'bg-danger/10 text-danger',
}

const MOCK_BOOKINGS = [
  {id:'BK20001',vendor:'Royal Palace Banquet',date:'2024-04-15',amount:'₹45,000',status:'Completed'},
  {id:'BK20002',vendor:'Groove Masters DJ',date:'2024-05-01',amount:'₹12,000',status:'Completed'},
  {id:'BK20003',vendor:'Dream Decors',date:'2024-05-22',amount:'₹8,500',status:'Cancelled'},
  {id:'BK20004',vendor:'Glam Studio',date:'2024-06-05',amount:'₹6,000',status:'Accepted'},
  {id:'BK20005',vendor:'Click Perfect Photography',date:'2024-06-12',amount:'₹25,000',status:'Pending'},
]

const MOCK_TICKETS = [
  {id:'TKT5001',type:'Refund Request',status:'Open',date:'2024-06-10'},
  {id:'TKT5002',type:'Booking Issue',status:'Resolved',date:'2024-05-28'},
  {id:'TKT5003',type:'Account Problem',status:'In Progress',date:'2024-06-14'},
]

const MOCK_PAYMENTS = [
  {id:'PAY8001',amount:'₹45,000',method:'UPI',date:'2024-04-15',status:'Success'},
  {id:'PAY8002',amount:'₹12,000',method:'Net Banking',date:'2024-05-01',status:'Success'},
  {id:'PAY8003',amount:'₹8,500',method:'Credit Card',date:'2024-05-22',status:'Refunded'},
  {id:'PAY8004',amount:'₹6,000',method:'UPI',date:'2024-06-05',status:'Success'},
]

const TICKET_STYLES = { Open:'bg-warning/10 text-warning', Resolved:'bg-success/10 text-success', 'In Progress':'bg-info/10 text-info' }
const BOOKING_STYLES = { Completed:'bg-success/10 text-success', Pending:'bg-warning/10 text-warning', Accepted:'bg-info/10 text-info', Cancelled:'bg-danger/10 text-danger' }
const PAYMENT_STYLES = { Success:'bg-success/10 text-success', Refunded:'bg-warning/10 text-warning', Failed:'bg-danger/10 text-danger' }

/* ── Icons ── */
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconBan = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const IconCredit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>

/* ── Customer Detail Modal ── */
function CustomerDetailModal({ cust, onClose }) {
  const [tab, setTab] = useState('Profile')
  const tabs = ['Profile','Booking History','Support Tickets','Payment History']

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src={cust.img} alt={cust.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h3 className="font-black text-slate-800 text-base">{cust.name}</h3>
              <p className="text-xs text-slate-400">{cust.id} &middot; {cust.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[cust.status]}`}>{cust.status}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${tab===t ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {tab === 'Profile' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Full Name', cust.name], ['Customer ID', cust.id], ['Email', cust.email],
                ['Mobile', cust.mobile], ['City', cust.city], ['Status', cust.status],
                ['Total Bookings', cust.bookings], ['Total Spent', cust.spent],
                ['Joined On', cust.joined],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-bold text-slate-800">{String(v)}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Booking History' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Booking ID','Vendor','Date','Amount','Status'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_BOOKINGS.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-xs text-slate-500">{b.id}</td>
                      <td className="py-2.5 text-xs font-semibold text-slate-700">{b.vendor}</td>
                      <td className="py-2.5 text-xs text-slate-500">{b.date}</td>
                      <td className="py-2.5 text-xs font-bold text-slate-800">{b.amount}</td>
                      <td className="py-2.5"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BOOKING_STYLES[b.status]||'bg-slate-100 text-slate-500'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Support Tickets' && (
            <div className="space-y-3">
              {MOCK_TICKETS.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.type}</p>
                    <p className="text-xs text-slate-400">{t.id} &middot; {t.date}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TICKET_STYLES[t.status]||'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'Payment History' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Payment ID','Amount','Method','Date','Status'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_PAYMENTS.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="py-2.5 text-xs font-bold text-slate-800">{p.amount}</td>
                      <td className="py-2.5 text-xs text-slate-600">{p.method}</td>
                      <td className="py-2.5 text-xs text-slate-500">{p.date}</td>
                      <td className="py-2.5"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_STYLES[p.status]||'bg-slate-100 text-slate-500'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <div className="flex gap-2">
            <button className="bg-warning/10 text-warning rounded-xl px-4 py-2 text-sm font-bold hover:bg-warning/20">Suspend</button>
            <button className="bg-danger/10 text-danger rounded-xl px-4 py-2 text-sm font-bold hover:bg-danger/20">Ban</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [viewCust, setViewCust] = useState(null)

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase()
    return (
      (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) &&
      (!statusFilter || c.status === statusFilter) &&
      (!cityFilter || c.city === cityFilter)
    )
  })

  const total = CUSTOMERS.length
  const active = CUSTOMERS.filter(c => c.status==='Active').length
  const suspended = CUSTOMERS.filter(c => c.status==='Suspended').length
  const banned = CUSTOMERS.filter(c => c.status==='Banned').length

  const cities = [...new Set(CUSTOMERS.map(c => c.city))]

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Customer Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and manage all registered customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Total Customers', value:total, color:'info'},
          {label:'Active', value:active, color:'success'},
          {label:'Suspended', value:suspended, color:'warning'},
          {label:'Banned', value:banned, color:'danger'},
        ].map(s => {
          const clr = {info:'bg-info/8 text-info',warning:'bg-warning/8 text-warning',success:'bg-success/8 text-success',danger:'bg-danger/8 text-danger'}
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
              <p className={`text-2xl font-black ${clr[s.color].split(' ')[1]}`}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <input
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 flex-1 min-w-[180px]"
          placeholder="Search by name, email or ID..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['Active','Suspended','Banned'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90">
          <IconDownload /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Customer','Email','Mobile','City','Bookings','Spent','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={cust.img} alt={cust.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-slate-800 leading-tight">{cust.name}</p>
                        <p className="text-[11px] text-slate-400">{cust.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{cust.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{cust.mobile}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{cust.city}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{cust.bookings}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{cust.spent}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[cust.status]}`}>{cust.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewCust(cust)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="View"><IconEye /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-warning/8 text-warning hover:bg-warning/15" title="Suspend"><IconPause /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15" title="Ban"><IconBan /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-success/10 text-success hover:bg-success/20" title="Credit Amount"><IconCredit /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No customers match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {total} customers
        </div>
      </div>

      {viewCust && <CustomerDetailModal cust={viewCust} onClose={() => setViewCust(null)} />}
    </div>
  )
}
