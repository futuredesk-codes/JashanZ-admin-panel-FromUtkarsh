import { useState, useEffect, useCallback } from 'react'
import {
  getAllBooms, getAllPosts, suspendBoom, suspendPost, reactivateBoom, reactivatePost, removeBoom, removePost,
} from '../../api/content'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'
import ConfirmDialog from '../../components/ConfirmDialog'

const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

// Defense in depth — the backend now normalizes this too, but older content
// predating the moderationStatus field would otherwise render a blank badge
// and lose its Suspend/Reactivate button if that ever slips through.
const effectiveStatus = item => item.moderationStatus || (item.isActive ? 'ACTIVE' : 'REMOVED')

const AUTHOR_MODELS = [
  { value: '', label: 'All roles' },
  { value: 'User', label: 'User' },
  { value: 'Business', label: 'Business' },
  { value: 'Creator', label: 'Creator' },
]

const STATUS_STYLES = {
  ACTIVE: 'bg-success/10 text-success',
  SUSPENDED: 'bg-warning/10 text-warning',
  REMOVED: 'bg-danger/10 text-danger',
}

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

/* ── Icons ── */
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconPause = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Preview modal — shows the media + full caption/description ── */
function PreviewModal({ item, type, onClose }) {
  const authorName = item.author?.name || item.author?.username || 'Unknown'
  const text = type === 'boom' ? item.caption : item.description
  const mediaUrl = type === 'boom' ? (item.processedVideoUrl || item.videoUrl) : item.mediaUrl
  const isVideo = type === 'boom' || item.type === 'VIDEO'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {item.author?.profileImg
              ? <img src={item.author.profileImg} alt={authorName} className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">{authorName?.[0]?.toUpperCase()}</div>}
            <div>
              <p className="font-bold text-slate-800 text-sm">{authorName}</p>
              <p className="text-[11px] text-slate-400">{item.authorModel} · {fmtDateTime(item.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><IconX /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {mediaUrl && (
            <div className="rounded-xl overflow-hidden bg-slate-900 max-h-[50vh] flex items-center justify-center">
              {isVideo
                ? <video src={mediaUrl} controls className="max-h-[50vh] w-full" />
                : <img src={mediaUrl} alt="" className="max-h-[50vh] w-full object-contain" />}
            </div>
          )}
          {text && <p className="text-sm text-slate-700 whitespace-pre-wrap">{text}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Status</p>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[effectiveStatus(item)] || 'bg-slate-100 text-slate-500'}`}>{effectiveStatus(item)}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Reports</p>
              <p className="text-sm font-bold text-slate-800">{item.reportsCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── One content-type tab (Booms or Posts) — shares the same table/filter/action shape ── */
function ContentTable({ type }) {
  const { can } = usePermissions()
  const canAct = can('contentModeration', 'FULL')

  const fetchList = type === 'boom' ? getAllBooms : getAllPosts
  const doSuspend = type === 'boom' ? suspendBoom : suspendPost
  const doReactivate = type === 'boom' ? reactivateBoom : reactivatePost
  const doRemove = type === 'boom' ? removeBoom : removePost

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [authorModel, setAuthorModel] = useState('')
  const [status, setStatus] = useState('')

  const [previewItem, setPreviewItem] = useState(null)
  const [actioningId, setActioningId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    const params = { page, limit: 20 }
    if (debouncedSearch) params.search = debouncedSearch
    if (authorModel) params.authorModel = authorModel
    if (status) params.status = status
    fetchList(params)
      .then(data => { setItems(data.items || []); setPagination(data.pagination || { total: 0, page: 1, limit: 20, hasNextPage: false }) })
      .catch(err => setError(err instanceof ApiError ? err.message : `Could not load ${type === 'boom' ? 'booms' : 'posts'}.`))
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, authorModel, status, fetchList, type])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const handleSuspend = async (item) => {
    setActioningId(item._id)
    setActionError('')
    try {
      await doSuspend(item._id)
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, moderationStatus: 'SUSPENDED', isActive: false } : i))
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not suspend this content.')
    } finally {
      setActioningId(null)
    }
  }

  const handleReactivate = async (item) => {
    setActioningId(item._id)
    setActionError('')
    try {
      await doReactivate(item._id)
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, moderationStatus: 'ACTIVE', isActive: true } : i))
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not reactivate this content.')
    } finally {
      setActioningId(null)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    setActionError('')
    try {
      await doRemove(removeTarget._id)
      setItems(prev => prev.map(i => i._id === removeTarget._id ? { ...i, moderationStatus: 'REMOVED', isActive: false } : i))
      setRemoveTarget(null)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not remove this content.')
    } finally {
      setRemoving(false)
    }
  }

  const anyFilter = search || authorModel || status

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <input
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 w-full max-w-xs"
          placeholder="Search by username or name..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className={selectCls} value={authorModel} onChange={e => { setAuthorModel(e.target.value); setPage(1) }}>
          {AUTHOR_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className={selectCls} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REMOVED">Removed</option>
        </select>
        {anyFilter && (
          <button onClick={() => { setSearch(''); setAuthorModel(''); setStatus(''); setPage(1) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}
      {actionError && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{actionError}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Author', 'Role', (type === 'boom' ? 'Caption' : 'Description'), 'Reports', 'Status', 'Posted', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No {type === 'boom' ? 'booms' : 'posts'} match your filters</td></tr>
              ) : items.map(item => {
                const authorName = item.author?.name || item.author?.username || 'Unknown'
                const text = type === 'boom' ? item.caption : item.description
                const status = effectiveStatus(item)
                return (
                  <tr key={item._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setPreviewItem(item)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {item.author?.profileImg
                          ? <img src={item.author.profileImg} alt={authorName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          : <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black shrink-0">{authorName?.[0]?.toUpperCase()}</div>}
                        <p className="font-bold text-slate-800 text-xs">{authorName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{item.authorModel}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[220px] truncate">{text || '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{item.reportsCount || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-500'}`}>{status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPreviewItem(item)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15 transition-colors" title="Preview"><IconEye /></button>
                        {canAct && status === 'ACTIVE' && (
                          <button
                            onClick={() => handleSuspend(item)}
                            disabled={actioningId === item._id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-warning/8 text-warning hover:bg-warning/15 transition-colors disabled:opacity-40"
                            title="Suspend"
                          ><IconPause /></button>
                        )}
                        {canAct && status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleReactivate(item)}
                            disabled={actioningId === item._id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-success/8 text-success hover:bg-success/15 transition-colors disabled:opacity-40"
                            title="Reactivate"
                          ><IconPlay /></button>
                        )}
                        {canAct && status !== 'REMOVED' && (
                          <button
                            onClick={() => setRemoveTarget(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-danger/8 text-danger hover:bg-danger/15 transition-colors"
                            title="Remove permanently"
                          ><IconTrash /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} {type === 'boom' ? 'booms' : 'posts'}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {previewItem && <PreviewModal item={previewItem} type={type} onClose={() => setPreviewItem(null)} />}

      {removeTarget && (
        <ConfirmDialog
          title={`Remove this ${type === 'boom' ? 'boom' : 'post'} permanently?`}
          message="This hides it from every feed/profile for good. Unlike Suspend, a removed item cannot be reactivated later."
          confirmLabel="Remove"
          loading={removing}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}

export default function ContentModerationPage() {
  const [tab, setTab] = useState('boom') // 'boom' | 'post'

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-800">Content Moderation</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Every Boom and Vibe post, filterable by author role and account — suspend or permanently remove anything that shouldn't be up
        </p>
      </div>

      <div className="flex gap-2">
        {[{ id: 'boom', label: 'Booms' }, { id: 'post', label: 'Posts' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-brand text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ContentTable key={tab} type={tab} />
    </div>
  )
}
