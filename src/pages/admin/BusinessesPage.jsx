import { useState } from 'react'

/* ── Mock data ── */
const CATEGORIES = ['DJ','Decorator','Makeup Artist','Event Organizer','Photographer','Influencer','Banquet Hall','Catering']
const CITIES = ['Mumbai','Delhi','Pune','Bangalore','Chennai','Hyderabad','Kolkata','Ahmedabad']
const STATUSES_LIST = ['Pending','Approved','Rejected','Suspended','Banned']
const BOOKING_TYPE_MAP = { DJ:'Slot Booking', Decorator:'Per Day Booking', 'Makeup Artist':'Appointment Booking', 'Event Organizer':'Per Day Booking', Photographer:'Home Service Booking', Influencer:'Slot Booking', 'Banquet Hall':'Slot Booking', Catering:'Per Day Booking' }

const BUSINESSES = Array.from({length:24},(_,i) => ({
  id:`BUS${String(1001+i).padStart(4,'0')}`,
  name:['Royal Palace Banquet','Groove Masters DJ','Dream Decors','Glam Studio','Click Perfect Photography','Party Hub Events','Stellar Caterers','Beats & Vibes','Flora Decorations','Snap Moments'][i%10]+(i>=10?` ${i}`:''),
  owner:['Rajesh Kumar','Priya Singh','Amit Patel','Sunita Sharma','Vikram Mehta','Anita Rao','Suresh Gupta','Meera Joshi','Rahul Verma','Kavya Reddy'][i%10],
  category:CATEGORIES[i%CATEGORIES.length],
  city:CITIES[i%CITIES.length],
  state:['Maharashtra','Delhi','Maharashtra','Karnataka','Tamil Nadu','Telangana','West Bengal','Gujarat'][i%8],
  status:STATUSES_LIST[i%5],
  mobile:`+91 98${String(10000000+i*1234567%90000000).slice(0,8)}`,
  email:`biz${i+1}@example.com`,
  registered:`2024-${String((i%12)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`,
  bookings:Math.floor((i+1)*7.3),
  revenue:`₹${((i+1)*18500).toLocaleString('en-IN')}`,
  img:`https://i.pravatar.cc/48?img=${i+1}`,
}))

const MOCK_BIZ_BOOKINGS = [
  {id:'BK10001',customer:'Priya Sharma',date:'2024-05-12',amount:'₹18,500',status:'Completed'},
  {id:'BK10002',customer:'Amit Kumar',date:'2024-05-18',amount:'₹22,000',status:'Completed'},
  {id:'BK10003',customer:'Neha Joshi',date:'2024-06-01',amount:'₹15,000',status:'Pending'},
  {id:'BK10004',customer:'Rohit Mehta',date:'2024-06-05',amount:'₹30,000',status:'Accepted'},
  {id:'BK10005',customer:'Deepa Rao',date:'2024-06-10',amount:'₹12,500',status:'Cancelled'},
]

const STATUS_STYLES = {
  Pending:   'bg-warning/10 text-warning',
  Approved:  'bg-success/10 text-success',
  Rejected:  'bg-danger/10 text-danger',
  Suspended: 'bg-orange-100 text-orange-600',
  Banned:    'bg-red-100 text-red-700',
}

const BOOKING_STATUS_STYLES = {
  Completed: 'bg-success/10 text-success',
  Pending:   'bg-warning/10 text-warning',
  Accepted:  'bg-info/10 text-info',
  Cancelled: 'bg-danger/10 text-danger',
}

