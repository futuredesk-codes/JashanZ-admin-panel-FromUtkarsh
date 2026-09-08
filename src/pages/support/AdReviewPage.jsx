import { useState, useEffect, useCallback } from 'react'
import { getAdsAsSupport, approveAdAsSupport, rejectAdAsSupport, pauseAdAsSupport, resumeAdAsSupport } from '../../api/ads'
import { ApiError } from '../../api/client'
import { useAdStatusSocket } from '../../hooks/useAdStatusSocket'

const STATUSES_LIST = ['PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'EXHAUSTED', 'REJECTED']
const STATUS_LABEL = {
  PENDING_REVIEW: 'Pending Review',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  EXHAUSTED: 'Exhausted',
  REJECTED: 'Rejected',
}
const STATUS_STYLES = {
  PENDING_REVIEW: 'bg-warning/10 text-warning',
  ACTIVE: 'bg-success/10 text-success',
  PAUSED: 'bg-info/10 text-info',
  EXHAUSTED: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-danger/10 text-danger',
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>

/* ── Reason modal — used for both Reject (required) and Pause (required),
   since both need the moderator to explain why (spec's "Add Comment"). ── */
function ReasonModal({ title, confirmLabel, confirmCls, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please add a comment explaining why.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(reason.trim())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <textarea
          autoFocus
          rows={4}
          placeholder="Add a comment..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 resize-none"
        />
        {error && <p className="text-xs text-danger font-semibold">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60 ${confirmCls}`}
          >
            {submitting ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Ad Detail Modal ── */
function AdDetailModal({ ad, onClose, onApprove, onReject, onPause, onResume }) {
  const [actionLoading, setActionLoading] = useState(false)
  const [reasonModal, setReasonModal] = useState(null) // 'reject' | 'pause' | null

  const handleApprove = async () => {
    setActionLoading(true)
    try { await onApprove(ad._id) } finally { setActionLoading(false) }
  }

  const handleResume = async () => {
    setActionLoading(true)
    try { await onResume(ad._id) } finally { setActionLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base">{ad.title}</h3>
            <p className="text-xs text-slate-400">{ad.business?.username || 'Unknown vendor'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ad.status]}`}>{STATUS_LABEL[ad.status]}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconClose /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {ad.mediaType === 'IMAGE' && ad.imageUrl && (
            <img src={ad.imageUrl} alt={ad.title} className="w-full rounded-xl object-cover max-h-64" />
          )}
          {ad.mediaType === 'BOOM' && ad.boomId?.videoUrl && (
            <video src={ad.boomId.videoUrl} controls className="w-full rounded-xl max-h-64 bg-black" />
          )}

          {ad.description && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700">{ad.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Vendor', ad.business?.username || '—'],
              ['Target Category', ad.targetCategories?.map(c => c.name).join(', ') || 'All categories'],
              ['Coins Spent', ad.coinsSpent],
              ['Coins Remaining', ad.coinsRemaining],
              ['Impressions', ad.impressions ?? 0],
              ['Clicks', ad.clicks ?? 0],
              ['Created', fmtDate(ad.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
                <p className="text-sm font-bold text-slate-800">{v}</p>
              </div>
            ))}
          </div>

          {ad.rejectionReason && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-3">
              <p className="text-[11px] text-danger font-semibold uppercase tracking-wide mb-1">Moderator Comment</p>
              <p className="text-sm text-slate-700">{ad.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-200">Close</button>
          <div className="flex gap-2">
            {ad.status === 'PENDING_REVIEW' && (
              <>
                <button onClick={() => setReasonModal('reject')} disabled={actionLoading} className="bg-danger/10 text-danger rounded-xl px-4 py-2 text-sm font-bold hover:bg-danger/20 disabled:opacity-40">Reject</button>
                <button onClick={handleApprove} disabled={actionLoading} className="bg-success/10 text-success rounded-xl px-4 py-2 text-sm font-bold hover:bg-success/20 disabled:opacity-40">Approve</button>
              </>
            )}
            {ad.status === 'ACTIVE' && (
              <button onClick={() => setReasonModal('pause')} disabled={actionLoading} className="bg-info/10 text-info rounded-xl px-4 py-2 text-sm font-bold hover:bg-info/20 disabled:opacity-40">Pause</button>
            )}
            {ad.status === 'PAUSED' && (
              <button onClick={handleResume} disabled={actionLoading} className="bg-success/10 text-success rounded-xl px-4 py-2 text-sm font-bold hover:bg-success/20 disabled:opacity-40">Resume</button>
            )}
          </div>
        </div>
      </div>

      {reasonModal === 'reject' && (
        <ReasonModal
          title="Reject Ad"
          confirmLabel="Reject"
          confirmCls="bg-danger text-white hover:bg-danger/90"
          onClose={() => setReasonModal(null)}
          onConfirm={async (reason) => { await onReject(ad._id, reason); setReasonModal(null) }}
        />
      )}
      {reasonModal === 'pause' && (
        <ReasonModal
          title="Pause Ad"
          confirmLabel="Pause"
          confirmCls="bg-info text-white hover:bg-info/90"
          onClose={() => setReasonModal(null)}
          onConfirm={async (reason) => { await onPause(ad._id, reason); setReasonModal(null) }}
        />
      )}
    </div>
  )
}

export default function AdReviewPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [ads, setAds] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewAd, setViewAd] = useState(null)

  const loadAds = useCallback(() => {
    setLoading(true)
    setError('')
    getAdsAsSupport({ page, limit: 20, status: statusFilter })
      .then(data => {
        setAds(data.items || [])
        setPagination(data.pagination)
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load ads.'))
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAds' own setState calls are the actual fetch-on-mount-and-filter-change trigger, not a derived-render value
  useEffect(() => { loadAds() }, [loadAds])

  const patchAdStatus = (adId, status) => {
    setAds(prev => {
      const stillMatchesFilter = !statusFilter || statusFilter === status
      if (!stillMatchesFilter) return prev.filter(a => a._id !== adId)
      return prev.map(a => a._id === adId ? { ...a, status } : a)
    })
    setViewAd(v => v && v._id === adId ? { ...v, status } : v)
  }

  // Live cross-portal sync — Admin's Ad Review page can also
  // approve/reject/pause/resume these same Ad documents; patch the row (and
  // an open detail modal) in place here too instead of only updating when
  // this page's own action fires.
  useAdStatusSocket({
    onStatusChanged: ({ adId, status }) => patchAdStatus(adId, status),
  })

  const handleApprove = async (adId) => {
    await approveAdAsSupport(adId)
    patchAdStatus(adId, 'ACTIVE')
  }

  const handleReject = async (adId, reason) => {
    await rejectAdAsSupport(adId, reason)
    patchAdStatus(adId, 'REJECTED')
  }

  const handlePause = async (adId, reason) => {
    await pauseAdAsSupport(adId, reason)
    patchAdStatus(adId, 'PAUSED')
  }

  const handleResume = async (adId) => {
    await resumeAdAsSupport(adId)
    patchAdStatus(adId, 'ACTIVE')
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Ad Review &amp; Moderation</h1>
        <p className="text-sm text-slate-500 mt-0.5">Review ads created by vendors in the AdManager Portal</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="">All Statuses</option>
          {STATUSES_LIST.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-danger font-semibold">{error}</p>}

      {loading ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading ads...</div>
      ) : ads.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">No ads match your filters</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map(ad => (
            <div key={ad._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-brand/40 transition-colors cursor-pointer" onClick={() => setViewAd(ad)}>
              <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                {ad.mediaType === 'IMAGE' && ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                ) : ad.mediaType === 'BOOM' && ad.boomId?.videoUrl ? (
                  <video src={ad.boomId.videoUrl} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-300 text-xs font-bold">No preview</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_STYLES[ad.status]}`}>{STATUS_LABEL[ad.status]}</span>
                  <span className="text-[11px] text-slate-400 font-semibold">{fmtDate(ad.createdAt)}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 truncate">{ad.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{ad.business?.username || 'Unknown vendor'}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                  <span>{ad.coinsSpent} coins</span>
                  <span>{ad.impressions ?? 0} impressions</span>
                </div>
                {ad.status === 'PENDING_REVIEW' && (
                  <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleApprove(ad._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-success/8 text-success rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-success/15"
                    >
                      <IconCheck /> Approve
                    </button>
                    <button
                      onClick={() => setViewAd(ad)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-danger/8 text-danger rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-danger/15"
                    >
                      <IconX /> Reject
                    </button>
                  </div>
                )}
                {ad.status === 'ACTIVE' && (
                  <div className="mt-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setViewAd(ad)}
                      className="w-full flex items-center justify-center gap-1.5 bg-info/8 text-info rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-info/15"
                    >
                      <IconPause /> Pause
                    </button>
                  </div>
                )}
                {ad.status === 'PAUSED' && (
                  <div className="mt-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleResume(ad._id)}
                      className="w-full flex items-center justify-center gap-1.5 bg-success/8 text-success rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-success/15"
                    >
                      <IconPlay /> Resume
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing {ads.length} of {pagination.total} ads</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
          <span className="font-semibold text-slate-500">Page {pagination.page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
        </div>
      </div>

      {viewAd && (
        <AdDetailModal
          ad={viewAd}
          onClose={() => setViewAd(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onPause={handlePause}
          onResume={handleResume}
        />
      )}
    </div>
  )
}
