import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getPlatformAnalytics } from '../../api/analytics'
import { useAdminAuth } from '../../context/AdminAuthContext'

/* ── Mock data ── */
const MONTHLY_REVENUE = [
  { month: 'Jan', commission: 280000, recharge: 85000 },
  { month: 'Feb', commission: 310000, recharge: 92000 },
  { month: 'Mar', commission: 345000, recharge: 105000 },
  { month: 'Apr', commission: 390000, recharge: 118000 },
  { month: 'May', commission: 420000, recharge: 130000 },
  { month: 'Jun', commission: 482000, recharge: 124500 },
]

const MONTHLY_BOOKINGS = [
  { month: 'Jan', total: 580, completed: 490, cancelled: 55 },
  { month: 'Feb', total: 720, completed: 630, cancelled: 62 },
  { month: 'Mar', total: 890, completed: 780, cancelled: 75 },
  { month: 'Apr', total: 1050, completed: 920, cancelled: 82 },
  { month: 'May', total: 1280, completed: 1100, cancelled: 95 },
  { month: 'Jun', total: 1540, completed: 1320, cancelled: 110 },
]

const CATEGORY_DATA = [
  { name: 'Photography', value: 234 },
  { name: 'Catering', value: 189 },
  { name: 'Music / DJ', value: 145 },
  { name: 'Decoration', value: 128 },
  { name: 'Venue', value: 98 },
  { name: 'Others', value: 53 },
]

const LOCATION_DATA = [
  { city: 'Mumbai', businesses: 187, bookings: 2340, revenue: 182000 },
  { city: 'Delhi', businesses: 165, bookings: 1980, revenue: 156000 },
  { city: 'Bangalore', businesses: 142, bookings: 1720, revenue: 134000 },
  { city: 'Hyderabad', businesses: 98, bookings: 1140, revenue: 88000 },
  { city: 'Pune', businesses: 87, bookings: 980, revenue: 76000 },
  { city: 'Chennai', businesses: 75, bookings: 820, revenue: 65000 },
]

const BOOKING_STATUS = [
  { name: 'Completed', value: 6890, color: '#10b981' },
  { name: 'Accepted', value: 1230, color: '#3BBDF7' },
  { name: 'Pending', value: 340, color: '#f59e0b' },
  { name: 'Cancelled', value: 460, color: '#ef4444' },
]

const CATEGORY_COLORS = ['#3BBDF7','#28aae2','#10b981','#f59e0b','#8b5cf6','#6b7280']

