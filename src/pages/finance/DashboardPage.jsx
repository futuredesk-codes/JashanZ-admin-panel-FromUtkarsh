import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getFinanceDashboardOverview } from '../../api/finance'
import { ApiError } from '../../api/client'
import { useFinanceAuth } from '../../context/FinanceAuthContext'
import SearchableSelect from '../../components/SearchableSelect'

const GRANULARITIES = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
]

const CATEGORY_COLORS = ['#3BBDF7', '#28aae2', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1', '#6b7280']
const AD_STATUS_COLORS = { Active: '#10b981', Paused: '#3BBDF7', Pending: '#f59e0b', Rejected: '#ef4444', Exhausted: '#6b7280' }

const fmtMoney = n => n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n ?? 0}`
const fmtNum = n => (n ?? 0) >= 1000 ? `${(n / 1000).toFixed(1)}K` : (n ?? 0).toLocaleString('en-IN')

/* ── Small UI bits (mirrors the Admin dashboard's styling) ── */
function StatCard({ label, value, sub, color = 'brand', icon }) {
  const colors = {
    brand: { bg: 'bg-brand/8', text: 'text-brand', ring: 'ring-brand/15' },
    success: { bg: 'bg-success/8', text: 'text-success', ring: 'ring-success/15' },
    warning: { bg: 'bg-warning/8', text: 'text-warning', ring: 'ring-warning/15' },
    danger: { bg: 'bg-danger/8', text: 'text-danger', ring: 'ring-danger/15' },
    info: { bg: 'bg-info/8', text: 'text-info', ring: 'ring-info/15' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-500', ring: 'ring-slate-200' },
  }
  const c = colors[color] ?? colors.brand
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center mb-3 ${c.text}`}>{icon}</div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ height = 220 }) {
  return <div className="flex items-center justify-center text-xs text-slate-300" style={{ height }}>No data for this selection</div>
}

