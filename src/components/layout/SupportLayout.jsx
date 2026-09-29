import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSupportAuth } from '../../context/SupportAuthContext'
import { PermissionsProvider, usePermissions } from '../../context/PermissionsContext'
import { StaffProfileProvider, useStaffProfile } from '../../context/StaffProfileContext'
import NotificationBell from '../NotificationBell'
import './support-theme.css'

const NAV = [
  { id: 'dashboard', pageId: 'supportDashboard', label: 'Dashboard', path: '/support/dashboard', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'approvals', pageId: 'supportApprovals', label: 'Vendor Approvals', path: '/support/approvals', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { id: 'ads', pageId: 'supportAds', label: 'Ad Review', path: '/support/ads', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg> },
  { id: 'tickets', pageId: 'tickets', label: 'Ticket Management', path: '/support/tickets', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z"/></svg> },
  { id: 'admanager', pageId: 'tickets', label: 'AdManager Requests', path: '/support/admanager-requests', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg> },
]

const TITLES = {
  '/support/dashboard': 'Support Dashboard',
  '/support/approvals': 'Vendor Approvals',
  '/support/ads':       'Ad Review & Moderation',
  '/support/tickets':   'Ticket Management',
  '/support/admanager-requests': 'AdManager Requests',
  '/support/profile':   'My Profile',
}

function SupportLayoutInner() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { auth, logout } = useSupportAuth()
  const { can } = usePermissions()
  const { profile } = useStaffProfile()
  const visibleNav = NAV.filter(n => can(n.pageId, 'READ'))
  const activeId = visibleNav.find(n => pathname.startsWith(n.path))?.id ?? ''
  const title = TITLES[pathname] ?? 'Support Portal'
  const displayName = profile?.name || auth?.username || 'Support User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    logout()
    navigate('/support/login')
  }

  return (
    <div className="jz-support flex h-screen overflow-hidden">
      <aside className="fixed left-0 top-0 h-screen w-[264px] jz-sup-sidebar flex flex-col z-40">
        <div className="px-[22px] pt-[26px] pb-[22px] border-b" style={{ borderColor: "var(--border-soft)" }}>
          <div className="flex items-center gap-3">
            <div className="jz-sup-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04140e" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.81 19.79 19.79 0 01.63 2.18 2 2 0 012.62.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </div>
            <div>
              <p className="text-white font-bold text-[17px] leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>Jashanz</p>
              <p className="text-[10.5px] mt-1 uppercase font-semibold tracking-[1.6px]" style={{ color: "var(--text-dim)" }}>Support Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3.5 py-[18px] overflow-y-auto">
          {visibleNav.map(({ id, label, path, icon: Icon }) => {
            const isActive = activeId === id
            return (
              <button key={id} onClick={() => navigate(path)} className={`jz-sup-nav ${isActive ? 'active' : ''}`}>
                <span className="shrink-0"><Icon /></span>{label}
              </button>
            )
          })}
        </nav>
        <div className="px-3.5 pt-4 pb-5 border-t" style={{ borderColor: "var(--border-soft)" }}>
          <button onClick={handleLogout} className="jz-sup-nav logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-[264px] min-w-0 overflow-hidden">
        <header className="jz-sup-topbar sticky top-0 z-30 px-8 h-[73px] flex items-center gap-4 shrink-0">
          <h1 className="flex-1 text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h1>
          <NotificationBell />
          <button onClick={() => navigate('/support/profile')} className="jz-sup-who hover:bg-white/5 transition-colors" title="My profile">
            {profile?.profileImg
              ? <img src={profile.profileImg} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
              : <div className="jz-sup-avatar">{initials}</div>}
            <div className="text-left">
              <p className="text-[13px] font-semibold text-white leading-tight">{displayName}</p>
              <p className="text-[10px] font-semibold tracking-[.6px]" style={{ color: "var(--text-dim)" }}>{auth?.role ?? ''}</p>
            </div>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-8 pt-7 pb-14"><Outlet /></main>
      </div>
    </div>
  )
}

export default function SupportLayout() {
  const { auth } = useSupportAuth()
  return (
    <PermissionsProvider authToken={auth?.token}>
      <StaffProfileProvider authToken={auth?.token}>
        <SupportLayoutInner />
      </StaffProfileProvider>
    </PermissionsProvider>
  )
}
