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


// This bell lives in the Admin portal, which has its own separate login/token
// from Support and Finance (see ProtectedRoute/SupportAuthContext). Some
// notification types (NEW_SUPPORT_TICKET, AD_CREATED, RECHARGE_RECEIVED) are
// sent via notifyStaffForPage to whichever staff — including SUPER_ADMIN —
// has page access, but they only ever link to Support/Finance-portal pages,
// which a Support/Finance-less Admin session can't open (its ProtectedRoute
// bounces to that portal's own /login). Deliberately left unmapped here so
// those rows render as non-clickable instead of redirecting to a login
// screen; they still show up correctly in the Support/Finance portals' own
// bells, which ARE logged into those portals.
// VENDOR_REGISTERED is the one deliberately dual-sent to both Admin's own
// 'businesses' page and Support's 'supportApprovals' — only the Admin-portal
// destination belongs here.
const NOTIFICATION_ROUTES = {
  VENDOR_REGISTERED: '/admin/businesses',
}

// n.data?.link is a few deliberately cross-portal, so ignore anything the
// backend attached only for the Support/Finance bells — Admin only
// navigates on its own known-safe routes above.
const targetPathFor = (n) => NOTIFICATION_ROUTES[n?.type] || null

function NotificationRow({ n, onMarkRead, onNavigate }) {
  const targetPath = targetPathFor(n)

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

export default function NotificationBell() {
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
                    <NotificationRow key={n._id} n={n} onMarkRead={handleMarkRead} onNavigate={handleNavigate} />
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
