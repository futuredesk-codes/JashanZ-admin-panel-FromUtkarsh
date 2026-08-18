import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', path: '/admanager/dashboard', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
]

const TITLES = {
  '/admanager/dashboard': 'AdManager Dashboard',
}

export default function AdManagerLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { auth, logout } = useAdManagerAuth()
  const activeId = NAV.find(n => pathname.startsWith(n.path))?.id ?? ''
  const title = TITLES[pathname] ?? 'AdManager Portal'
  const initials = (auth?.username ?? 'AM').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    logout()
    navigate('/admanager/login')
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar flex flex-col z-40">
        <div className="px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">Jashanz</p>
              <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wider">AdManager Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(({ id, label, path, icon: Icon }) => {
            const isActive = activeId === id
            return (
              <button key={id} onClick={() => navigate(path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${isActive ? 'bg-info text-white' : 'text-white/55 hover:bg-white/8 hover:text-white'}`}>
                <span className="shrink-0"><Icon /></span>{label}
              </button>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/8">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/55 hover:bg-danger/15 hover:text-danger transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-60 min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-16 flex items-center gap-4 shrink-0">
          <h1 className="flex-1 text-base font-bold text-slate-800">{title}</h1>
          <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-info flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{auth?.username ?? 'AdManager User'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Business</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
