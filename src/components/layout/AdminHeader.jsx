import { useLocation } from 'react-router-dom'

const TITLES = {
  '/admin/dashboard':     'Dashboard',
  '/admin/businesses':    'Business Management',
  '/admin/customers':     'Customer Management',
  '/admin/categories':    'Service Categories',
  '/admin/support-users': 'Support Users',
  '/admin/finance-users': 'Finance Users',
  '/admin/roles':         'Roles & Permissions',
  '/admin/reports':       'Reports',
  '/admin/audit':         'Audit Logs',
  '/admin/settings':      'Settings',
}

export default function AdminHeader({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'Admin Panel'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <h1 className="flex-1 min-w-0 text-sm sm:text-base font-bold text-slate-800 truncate">{title}</h1>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Search — hidden on mobile */}
        <div className="relative hidden md:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 w-44 lg:w-52 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">Super Admin</p>
            <p className="text-[10px] text-slate-400 mt-0.5">admin@jashanz.in</p>
          </div>
          <svg className="text-slate-400 ml-0.5 hidden sm:block" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
