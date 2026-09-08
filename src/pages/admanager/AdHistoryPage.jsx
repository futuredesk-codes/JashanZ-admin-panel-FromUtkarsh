import { useState } from 'react'
import { Card, MOCK_ADS, STATUS_STYLES, STATUS_LABEL, fmtN, fmtDate, btnPrimary, btnGhost } from './shared'

const FILTERS = ['ALL', 'RUNNING', 'PAUSED', 'EXHAUSTED']

function AnalyticsModal({ ad, onClose, onExport }) {
  const rows = [
    ['Total Views', fmtN(ad.views)],
    ['Targeted Users Reached', fmtN(ad.reached)],
    ['Engagements', fmtN(ad.engagements)],
    ['Click-Through Rate (CTR)', `${ad.ctr}%`],
    ['Conversions (bookings after ad)', ad.conversions],
    ['Coins Spent', ad.spent],
    ['Categories Targeted', ad.categories.join(', ')],
    ['Created', fmtDate(ad.createdAt)],
  ]
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base">{ad.title}</h3>
            <p className="text-xs text-slate-400">{ad.id} · {ad.media}</p>
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
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => onExport('PDF')} className={btnGhost}>Export PDF</button>
          <button onClick={() => onExport('Excel')} className={btnPrimary}>Export Excel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdHistoryPage() {
  const [filter, setFilter] = useState('ALL')
  const [viewAd, setViewAd] = useState(null)
  const [toast, setToast] = useState('')
  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2600) }

  const ads = filter === 'ALL' ? MOCK_ADS : MOCK_ADS.filter(a => a.status === filter)

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">Ad History &amp; Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Every ad you've run, with views, CTR and conversions</p>
        </div>
        <button onClick={() => flash('All ads exported — demo.')} className={btnPrimary}>Export All</button>
      </div>

      {toast && <p className="text-sm text-slate-600 bg-slate-100 rounded-xl px-4 py-2.5">{toast}</p>}

      <div className="flex items-center gap-2">
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
                {['Ad', 'Status', 'Views', 'Reached', 'CTR', 'Conversions', 'Coins', 'Created', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ads.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No ads with this status</td></tr>
              ) : ads.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setViewAd(ad)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{ad.media}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{ad.title}</p>
                        <p className="text-[10px] text-slate-300 font-mono">{ad.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ad.status]}`}>{STATUS_LABEL[ad.status]}</span></td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmtN(ad.views)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtN(ad.reached)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{ad.ctr}%</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{ad.conversions}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{ad.spent}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(ad.createdAt)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewAd(ad)} className="text-xs font-bold text-info hover:underline whitespace-nowrap">View report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {viewAd && <AnalyticsModal ad={viewAd} onClose={() => setViewAd(null)} onExport={(fmt) => flash(`${viewAd.id} report exported as ${fmt} — demo.`)} />}
    </div>
  )
}
