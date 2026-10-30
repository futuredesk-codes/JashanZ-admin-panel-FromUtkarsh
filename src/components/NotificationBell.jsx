import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../api/notification'
import { useStaffNotificationSocket } from '../hooks/useStaffNotificationSocket'

const PAGE_SIZE = 5

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}


// This single component is rendered inside all three staff portals (Admin,
// Support, Finance — see AdminHeader/SupportLayout/FinanceLayout), each with
// its own separate login/token (ProtectedRoute + SubdomainGuard per portal
// prefix). A notification type can be fanned out to more than one portal's
// staff at once (e.g. VENDOR_REGISTERED -> both 'businesses' (Admin) and
// 'supportApprovals' (Support) page permissions, see notifyStaffForPage in
// notificationHelper.js), but each portal only has routes under its own
// prefix — navigating a Support session to an Admin-only path like
// /admin/businesses doesn't 403, it gets caught by SubdomainGuard/
// ProtectedRoute and silently bounces to THAT portal's own /login, which
// looks exactly like "got logged out" even though the session was fine.
// So the destination must be resolved per-portal, not as one shared path.
// Caller passes `portal` ('admin' | 'support' | 'finance') matching its own
// route prefix; a type with no entry for the current portal renders as
// non-clickable instead of guessing — same discipline as before for types
// that only make sense in one portal (NEW_SUPPORT_TICKET, AD_CREATED,
// RECHARGE_RECEIVED), now just applied consistently to VENDOR_REGISTERED
// too instead of hardcoding Admin's path unconditionally.
const NOTIFICATION_ROUTES_BY_PORTAL = {
  admin: {
    VENDOR_REGISTERED: (n) => `/admin/businesses?businessId=${n.data?.businessId}`,
  },
  support: {
    VENDOR_REGISTERED: (n) => `/support/approvals?businessId=${n.data?.businessId}`,
  },
  finance: {},
}

const targetPathFor = (n, portal) => {
  const resolve = NOTIFICATION_ROUTES_BY_PORTAL[portal]?.[n?.type]
  if (!resolve) return null
  return typeof resolve === 'function' ? resolve(n) : resolve
}

function NotificationRow({ n, portal, onMarkRead, onNavigate }) {
  const targetPath = targetPathFor(n, portal)

  const handleClick = () => {
    if (!n.isRead) onMarkRead(n._id)
    if (targetPath) onNavigate(targetPath)
  }

  return (
    <div
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${!n.isRead ? 'bg-brand/5' : ''} ${targetPath ? 'cursor-pointer hover:bg-slate-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800">{n.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
          <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

export default function NotificationBell({ portal = 'admin' }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const listRef = useRef(null)

  useEffect(() => {
    getUnreadCount().then(data => setUnreadCount(data.count || 0)).catch(() => {})
  }, [])


  useStaffNotificationSocket({
    onNewNotification: (notification) => {
      setUnreadCount(c => c + 1)
      setNotifications(prev => open ? [notification, ...prev.filter(n => n._id !== notification._id)] : prev)
    },
  })

  const fetchPage = (nextPage) => {
    const first = nextPage === 1
    if (first) setLoading(true)
    else setLoadingMore(true)
    return getMyNotifications(nextPage, PAGE_SIZE)
      .then(data => {
        const items = data.items || []
        setNotifications(prev => {
          const base = first ? [] : prev
          const seen = new Set(base.map(n => n._id))
          return [...base, ...items.filter(n => !seen.has(n._id))]
        })
        setPage(data.pagination?.page || nextPage)
        setHasMore(Boolean(data.pagination?.hasNextPage))
      })
      .catch(() => { if (first) setNotifications([]) })
      .finally(() => { first ? setLoading(false) : setLoadingMore(false) })
  }

  const handleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) {
      setPage(1)
      setHasMore(false)
      fetchPage(1)
    }
  }

  // Infinite scroll — load the next 5 as the list nears the bottom.
  const handleScroll = () => {
    const el = listRef.current
    if (!el || loading || loadingMore || !hasMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      fetchPage(page + 1)
    }
  }

  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    markNotificationRead(id).catch(() => {})
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    markAllNotificationsRead().catch(() => {})
  }

  const handleNavigate = (path) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-brand text-white text-[10px] font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-black text-slate-800">Notifications</p>
              {notifications.some(n => !n.isRead) && (
                <button onClick={handleMarkAllRead} className="text-xs text-brand font-semibold hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div ref={listRef} onScroll={handleScroll} className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-sm text-slate-400 text-center py-6">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No notifications yet.</p>
              ) : (
                <>
                  {notifications.map(n => (
                    <NotificationRow key={n._id} n={n} portal={portal} onMarkRead={handleMarkRead} onNavigate={handleNavigate} />
                  ))}
                  {loadingMore && <p className="text-xs text-slate-400 text-center py-3">Loading more…</p>}
                  {!hasMore && notifications.length > PAGE_SIZE && (
                    <p className="text-[11px] text-slate-300 text-center py-3">That's everything.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
