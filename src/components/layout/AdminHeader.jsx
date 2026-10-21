import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useStaffProfile } from '../../context/StaffProfileContext'
import NotificationBell from '../NotificationBell'
import ThemeToggle from '../ThemeToggle'

// Mirrors SubdomainGuard.jsx's own hostname map — on one of the 4 real
// production subdomains, a portal's /login is only reachable from that
// portal's own hostname (SubdomainGuard bounces anything else back to the
// current hostname's own portal). A relative "/finance/login" link clicked
// from admin.jashanz.com therefore opened admin.jashanz.com/finance/login,
// which SubdomainGuard immediately redirected to admin.jashanz.com/admin/login
// instead of the Finance login — this builds the correct cross-subdomain URL
// instead. Off those subdomains (dev/localhost, staging) there's no subdomain
// split, so a relative path is correct there.
const PORTAL_HOSTNAMES = {
  support: 'support.jashanz.com',
  finance: 'finance.jashanz.com',
  admanager: 'admanager.jashanz.com',
}
const ENFORCED_HOSTNAMES = new Set(['admin.jashanz.com', ...Object.values(PORTAL_HOSTNAMES)])

function portalLoginUrl(portal) {
  const { hostname, protocol } = window.location
  if (!ENFORCED_HOSTNAMES.has(hostname)) return `/${portal}/login`
  return `${protocol}//${PORTAL_HOSTNAMES[portal]}/${portal}/login`
}

const TITLES = {
  '/admin/dashboard':     'Dashboard',
  '/admin/businesses':    'Business Management',
  '/admin/customers':     'Customer Management',
  '/admin/categories':    'Service Categories',
  '/admin/support-users': 'Support Users',
  '/admin/finance-users': 'Finance Users',
  '/admin/admanager-users': 'AdManager Users',
  '/admin/reports':       'Reports',
  '/admin/audit':         'Audit Logs',
  '/admin/settings':      'Settings',
  '/admin/profile':       'My Profile',
}

export default function AdminHeader({ onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { auth } = useAdminAuth()
  const { profile } = useStaffProfile()
  const title = TITLES[pathname] ?? 'Admin Panel'
  const username = auth?.username || 'Admin'
  const displayName = profile?.name || username
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="jz-topbar sticky top-0 z-30 px-3 sm:px-8 h-16 flex items-center gap-3 sm:gap-4 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="jz-icon-btn lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0"
        style={{ color: 'var(--ink-dim)' }}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <h1 className="jz-header-title md:hidden flex-1 min-w-0 text-sm font-bold truncate">{title}</h1>

      {/* Search — hidden on mobile */}
      <div className="jz-search hidden md:flex">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Search..." />
      </div>

      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Portal shortcuts — open in a new tab so the admin session here stays alive */}
        <div className="hidden md:flex items-center gap-2">
          <a href={portalLoginUrl('support')} target="_blank" rel="noopener noreferrer" className="jz-badge">
            <span className="dot" style={{ background: '#12D19A', boxShadow: '0 0 6px #12D19A' }} />Support
          </a>
          <a href={portalLoginUrl('finance')} target="_blank" rel="noopener noreferrer" className="jz-badge">
            <span className="dot" style={{ background: '#FFB020', boxShadow: '0 0 6px #FFB020' }} />Finance
          </a>
          <a href={portalLoginUrl('admanager')} target="_blank" rel="noopener noreferrer" className="jz-badge">
            <span className="dot" style={{ background: '#FF6FB0', boxShadow: '0 0 6px #FF6FB0' }} />AdManager
          </a>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* Profile — opens the profile page */}
        <button onClick={() => navigate('/admin/profile')} className="jz-user" title="My profile">
          {profile?.profileImg
            ? <img src={profile.profileImg} alt={displayName} className="w-[30px] h-[30px] rounded-[9px] object-cover shrink-0" />
            : <div className="av">{initials}</div>}
          <div className="hidden sm:block text-left">
            <p className="jz-header-name text-[13px] font-semibold leading-tight">{displayName}</p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--ink-faint)' }}>{auth?.role || ''}</p>
          </div>
        </button>
      </div>
    </header>
  )
}
