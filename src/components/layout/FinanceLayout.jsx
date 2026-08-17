import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useFinanceAuth } from '../../context/FinanceAuthContext'
import { PermissionsProvider, usePermissions } from '../../context/PermissionsContext'

const NAV = [
  { id: 'dashboard',   pageId: 'financeDashboard',   label: 'Dashboard',          path: '/finance/dashboard',   icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'bookings',    pageId: 'financeBookings',    label: 'Booking Financials',  path: '/finance/bookings',    icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { id: 'commission',  pageId: 'financeCommission',  label: 'Commission Engine',   path: '/finance/commission',  icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { id: 'recharge',    pageId: 'financeRecharge',    label: 'Recharge Management', path: '/finance/recharge',    icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg> },
  { id: 'settlements', pageId: 'financeSettlements', label: 'Settlements',         path: '/finance/settlements', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { id: 'refunds',     pageId: 'financeRefunds',     label: 'Refund Management',   path: '/finance/refunds',     icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> },
  { id: 'reports',     pageId: 'financeReports',     label: 'Finance Reports',     path: '/finance/reports',     icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
]

const TITLES = {
  '/finance/dashboard':   'Finance Dashboard',
  '/finance/bookings':    'Booking Financials',
  '/finance/commission':  'Commission Engine',
  '/finance/recharge':    'Recharge Management',
  '/finance/settlements': 'Settlement Management',
  '/finance/refunds':     'Refund Management',
  '/finance/reports':     'Finance Reports',
}

function FinanceLayoutInner() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { auth, logout } = useFinanceAuth()
  const { can } = usePermissions()
  const visibleNav = NAV.filter(n => can(n.pageId, 'READ'))
  const activeId = visibleNav.find(n => pathname.startsWith(n.path))?.id ?? ''
  const title = TITLES[pathname] ?? 'Finance Portal'
  const initials = (auth?.username ?? 'FU').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    logout()
    navigate('/finance/login')
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar flex flex-col z-40">
        <div className="px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-warning rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">Jashanz</p>
              <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wider">Finance Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {visibleNav.map(({ id, label, path, icon: Icon }) => {
            const isActive = activeId === id
            return (
              <button key={id} onClick={() => navigate(path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${isActive ? 'bg-warning text-white' : 'text-white/55 hover:bg-white/8 hover:text-white'}`}>
                <span className="shrink-0"><Icon /></span>{label}
              </button>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/8">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/55 hover:bg-danger/15 hover:text-danger transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-60 min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-16 flex items-center gap-4 shrink-0">
          <h1 className="flex-1 text-base font-bold text-slate-800">{title}</h1>
          <button className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-warning flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{auth?.username ?? 'Finance User'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{auth?.role ?? ''}</p>
            </div>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}

export default function FinanceLayout() {
  const { auth } = useFinanceAuth()
  return (
    <PermissionsProvider authToken={auth?.token}>
      <FinanceLayoutInner />
    </PermissionsProvider>
  )
}
