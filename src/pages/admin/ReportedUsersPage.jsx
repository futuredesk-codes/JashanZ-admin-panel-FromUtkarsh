import { useState, useEffect, useCallback } from 'react'
import { getReportedUsers, updateReportedUserStatus } from '../../api/content'
import { ApiError } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'

const fmtDateTime = d => (d ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const STATUS_TABS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ALL', label: 'All' },
]

const STATUS_STYLES = {
  PENDING: 'bg-warning/10 text-warning',
  REVIEWED: 'bg-success/10 text-success',
  DISMISSED: 'bg-slate-100 text-slate-500',
}

// Both sides are populated with just `username`; a deleted account comes back null.
const accountName = acct => acct?.username || 'Deleted account'

export default function ReportedUsersPage() {
  const { can } = usePermissions()
  const canAct = can('contentModeration', 'FULL')

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, hasNextPage: false })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState(null)
  const [actionError, setActionError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getReportedUsers({ page, limit: 20, status })
      .then(data => {
        setItems(data.items || [])
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, hasNextPage: false })
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load reported users.'))
      .finally(() => setLoading(false))
  }, [page, status])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load()'s own setState calls are the fetch-on-filter-change trigger, not a derived-render value
  useEffect(() => { load() }, [load])

  const changeStatus = async (item, next) => {
    setActioningId(item._id)
    setActionError('')
    try {
      await updateReportedUserStatus(item._id, next)
      // On a specific-status tab the row no longer belongs once its status
      // changes; on "All" it just updates in place.
      setItems(prev =>
        status === 'ALL'
          ? prev.map(i => (i._id === item._id ? { ...i, status: next } : i))
          : prev.filter(i => i._id !== item._id)
      )
      setPagination(p => (status === 'ALL' ? p : { ...p, total: Math.max(0, p.total - 1) }))
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update this report.')
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-800">Reported Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Every "Report User" submitted from the website and app — see who reported whom and why, then mark it reviewed or dismiss it
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              status === t.value ? 'bg-brand text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}
      {actionError && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{actionError}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Reported user', 'Role', 'Reported by', 'Reason', 'Status', 'Reported on', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  {status === 'ALL' ? 'No reports yet' : `No ${status.toLowerCase()} reports`}
                </td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 font-bold text-slate-800 text-xs whitespace-nowrap">{accountName(item.reported)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{item.reportedModel}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {accountName(item.reporter)} <span className="text-slate-400">({item.reporterModel})</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[320px] break-words whitespace-pre-wrap">{item.reason}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-500'}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    {canAct ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => changeStatus(item, 'REVIEWED')}
                              disabled={actioningId === item._id}
                              className="px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/15 text-xs font-bold transition-colors disabled:opacity-40"
                            >Mark reviewed</button>
                            <button
                              onClick={() => changeStatus(item, 'DISMISSED')}
                              disabled={actioningId === item._id}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold transition-colors disabled:opacity-40"
                            >Dismiss</button>
                          </>
                        ) : (
                          <button
                            onClick={() => changeStatus(item, 'PENDING')}
                            disabled={actioningId === item._id}
                            className="px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 text-xs font-bold transition-colors disabled:opacity-40"
                          >Reopen</button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          <span>Showing {items.length} of {pagination.total} reports</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
            <span className="font-semibold text-slate-500">Page {pagination.page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
