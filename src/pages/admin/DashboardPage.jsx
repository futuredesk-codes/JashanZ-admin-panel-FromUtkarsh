import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getPlatformAnalytics } from '../../api/analytics'
import { getTutorialVideo, setTutorialVideo } from '../../api/config'
import { youtubeId, youtubeThumb, youtubeEmbed } from '../../utils/youtube'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useTheme } from '../../context/ThemeContext'

const CATEGORY_COLORS = ['#3BBDF7','#28aae2','#10b981','#f59e0b','#8b5cf6','#6b7280']

const BOOKING_STATUS_META = [
  { key: 'pending',   name: 'Pending',   color: '#f59e0b' },
  { key: 'accepted',  name: 'Accepted',  color: '#3BBDF7' },
  { key: 'completed', name: 'Completed', color: '#10b981' },
  { key: 'cancelled', name: 'Cancelled', color: '#ef4444' },
]

/* ── Sub-components ── */
function StatCard({ label, value, sub, color = 'brand', icon }) {
  const tone = { brand: 'blue', info: 'blue', success: 'green', warning: 'amber', danger: 'red', slate: 'slate' }[color] ?? 'blue'
  return (
    <div className={`jz-stat tone-${tone}`}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="jz-stat-icon">{icon}</div>
      </div>
      <p className="jz-stat-value">{value}</p>
      <p className="text-[12.5px]" style={{ color: 'var(--ink-dim)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-4">
      <h3 className="jz-text-strong text-[17px] font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{title}</h3>
      {sub && <p className="text-[13px] mt-1" style={{ color: "var(--ink-dim)" }}>{sub}</p>}
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="jz-panel">
      <SectionTitle title={title} sub={sub} />
      {children}
    </div>
  )
}

function EmptyChart({ height = 220 }) {
  return (
    <div className="flex items-center justify-center text-xs text-slate-300" style={{ height }}>
      No data yet
    </div>
  )
}

const fmt = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`
const fmtN = n => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toLocaleString()

/* ── Icons ── */
const I = {
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  biz: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  creator: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  rev: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  tick: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.81 19.79 19.79 0 01.63 2.18 2 2 0 012.62.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
}

/* ── Home-page tutorial video (YouTube URL shown on the website landing page) ── */
function TutorialVideoCard() {
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { ok: boolean, text: string }
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    getTutorialVideo()
      .then(d => { setUrl(d.url || ''); setSaved(d.url || '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const trimmed = url.trim()
  const id = youtubeId(trimmed)
  const dirty = trimmed !== saved
  const invalid = trimmed !== '' && !id

  const save = async () => {
    if (invalid) { setMsg({ ok: false, text: 'Enter a valid YouTube video URL.' }); return }
    setBusy(true)
    setMsg(null)
    try {
      const d = await setTutorialVideo(trimmed)
      setSaved(d.url || '')
      setUrl(d.url || '')
      setPlaying(false)
      setMsg({ ok: true, text: d.url ? 'Saved — the website home page will show this video.' : 'Cleared — the video is now hidden on the website.' })
    } catch (e) {
      setMsg({ ok: false, text: e?.message || 'Could not save. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="jz-panel">
      <SectionTitle title="Home Page Tutorial Video" sub="Paste a YouTube link — it shows as a clickable preview on the Jashanz website home page. Leave empty to hide it." />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setMsg(null) }}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={loading || busy}
            className={`w-full text-sm rounded-xl border px-3 py-2.5 outline-none transition-colors ${
              invalid ? 'border-danger/50 focus:border-danger' : 'border-slate-200 focus:border-brand'
            } disabled:bg-slate-50`}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={loading || busy || !dirty || invalid}
              className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-40"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            {saved && (
              <button
                onClick={() => { setUrl(''); setMsg(null) }}
                disabled={loading || busy}
                className="text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Clear
              </button>
            )}
            {dirty && !invalid && <span className="text-[11px] text-slate-400">Unsaved changes</span>}
          </div>

          {invalid && <p className="text-[11px] text-danger font-semibold">That doesn’t look like a YouTube video link.</p>}
          {msg && <p className={`text-[11px] font-semibold ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
        </div>

        {/* Preview — same behaviour the website will use: thumbnail, click to play */}
        <div className="w-full lg:w-80 shrink-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Preview</p>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            {id ? (
              playing ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={youtubeEmbed(id, { autoplay: true })}
                  title="Tutorial video preview"
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button onClick={() => setPlaying(true)} className="group absolute inset-0 w-full h-full">
                  <img src={youtubeThumb(id)} alt="Video thumbnail" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300">
                {loading ? 'Loading…' : 'No video set'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { auth } = useAdminAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getPlatformAnalytics().then(setStats).catch(() => {})
  }, [])

  // Recharts takes raw colors, not CSS classes — these can't piggyback on the
  // .jz-admin/.jz-dark remap system the rest of the page uses, so they're
  // branched directly off the theme here instead.
  const chartGrid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
  const chartTick = isDark ? '#A6ADC3' : '#64748b'
  const chartTooltipStyle = {
    borderRadius: 10,
    border: isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid #e2e8f0',
    background: isDark ? '#121A30' : '#ffffff',
    color: isDark ? '#F2F4FA' : '#0f172a',
    fontSize: 12,
  }

  const pct = (n, total) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—'

  const b = stats?.bookingStatusCounts
  const bookingBuckets = b ? {
    pending: (b.PENDING || 0) + (b.PAYMENT_PENDING || 0),
    accepted: b.CONFIRMED || 0,
    completed: b.COMPLETED || 0,
    cancelled: b.CANCELLED || 0,
  } : null

  const bookingStatusChartData = bookingBuckets
    ? BOOKING_STATUS_META.map(m => ({ name: m.name, value: bookingBuckets[m.key], color: m.color }))
    : []

  const categoryData = stats?.categoryDistribution || []
  const cityData = stats?.cityRevenue || []

  return (
    <div className="space-y-6 pb-6">

      {/* Welcome banner */}
      <div className="jz-panel flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="jz-text-muted text-xs font-semibold mb-1">Good morning,</p>
          <h2 className="jz-text-strong text-xl font-black">{auth?.username || 'Admin'}</h2>
          <p className="text-sm" style={{ color: "var(--ink-dim)" }}>Here's your platform overview</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/reports" className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors">
            View Reports
          </a>
          <a href="/admin/audit" className="jz-btn-ghost text-xs font-bold px-4 py-2 rounded-xl transition-colors">
            Audit Logs
          </a>
        </div>
      </div>

      {/* Home-page tutorial video control */}
      <TutorialVideoCard />

      {/* KPI: Users */}
      <div className="jz-panel">
        <div className="flex items-center gap-3.5 mb-5">
          <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg,#FF6FB0,#B15CFF)', boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}>{I.users}</span>
          <p className="jz-text-strong text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Users</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Customers" value={stats?.totalUsers ?? '—'} sub="All registered" color="brand" icon={I.users} />
          <StatCard label="Active Customers" value={stats?.activeUsers ?? '—'} sub={stats ? `${pct(stats.activeUsers, stats.totalUsers)} active rate` : ''} color="success" icon={I.users} />
          <StatCard label="Suspended" value={stats?.suspendedUsers ?? '—'} sub={stats ? `${pct(stats.suspendedUsers, stats.totalUsers)} suspended` : ''} color="danger" icon={I.users} />
        </div>
      </div>

      {/* KPI: Businesses */}
      <div className="jz-panel">
        <div className="flex items-center gap-3.5 mb-5">
          <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg,#3E7BFA,#7C5CFF)', boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}>{I.biz}</span>
          <p className="jz-text-strong text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Businesses</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Businesses" value={stats?.totalBusinesses ?? '—'} sub="All registered" color="brand" icon={I.biz} />
          <StatCard label="Pending Approval" value={stats?.pendingBusinesses ?? '—'} sub="Awaiting review" color="warning" icon={I.biz} />
          <StatCard label="Approved" value={stats?.verifiedBusinesses ?? '—'} sub={stats ? `${pct(stats.verifiedBusinesses, stats.totalBusinesses)} approved` : ''} color="success" icon={I.biz} />
          <StatCard label="Rejected" value={stats?.rejectedBusinesses ?? '—'} sub={stats ? `${pct(stats.rejectedBusinesses, stats.totalBusinesses)} rejected` : ''} color="danger" icon={I.biz} />
        </div>
      </div>

      {/* KPI: Creators */}
      <div className="jz-panel">
        <div className="flex items-center gap-3.5 mb-5">
          <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg,#34D5FF,#3E7BFA)', boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}>{I.creator}</span>
          <p className="jz-text-strong text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Creators</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Creators" value={stats?.totalCreators ?? '—'} sub="All registered" color="brand" icon={I.creator} />
          <StatCard label="Pending Approval" value={stats?.pendingCreators ?? '—'} sub="Awaiting review" color="warning" icon={I.creator} />
          <StatCard label="Approved" value={stats?.verifiedCreators ?? '—'} sub={stats ? `${pct(stats.verifiedCreators, stats.totalCreators)} approved` : ''} color="success" icon={I.creator} />
          <StatCard label="Rejected" value={stats?.rejectedCreators ?? '—'} sub={stats ? `${pct(stats.rejectedCreators, stats.totalCreators)} rejected` : ''} color="danger" icon={I.creator} />
        </div>
      </div>

      {/* KPI: Bookings */}
      <div className="jz-panel">
        <div className="flex items-center gap-3.5 mb-5">
          <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg,#12D19A,#22B8CF)', boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}>{I.book}</span>
          <p className="jz-text-strong text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Bookings</p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Total Bookings" value={stats?.totalBookings ?? '—'} sub="All time" color="brand" icon={I.book} />
          <StatCard label="Pending" value={bookingBuckets?.pending ?? '—'} sub="Awaiting acceptance" color="warning" icon={I.book} />
          <StatCard label="Accepted" value={bookingBuckets?.accepted ?? '—'} sub="In progress" color="info" icon={I.book} />
          <StatCard label="Completed" value={bookingBuckets?.completed ?? '—'} sub={stats ? `${pct(bookingBuckets.completed, stats.totalBookings)} completion` : ''} color="success" icon={I.book} />
          <StatCard label="Cancelled" value={bookingBuckets?.cancelled ?? '—'} sub={stats ? `${pct(bookingBuckets.cancelled, stats.totalBookings)} cancel rate` : ''} color="danger" icon={I.book} />
        </div>
      </div>

      {/* KPI: Revenue */}
      <div className="jz-panel">
        <div className="flex items-center gap-3.5 mb-5">
          <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg,#FFB020,#FF7A45)', boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}>{I.rev}</span>
          <p className="jz-text-strong text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Revenue</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Commission Revenue"
            value={stats ? fmt(stats.commissionRevenue) : '—'}
            sub={stats?.commissionRevenueGrowthPct !== null && stats?.commissionRevenueGrowthPct !== undefined
              ? `${stats.commissionRevenueGrowthPct >= 0 ? '+' : ''}${stats.commissionRevenueGrowthPct}% vs last month`
              : 'vs last month'}
            color="success" icon={I.rev}
          />
          <StatCard label="Recharge Revenue" value={stats ? fmt(stats.rechargeRevenue) : '—'} sub="Vendor wallet recharges" color="brand" icon={I.rev} />
          <StatCard label="Total Revenue" value={stats ? fmt(stats.platformRevenue) : '—'} sub="Combined platform revenue" color="warning" icon={I.rev} />
        </div>
      </div>

      {/* KPI: Support */}
      <div className="jz-panel">
        <div className="flex items-center gap-3.5 mb-5">
          <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg,#34D5FF,#7C5CFF)', boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}>{I.tick}</span>
          <p className="jz-text-strong text-lg font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Support Overview</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending Approvals" value={stats?.pendingBusinesses ?? '—'} sub="Vendor onboarding" color="warning" icon={I.tick} />
          <StatCard label="Open Tickets" value={stats?.openTickets ?? '—'} sub="Customer support" color="info" icon={I.tick} />
          <StatCard label="Escalated Tickets" value={stats?.escalatedTickets ?? '—'} sub="Needs immediate attention" color="danger" icon={I.tick} />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Monthly Revenue Growth" sub="Commission vs Recharge revenue (₹, last 6 months)">
          {!stats?.monthlyRevenue?.length ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} tickFormatter={fmt} width={55} />
                <Tooltip formatter={(v, n) => [fmt(v), n === 'commission' ? 'Commission' : 'Recharge']} contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="commission" stroke="#3BBDF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="recharge" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={v => v === 'commission' ? 'Commission' : 'Recharge'} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Monthly Bookings Trend" sub="Total vs Completed vs Cancelled (last 6 months)">
          {!stats?.monthlyBookings?.length ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.monthlyBookings} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="total" stroke="#3BBDF7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Booking Status Distribution" sub="All-time breakdown">
          {!bookingStatusChartData.length || bookingStatusChartData.every(s => s.value === 0) ? <EmptyChart height={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bookingStatusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {bookingStatusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [fmtN(v), '']} contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {bookingStatusChartData.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[11px] text-slate-500 truncate">{s.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 ml-auto">{fmtN(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Business by Category" sub="Top service categories">
          {!categoryData.length ? <EmptyChart height={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="text-[11px] text-slate-500 truncate flex-1">{c.name}</span>
                    <span className="text-[11px] font-bold text-slate-700">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Top Cities by Revenue" sub="Area-wise platform revenue">
          {!cityData.length ? <EmptyChart height={280} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: chartTick }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} width={65} />
                <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={chartTooltipStyle} />
                <Bar dataKey="revenue" fill="#3BBDF7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <ChartCard title="Area-wise Business & Booking Comparison" sub="Top areas by revenue">
        {!cityData.length ? <EmptyChart height={240} /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cityData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="city" tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartTick }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="businesses" name="Businesses" fill="#3BBDF7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" name="Bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  )
}