/* ── Sub-components ── */
function StatCard({ label, value, sub, color = 'brand', icon }) {
  const colors = {
    brand:   { bg: 'bg-brand/8',   text: 'text-brand',   ring: 'ring-brand/15' },
    success: { bg: 'bg-success/8', text: 'text-success', ring: 'ring-success/15' },
    warning: { bg: 'bg-warning/8', text: 'text-warning', ring: 'ring-warning/15' },
    danger:  { bg: 'bg-danger/8',  text: 'text-danger',  ring: 'ring-danger/15' },
    info:    { bg: 'bg-info/8',    text: 'text-info',    ring: 'ring-info/15' },
    slate:   { bg: 'bg-slate-100', text: 'text-slate-500', ring: 'ring-slate-200' },
  }
  const c = colors[color] ?? colors.brand
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center mb-3 ${c.text}`}>
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <SectionTitle title={title} sub={sub} />
      {children}
    </div>
  )
}

const fmt = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`
const fmtN = n => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toLocaleString()

/* ── Icons ── */
const I = {
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  biz: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  rev: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  tick: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.81 19.79 19.79 0 01.63 2.18 2 2 0 012.62.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
}

export default function DashboardPage() {
  const { auth } = useAdminAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getPlatformAnalytics().then(setStats).catch(() => {})
  }, [])

  const pct = (n, total) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—'

  return (
    <div className="space-y-6 pb-6">

      {/* Welcome banner */}
      <div className="bg-linear-to-r from-sidebar to-[#1e293b] rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs font-semibold mb-1">Good morning,</p>
          <h2 className="text-white text-xl font-black">{auth?.username || 'Admin'}</h2>
          <p className="text-white/40 text-xs mt-1">Here's your platform overview</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors">
            View Reports
          </button>
          <button className="bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/15 transition-colors">
            Export Data
          </button>
        </div>
      </div>

      {/* KPI: Users */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-md bg-brand/10 flex items-center justify-center text-brand">{I.users}</span>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Users</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Customers" value={stats?.totalUsers ?? '—'} sub="All registered" color="brand" icon={I.users} />
          <StatCard label="Active Customers" value={stats?.activeUsers ?? '—'} sub={stats ? `${pct(stats.activeUsers, stats.totalUsers)} active rate` : ''} color="success" icon={I.users} />
          <StatCard label="Suspended" value={stats?.suspendedUsers ?? '—'} sub={stats ? `${pct(stats.suspendedUsers, stats.totalUsers)} suspended` : ''} color="danger" icon={I.users} />
        </div>
      </div>

      {/* KPI: Businesses */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-md bg-info/10 flex items-center justify-center text-info">{I.biz}</span>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Businesses</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Businesses" value={stats?.totalBusinesses ?? '—'} sub="All registered" color="brand" icon={I.biz} />
          <StatCard label="Pending Approval" value={stats?.pendingBusinesses ?? '—'} sub="Awaiting review" color="warning" icon={I.biz} />
          <StatCard label="Approved" value={stats?.verifiedBusinesses ?? '—'} sub={stats ? `${pct(stats.verifiedBusinesses, stats.totalBusinesses)} approved` : ''} color="success" icon={I.biz} />
          <StatCard label="Rejected" value={stats?.rejectedBusinesses ?? '—'} sub={stats ? `${pct(stats.rejectedBusinesses, stats.totalBusinesses)} rejected` : ''} color="danger" icon={I.biz} />
        </div>
      </div>

      {/* KPI: Bookings */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-md bg-success/10 flex items-center justify-center text-success">{I.book}</span>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bookings</p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Total Bookings" value="8,920" sub="All time" color="brand" icon={I.book} />
          <StatCard label="Pending" value="340" sub="Awaiting acceptance" color="warning" icon={I.book} />
          <StatCard label="Accepted" value="1,230" sub="In progress" color="info" icon={I.book} />
          <StatCard label="Completed" value="6,890" sub="77.2% completion" color="success" icon={I.book} />
          <StatCard label="Cancelled" value="460" sub="5.2% cancel rate" color="danger" icon={I.book} />
        </div>
      </div>

      {/* KPI: Revenue */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-md bg-warning/10 flex items-center justify-center text-warning">{I.rev}</span>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Revenue</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Commission Revenue" value="₹4,82,000" sub="+12.4% vs last month" color="success" icon={I.rev} />
          <StatCard label="Recharge Revenue" value="₹1,24,500" sub="Vendor wallet recharges" color="brand" icon={I.rev} />
          <StatCard label="Total Revenue" value="₹6,06,500" sub="Combined platform revenue" color="warning" icon={I.rev} />
        </div>
      </div>

      {/* KPI: Support */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">{I.tick}</span>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Support Overview</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending Approvals" value="23" sub="Vendor onboarding" color="warning" icon={I.tick} />
          <StatCard label="Open Tickets" value="48" sub="Customer support" color="info" icon={I.tick} />
          <StatCard label="Escalated Tickets" value="7" sub="Needs immediate attention" color="danger" icon={I.tick} />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Monthly Revenue Growth" sub="Commission vs Recharge revenue (₹)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmt} width={55} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'commission' ? 'Commission' : 'Recharge']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Line type="monotone" dataKey="commission" stroke="#3BBDF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="recharge" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={v => v === 'commission' ? 'Commission' : 'Recharge'} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Bookings Trend" sub="Total vs Completed vs Cancelled">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_BOOKINGS} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#3BBDF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Booking Status Distribution" sub="All-time breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={BOOKING_STATUS} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {BOOKING_STATUS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmtN(v), '']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {BOOKING_STATUS.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[11px] text-slate-500 truncate">{s.name}</span>
                <span className="text-[11px] font-bold text-slate-700 ml-auto">{fmtN(s.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Business by Category" sub="Top service categories">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {CATEGORY_DATA.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {CATEGORY_DATA.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i] }} />
                <span className="text-[11px] text-slate-500 truncate flex-1">{c.name}</span>
                <span className="text-[11px] font-bold text-slate-700">{c.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top Cities by Revenue" sub="Location-wise platform revenue">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={LOCATION_DATA} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={65} />
              <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#3BBDF7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <ChartCard title="City-wise Business & Booking Comparison" sub="Top 6 cities performance overview">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={LOCATION_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="businesses" name="Businesses" fill="#3BBDF7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bookings" name="Bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}
