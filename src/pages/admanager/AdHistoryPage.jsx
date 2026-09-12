import { useState, useEffect, useCallback } from 'react'
import { Card, STATUS_STYLES, STATUS_LABEL, fmtN, fmtDate } from './shared'
import { getMyAdManagerAds } from '../../api/admanager'
import { ApiError } from '../../api/client'

const FILTERS = ['ALL', 'ACTIVE', 'PAUSED', 'EXHAUSTED', 'PENDING_REVIEW', 'REJECTED']

function AnalyticsModal({ ad, onClose }) {
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
  const rows = [
    ['Impressions', fmtN(ad.impressions || 0)],
    ['Clicks', fmtN(ad.clicks || 0)],
    ['Click-Through Rate (CTR)', `${ctr}%`],
    ['Coins Spent', ad.coinsSpent],
    ['Coins Remaining', ad.coinsRemaining],
    ['Target City', ad.targetCity || '—'],
    ['Categories Targeted', (ad.targetCategories || []).map(c => c.name).join(', ') || '—'],
    ['Created', fmtDate(ad.createdAt)],
  ]
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base">{ad.title}</h3>
            <p className="text-xs text-slate-400">{String(ad._id).slice(-8).toUpperCase()} · {ad.mediaType}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          {rows.map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{k}</p>
              <p className="text-sm font-bold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdHistoryPage() {
  const [filter, setFilter] = useState('ALL')
  const [viewAd, setViewAd] = useState(null)
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAds = useCallback(() => {
    setLoading(true)
    setError('')
    getMyAdManagerAds()
      .then(data => setAds(data.ads || []))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load ads.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAds' own setState calls are the fetch-on-mount trigger, not a derived-render value
    loadAds()
  }, [loadAds])

  const filtered = filter === 'ALL' ? ads : ads.filter(a => a.status === filter)

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Ad History &amp; Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every ad you've run, with impressions, clicks and CTR</p>
      </div>

      {error && <p className="text-sm text-danger font-semibold bg-danger/5 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-info text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f === 'ALL' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Ad', 'Status', 'Impressions', 'Clicks', 'CTR', 'Coins', 'Created', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No ads with this status</td></tr>
              ) : filtered.map(ad => {
                const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0'
                return (
                  <tr key={ad._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setViewAd(ad)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{ad.mediaType}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">{ad.title}</p>
                          <p className="text-[10px] text-slate-300 font-mono">{String(ad._id).slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ad.status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABEL[ad.status] || ad.status}</span></td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmtN(ad.impressions || 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtN(ad.clicks || 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ctr}%</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ad.coinsRemaining}/{ad.coinsSpent}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(ad.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setViewAd(ad)} className="text-xs font-bold text-info hover:underline whitespace-nowrap">View report</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {viewAd && <AnalyticsModal ad={viewAd} onClose={() => setViewAd(null)} />}
    </div>
  )
}