function GroupHeader({ icon, label, tint }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${tint}`}>{icon}</span>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</p>
    </div>
  )
}

/* ── Icons ── */
const I = {
  vendor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  card: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  coin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" /></svg>,
  ad: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 11-5.8-1.6" /></svg>,
  tag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  rev: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  payout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
}

const tooltipStyle = { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }
const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

export default function DashboardPage() {
  const { auth } = useFinanceAuth()
  const [filters, setFilters] = useState({ from: '', to: '', city: '', category: '', granularity: 'month' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const params = useMemo(() => {
    const p = { granularity: filters.granularity }
    if (filters.from) p.from = filters.from
    if (filters.to) p.to = filters.to
    if (filters.city) p.city = filters.city
    if (filters.category) p.category = filters.category
    return p
  }, [filters])

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getFinanceDashboardOverview(params)
      .then(setData)
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load the dashboard.'))
      .finally(() => setLoading(false))
  }, [params])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const k = data?.kpis
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to)
  const cities = data?.filterOptions?.cities ?? []
  const categories = data?.filterOptions?.categories ?? []
  const rangeNote = filters.from || filters.to
    ? `${filters.from || 'start'} → ${filters.to || 'today'}`
    : 'All time'

  const revenueTrend = data?.charts?.revenueTrend ?? []
  const bookingsTrend = data?.charts?.bookingsTrend ?? []
  const adsByStatus = (data?.charts?.adsByStatus ?? []).filter(a => a.value > 0)
  const revenueByCity = data?.charts?.revenueByCity ?? []
  const revenueByCategory = data?.charts?.revenueByCategory ?? []

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome banner */}
      <div className="bg-linear-to-r from-sidebar to-[#1e293b] rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white/50 text-xs font-semibold mb-1">Finance overview</p>
          <h2 className="text-white text-xl font-black">{auth?.username || 'Finance'}</h2>
          <p className="text-white/40 text-xs mt-1">Live platform financials · {rangeNote}</p>
        </div>
        <a href="/finance/reports" className="bg-warning text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">View Reports</a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
          {GRANULARITIES.map(g => (
            <button
              key={g.value}
              onClick={() => setF('granularity', g.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filters.granularity === g.value ? 'bg-warning text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">From</span>
          <input type="date" max={filters.to || undefined} className={selectCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
          <span className="text-xs text-slate-400">To</span>
          <input type="date" min={filters.from || undefined} className={selectCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
        <SearchableSelect
          value={filters.city}
          onChange={v => setF('city', v)}
          options={cities.map(c => ({ value: c, label: c }))}
          placeholder="All cities"
        />
        <SearchableSelect
          value={filters.category}
          onChange={v => setF('category', v)}
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="All categories"
        />
        {(filters.from || filters.to || filters.city || filters.category) && (
          <button onClick={() => setFilters(f => ({ ...f, from: '', to: '', city: '', category: '' }))} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
        {loading && <span className="text-xs text-slate-400 ml-auto">Refreshing…</span>}
      </div>

      {invalidRange && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">"From" date is after "To" date.</div>}
      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      {/* KPI: Vendors */}
      <div>
        <GroupHeader icon={I.vendor} tint="bg-brand/10 text-brand" label="Vendors" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="Total Registered Vendors" value={k ? fmtNum(k.totalVendors) : '—'} sub="Businesses on the platform" color="brand" icon={I.vendor} />
          <StatCard label="Paid Registration Fees" value={k ? fmtNum(k.paidVendors) : '—'} sub={k && k.totalVendors ? `${((k.paidVendors / k.totalVendors) * 100).toFixed(0)}% of vendors` : ''} color="success" icon={I.card} />
          <StatCard label="Premium Upgraded Vendors" value={k ? fmtNum(k.premiumVendors) : '—'} sub="Paid AdManager access" color="warning" icon={I.star} />
        </div>
      </div>

      {/* KPI: Ads & Banners */}
      <div>
        <GroupHeader icon={I.ad} tint="bg-info/10 text-info" label="Ads & Banners" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Ad Credits Purchased" value={k ? fmtNum(k.adCreditsPurchased) : '—'} sub={k ? `${fmtMoney(k.adCreditsRevenue)} paid` : ''} color="brand" icon={I.coin} />
          <StatCard label="Ads Created" value={k ? fmtNum(k.adsCreated) : '—'} sub="All statuses" color="info" icon={I.ad} />
          <StatCard label="Ads Active" value={k ? fmtNum(k.adsActive) : '—'} sub="Currently running" color="success" icon={I.ad} />
          <StatCard label="Ads Paused" value={k ? fmtNum(k.adsPaused) : '—'} sub="Temporarily halted" color="warning" icon={I.ad} />
          <StatCard label="Banner Fees Received" value={k ? fmtMoney(k.bannerFeesReceived) : '—'} sub="No banner billing yet" color="slate" icon={I.tag} />
        </div>
      </div>

      {/* KPI: Bookings & Revenue */}
      <div>
        <GroupHeader icon={I.rev} tint="bg-warning/10 text-warning" label="Bookings & Revenue" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <StatCard label="Total Bookings" value={k ? fmtNum(k.totalBookings) : '—'} sub="Across all vendors" color="brand" icon={I.book} />
          <StatCard label="Total Commission Revenue" value={k ? fmtMoney(k.totalCommissionRevenue) : '—'} sub="Platform earnings" color="success" icon={I.rev} />
          <StatCard label="Settlements Disbursed" value={k ? fmtMoney(k.settlementsDisbursed) : '—'} sub="Transferred to vendors" color="info" icon={I.payout} />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Trend" sub={`Commission · Recharge · Settlements (₹, ${filters.granularity}ly)`}>
          {!revenueTrend.length ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtMoney} width={55} />
                <Tooltip formatter={v => fmtMoney(v)} contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="commission" name="Commission" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="recharge" name="Recharge" stroke="#3BBDF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="settlements" name="Settlements" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Bookings Trend" sub={`Total · Completed · Cancelled (${filters.granularity}ly)`}>
          {!bookingsTrend.length ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={bookingsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="total" name="Total" stroke="#3BBDF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Ads by Status" sub="Current ad pipeline">
          {!adsByStatus.length ? <EmptyChart height={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={adsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {adsByStatus.map(entry => <Cell key={entry.name} fill={AD_STATUS_COLORS[entry.name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtNum(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {adsByStatus.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: AD_STATUS_COLORS[s.name] || '#6b7280' }} />
                    <span className="text-[11px] text-slate-500 truncate">{s.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 ml-auto">{fmtNum(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Commission by Category" sub="Top service categories (₹)">
          {!revenueByCategory.length ? <EmptyChart height={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={revenueByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {revenueByCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtMoney(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {revenueByCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="text-[11px] text-slate-500 truncate flex-1">{c.name}</span>
                    <span className="text-[11px] font-bold text-slate-700">{fmtMoney(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Commission by City" sub="Top areas by platform revenue">
          {!revenueByCity.length ? <EmptyChart height={280} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByCity} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtMoney} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={v => [fmtMoney(v), 'Commission']} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