/* ── Icons ── */
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconBan = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Business Detail Modal ── */
function BusinessDetailModal({ biz, onClose }) {
  const [tab, setTab] = useState('overview')
  const tabs = ['Overview','Documents','Bank Details','Bookings']

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src={biz.img} alt={biz.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h3 className="font-black text-slate-800 text-base">{biz.name}</h3>
              <p className="text-xs text-slate-400">{biz.id} &middot; {biz.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[biz.status]}`}>{biz.status}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${tab===t ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 p-6">
          {tab === 'Overview' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Owner', biz.owner], ['Mobile', biz.mobile], ['Email', biz.email],
                ['Category', biz.category], ['City', biz.city], ['State', biz.state],
                ['Booking Type', BOOKING_TYPE_MAP[biz.category] || 'Slot Booking'],
                ['Revenue', biz.revenue], ['Total Bookings', biz.bookings],
                ['Registered On', biz.registered],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-bold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Documents' && (
            <div className="space-y-3">
              {['GST Certificate','PAN Card','Business License','Aadhar Card'].map(doc => (
                <div key={doc} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-info/8 rounded-xl flex items-center justify-center text-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{doc}</p>
                      <p className="text-xs text-slate-400">Uploaded · Verified</p>
                    </div>
                  </div>
                  <button className="bg-info/8 text-info text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-info/15">View</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'Bank Details' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Account Holder', biz.owner],
                ['Account Number', '****4821'],
                ['Bank', 'State Bank of India'],
                ['IFSC Code', 'SBIN0012345'],
                ['Branch', `${biz.city} Main Branch`],
                ['Account Type', 'Current'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-bold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Bookings' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">Booking ID</th>
                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">Customer</th>
                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">Date</th>
                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">Amount</th>
                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_BIZ_BOOKINGS.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-xs text-slate-500">{b.id}</td>
                      <td className="py-2.5 font-semibold text-slate-700">{b.customer}</td>
                      <td className="py-2.5 text-slate-500">{b.date}</td>
                      <td className="py-2.5 font-bold text-slate-800">{b.amount}</td>
                      <td className="py-2.5"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BOOKING_STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <div className="flex gap-2">
            <button className="bg-success/10 text-success rounded-xl px-4 py-2 text-sm font-bold hover:bg-success/20">Activate</button>
            <button className="bg-orange-100 text-orange-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-orange-200">Suspend</button>
            <button className="bg-danger/10 text-danger rounded-xl px-4 py-2 text-sm font-bold hover:bg-danger/20">Ban</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function BusinessesPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewBiz, setViewBiz] = useState(null)

  const filtered = BUSINESSES.filter(b => {
    const q = search.toLowerCase()
    return (
      (!q || b.name.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)) &&
      (!catFilter || b.category === catFilter) &&
      (!cityFilter || b.city === cityFilter) &&
      (!statusFilter || b.status === statusFilter)
    )
  })

  const total = BUSINESSES.length
  const pending = BUSINESSES.filter(b => b.status==='Pending').length
  const approved = BUSINESSES.filter(b => b.status==='Approved').length
  const rejBanned = BUSINESSES.filter(b => b.status==='Rejected'||b.status==='Banned').length

  return (
    <div className="space-y-5 pb-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Business Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage all registered businesses on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Total Businesses', value:total, color:'info'},
          {label:'Pending Approval', value:pending, color:'warning'},
          {label:'Approved', value:approved, color:'success'},
          {label:'Rejected / Banned', value:rejBanned, color:'danger'},
        ].map(s => {
          const clr = {info:'bg-info/8 text-info',warning:'bg-warning/8 text-warning',success:'bg-success/8 text-success',danger:'bg-danger/8 text-danger'}
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className={`w-9 h-9 rounded-xl ${clr[s.color]} flex items-center justify-center mb-3 text-lg font-black`}>
                {s.value > 99 ? '🏢' : s.value}
              </div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <input
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 flex-1 min-w-[180px]"
          placeholder="Search by name, owner, or ID..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES_LIST.map(s => <option key={s}>{s}</option>)}
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
                {['Business','Category','City','Status','Bookings','Registered','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(biz => (
                <tr key={biz.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={biz.img} alt={biz.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 text-xs leading-tight">{biz.name}</p>
                        <p className="text-[11px] text-slate-400">{biz.id} &middot; {biz.owner}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{biz.category}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{biz.city}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[biz.status]}`}>{biz.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{biz.bookings}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{biz.registered}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewBiz(biz)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15 transition-colors" title="View"><IconEye /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-warning/8 text-warning hover:bg-warning/15 transition-colors" title="Suspend"><IconPause /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15 transition-colors" title="Ban"><IconBan /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No businesses match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {total} businesses
        </div>
      </div>

      {viewBiz && <BusinessDetailModal biz={viewBiz} onClose={() => setViewBiz(null)} />}
    </div>
  )
}
