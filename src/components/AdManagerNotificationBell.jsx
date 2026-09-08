import { useState } from 'react'

const MOCK = [
  { id: 1, tone: 'success', title: 'Coin purchase successful', body: '500 coins added to your wallet.', time: '2m', unread: true },
  { id: 2, tone: 'warning', title: 'Ad paused — low coins', body: '"Diwali Decor Boost" was paused (balance below 100).', time: '1h', unread: true },
  { id: 3, tone: 'success', title: 'Ad approved & live', body: '"Wedding Makeup Reel" is now running in the BOOM feed.', time: '3h', unread: true },
  { id: 4, tone: 'danger', title: 'Ad expired', body: '"Summer Catering Offer" ended due to an engagement drop.', time: '1d', unread: false },
  { id: 5, tone: 'info', title: 'Referral coins credited', body: 'You earned 20 referral coins from an invite.', time: '2d', unread: false },
]

const DOT = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info' }

export default function AdManagerNotificationBell() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(MOCK)
  const unread = list.filter(n => n.unread).length

  const markAllRead = () => setList(l => l.map(n => ({ ...n, unread: false })))
  const markRead = (id) => setList(l => l.map(n => (n.id === id ? { ...n, unread: false } : n)))

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-brand text-white text-[10px] font-bold rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-black text-slate-800">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand font-semibold hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {list.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${n.unread ? 'bg-brand/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.unread ? DOT[n.tone] : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
