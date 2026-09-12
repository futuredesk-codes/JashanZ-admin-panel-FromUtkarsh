import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'
import { getAdManagerDashboard, getMyAdManagerAds, pauseAdManagerAd, resumeAdManagerAd, getAdManagerWallet, getAdManagerCoinPacks } from '../../api/admanager'
import { ApiError } from '../../api/client'

const fmtN = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n))
const fmtMoney = n => `₹${Number(n).toLocaleString('en-IN')}`

// Real backend status enum (adManagerModel.js) — PENDING_REVIEW/REJECTED
// included so every ad this table can actually hold renders correctly, not
// just the RUNNING/PAUSED/EXHAUSTED subset a running ad ever transitions through.
const STATUS_STYLES = {
  ACTIVE: 'bg-success/10 text-success',
  PAUSED: 'bg-warning/10 text-warning',
  EXHAUSTED: 'bg-slate-100 text-slate-500',
  PENDING_REVIEW: 'bg-info/10 text-info',
  REJECTED: 'bg-danger/10 text-danger',
}
const STATUS_LABEL = {
  ACTIVE: 'Running',
  PAUSED: 'Paused',
  EXHAUSTED: 'Exhausted',
  PENDING_REVIEW: 'Pending Review',
  REJECTED: 'Rejected',
}

/* ── Icons ── */
const I = {
  ads: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 11-5.8-1.6" /></svg>,
  play: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  pause: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
  coin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" /></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  wallet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4z" /></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 106 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
}

