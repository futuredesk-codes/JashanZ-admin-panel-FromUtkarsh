import { useState, useEffect, useCallback } from 'react'
import { sendBroadcast, getBroadcastHistory } from '../../api/support'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'

const TABS = [
  { id: 'USER', label: 'User' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'CREATOR', label: 'Creator' },
]

const TITLE_MAX = 100
const BODY_MAX = 500

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function BroadcastPage() {
  const { can } = usePermissions()
  const canSend = can('supportBroadcast', 'FULL')

  const [tab, setTab] = useState('USER')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    setHistoryError('')
    getBroadcastHistory({ audience: tab, limit: 20 })
      .then(data => setHistory(data.items || []))
      .catch(err => setHistoryError(err instanceof ApiError ? err.message : 'Could not load broadcast history.'))
      .finally(() => setHistoryLoading(false))
  }, [tab])

  useEffect(() => { (async () => { loadHistory() })() }, [loadHistory])

  const switchTab = (id) => {
    setTab(id)
    setSuccessMsg('')
    setError('')
  }

  const handleSendClick = (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Enter both a title and a message.')
      return
    }
    setError('')
    setConfirming(true)
  }

  const confirmSend = async () => {
    setSending(true)
    setError('')
    try {
      const data = await sendBroadcast(tab, title.trim(), body.trim())
      setSuccessMsg(`Sent to ${data.sent} device${data.sent === 1 ? '' : 's'}${data.errors ? ` (${data.errors} failed)` : ''}.`)
      setTitle('')
      setBody('')
      setConfirming(false)
      loadHistory()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send broadcast.')
      setConfirming(false)
    } finally {
      setSending(false)
    }
  }

  const activeLabel = TABS.find(t => t.id === tab)?.label

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Push Notifications</h1>
        <p className="text-sm text-slate-500 mt-0.5">Send a push notification to every User, Business, or Creator with the app installed.</p>
      </div>

      {/* Audience tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Compose form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-black text-slate-800 text-sm">Send to all {activeLabel}s</h3>

        {!canSend ? (
          <p className="text-xs text-slate-400">Sending broadcasts needs full access on this page — ask a Support Lead.</p>
        ) : (
          <form onSubmit={handleSendClick} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Title</label>
              <input
                required
                maxLength={TITLE_MAX}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. App maintenance tonight"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1 text-right">{title.length}/{TITLE_MAX}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Message</label>
              <textarea
                required
                rows={4}
                maxLength={BODY_MAX}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 resize-none"
                placeholder="What do you want to tell them?"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1 text-right">{body.length}/{BODY_MAX}</p>
            </div>

            {error && <p className="text-sm text-danger font-semibold">{error}</p>}
            {successMsg && <p className="text-sm text-success font-semibold">{successMsg}</p>}

            <button
              type="submit"
              disabled={sending}
              className="bg-brand text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-50"
            >
              Send to all {activeLabel}s
            </button>
          </form>
        )}
      </div>

      {/* Confirm-before-send dialog — a broadcast reaches every device in the
          audience at once and can't be recalled, so this step exists to
          catch a mistaken send before it goes out. */}
      {confirming && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && !sending && setConfirming(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800">Send this to every {activeLabel}?</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-400">This will push to every {activeLabel.toLowerCase()} account with the app installed, right now. This can't be undone.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{body}</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={sending}
                  className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSend}
                  disabled={sending}
                  className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recent {activeLabel} Broadcasts</p>
        </div>
        {historyError && <p className="text-sm text-danger font-semibold px-5 py-3">{historyError}</p>}
        {historyLoading ? (
          <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No broadcasts sent to {activeLabel.toLowerCase()}s yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map(h => (
              <div key={h._id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{h.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{h.body}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
                    {h.recipientCount}/{h.totalInAudience}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {h.sentByUsername} · {formatDateTime(h.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