function StatCard({ label, value, sub, color = 'brand', icon }) {
  const c = {
    brand: 'bg-brand/8 text-brand ring-brand/15',
    success: 'bg-success/8 text-success ring-success/15',
    warning: 'bg-warning/8 text-warning ring-warning/15',
    danger: 'bg-danger/8 text-danger ring-danger/15',
    info: 'bg-info/8 text-info ring-info/15',
  }[color]
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-xl ring-1 flex items-center justify-center mb-3 ${c}`}>{icon}</div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Card({ title, sub, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function AdManagerDashboardPage() {
  const navigate = useNavigate()
  const { auth } = useAdManagerAuth()
  const go = (path) => navigate(path)

  const [kpis, setKpis] = useState(null)
  const [ads, setAds] = useState([])
  const [wallet, setWallet] = useState(null)
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashboard, adsData, walletData, packsData] = await Promise.all([
        getAdManagerDashboard(),
        getMyAdManagerAds(),
        getAdManagerWallet(),
        getAdManagerCoinPacks(),
      ])
      setKpis(dashboard)
      setAds((adsData.ads || []).slice(0, 5))
      setWallet(walletData.wallet)
      setPacks(packsData.packs || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAll's own setState calls are the fetch-on-mount trigger, not a derived-render value
    loadAll()
  }, [loadAll])

  const handleToggle = async (ad) => {
    if (actioningId) return
    setActioningId(ad._id)
    setError('')
    try {
      if (ad.status === 'ACTIVE') await pauseAdManagerAd(ad._id)
      else if (ad.status === 'PAUSED') await resumeAdManagerAd(ad._id)
      await loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update ad.')
    } finally {
      setActioningId(null)
    }
  }

  const categoriesReachedNames = Array.from(
    new Set(ads.flatMap(ad => (ad.targetCategories || []).map(c => c.name)))
  )

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome banner */}
      <div className="bg-linear-to-r from-sidebar to-[#1e293b] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-white/50 text-xs font-semibold mb-1">Welcome back,</p>
          <h2 className="text-white text-xl font-black">{auth?.username || 'Vendor'}</h2>
          <p className="text-white/40 text-xs mt-1">Boost your BOOM videos to interested customers</p>
        </div>
        <button onClick={() => go('/admanager/create-ad')} className="bg-info text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5">
          {I.plus} Create New Ad
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger font-semibold bg-danger/5 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Ads Created" value={loading ? '…' : (kpis?.totalAds ?? 0)} sub="All time" color="brand" icon={I.ads} />
        <StatCard label="Active Ads" value={loading ? '…' : (kpis?.activeAds ?? 0)} sub="Currently running" color="success" icon={I.play} />
        <StatCard label="Paused Ads" value={loading ? '…' : (kpis?.pausedAds ?? 0)} sub="Temporarily halted" color="warning" icon={I.pause} />
        <StatCard
          label="Available Coin Credits"
          value={loading ? '…' : fmtN(kpis?.availableCoins ?? 0)}
          sub={loading ? '' : `+ ${kpis?.referralCoins ?? 0} referral`}
          color="info"
          icon={I.coin}
        />
        <StatCard label="Total Impressions" value={loading ? '…' : fmtN(kpis?.totalImpressions ?? 0)} sub="Across all ads" color="brand" icon={I.eye} />
        <StatCard label="Customer Categories Reached" value={loading ? '…' : (kpis?.categoriesReached ?? 0)} sub="Interest-targeted" color="info" icon={I.target} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Create New Ad', icon: I.plus, onClick: () => go('/admanager/create-ad') },
          { label: 'Preview Ad', icon: I.eye, onClick: () => go('/admanager/preview') },
          { label: 'View Wallet', icon: I.wallet, onClick: () => go('/admanager/wallet') },
          { label: 'Ad History', icon: I.history, onClick: () => go('/admanager/ad-history') },
        ].map(a => (
          <button key={a.label} onClick={a.onClick} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:border-info/40 hover:shadow-md transition-all text-left">
            <span className="w-9 h-9 rounded-xl bg-info/8 text-info flex items-center justify-center shrink-0">{a.icon}</span>
            <span className="text-sm font-bold text-slate-800">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ad Control Center */}
        <div className="lg:col-span-2">
          <Card
            title="Ad Control Center"
            sub="Running, paused and exhausted ads"
            action={<button onClick={() => go('/admanager/ad-history')} className="text-xs font-bold text-info hover:underline">View all</button>}
          >
            <div className="overflow-x-auto -m-5">
              {loading ? (
                <p className="text-sm text-slate-400 text-center py-6">Loading…</p>
              ) : ads.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No ads yet — create your first one.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/70 border-b border-slate-100">
                    <tr>
                      {['Ad', 'Categories', 'Status', 'Impressions', 'Clicks', 'Coins left', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ads.map(ad => (
                      <tr key={ad._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{ad.mediaType}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-tight">{ad.title}</p>
                              <p className="text-[10px] text-slate-300 font-mono">{String(ad._id).slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(ad.targetCategories || []).length === 0
                              ? <span className="text-[11px] text-slate-300">—</span>
                              : ad.targetCategories.map(c => <span key={c._id} className="px-2 py-0.5 rounded-full bg-brand/8 text-brand text-[10px] font-bold">{c.name}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ad.status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABEL[ad.status] || ad.status}</span></td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmtN(ad.impressions || 0)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtN(ad.clicks || 0)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{ad.coinsRemaining}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {ad.status === 'ACTIVE' && (
                              <button onClick={() => handleToggle(ad)} disabled={actioningId === ad._id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-warning/8 text-warning hover:bg-warning/15 disabled:opacity-50" title="Pause">{I.pause}</button>
                            )}
                            {ad.status === 'PAUSED' && (
                              <button onClick={() => handleToggle(ad)} disabled={actioningId === ad._id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-success/8 text-success hover:bg-success/15 disabled:opacity-50" title="Resume">{I.play}</button>
                            )}
                            <button onClick={() => go('/admanager/ad-history')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="Analytics">{I.history}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Wallet snapshot */}
        <Card title="Coin Wallet" sub="Coins are for ad spend only — non-refundable">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-info/8 rounded-xl p-3">
                <p className="text-[11px] font-semibold text-info/80 uppercase tracking-wide">Available</p>
                <p className="text-xl font-black text-info">{loading ? '…' : (wallet?.coins ?? 0)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Referral coins</p>
                <p className="text-xl font-black text-slate-700">{loading ? '…' : (wallet?.referralCoins ?? 0)}</p>
                <p className="text-[10px] text-slate-400">no withdrawal</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Minimum 100 coins to run an ad.</p>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Buy coins</p>
              <div className="space-y-2">
                {packs.length === 0 ? (
                  <p className="text-xs text-slate-400">{loading ? 'Loading…' : 'No coin packs available.'}</p>
                ) : packs.map(p => (
                  <button key={p._id} onClick={() => go('/admanager/wallet')} className="w-full flex items-center justify-between rounded-xl border border-slate-200 hover:border-info/40 px-3 py-2.5 text-sm transition-colors">
                    <span className="font-bold text-slate-800">{p.coins} coins</span>
                    <span className="font-black text-slate-800">{fmtMoney(p.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Targeting & display */}
        <div className="lg:col-span-2">
          <Card title="Targeting & Display" sub="Where and to whom your ads appear">
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-info mt-0.5">{I.target}</span> Shown only to customers whose registered city matches the city you target when creating the ad.</li>
              <li className="flex gap-2"><span className="text-info mt-0.5">{I.play}</span> Appears in the customer's <strong>BOOM video feed</strong>, mixed in with regular videos and marked "Sponsored".</li>
              <li className="flex gap-2"><span className="text-info mt-0.5">{I.eye}</span> Each time it's shown, one coin is spent — the ad pauses itself automatically once coins run out.</li>
            </ul>
            {categoriesReachedNames.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Categories selected across your ads</p>
                <div className="flex flex-wrap gap-1.5">
                  {categoriesReachedNames.map(c => <span key={c} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">{c}</span>)}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card title="Ad Preview" sub="Preview how your ads look before publishing">
          <p className="text-sm text-slate-500">Open the full preview tool to see your ad exactly as customers will.</p>
          <button onClick={() => go('/admanager/preview')} className="mt-3 bg-info/8 text-info rounded-xl px-4 py-2 text-sm font-bold hover:bg-info/15">Open Ad Preview</button>
        </Card>
      </div>

      {/* Support + guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card title="Wallet Guidelines">
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
              <li>Coins are strictly for ad spend — no conversion or withdrawal to a bank account.</li>
              <li>Purchased coins are non-refundable.</li>
              <li>Referral coins cannot be withdrawn as cash.</li>
              <li>Any misuse results in banning of AdManager access.</li>
            </ul>
          </Card>
        </div>
        <Card title="Need help?" sub="Technical support">
          <p className="text-sm text-slate-500">Raise an issue and get a ticket ID from the Jashanz Support team.</p>
          <button onClick={() => go('/admanager/support')} className="mt-3 bg-info/8 text-info rounded-xl px-4 py-2 text-sm font-bold hover:bg-info/15">Open Support Form</button>
        </Card>
      </div>
    </div>
  )
}
