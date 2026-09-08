import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'


const MOCK = {
  kpis: {
    totalAds: 12,
    activeAds: 5,
    pausedAds: 3,
    availableCoins: 640,
    referralCoins: 60,
    totalImpressions: 48230,
    categoriesReached: 7,
  },
  wallet: {
    available: 640,
    referral: 60,
    minToRun: 100,
    rate: '₹10 = 1 Coin',
    reach: '1 Coin ≈ 10 interested customers',
    packs: [
      { coins: 100, price: 1000 },
      { coins: 500, price: 5000, popular: true },
      { coins: 1000, price: 10000 },
    ],
  },
  ads: [
    { id: 'AD-1042', title: 'Wedding Makeup Reel', media: 'BOOM', categories: ['Makeup Artists', 'Wedding'], status: 'RUNNING', impressions: 18420, engagements: 1260, coinsLeft: 210 },
    { id: 'AD-1039', title: 'Diwali Decor Boost', media: 'IMAGE', categories: ['Decoration'], status: 'PAUSED', impressions: 9310, engagements: 540, coinsLeft: 40 },
    { id: 'AD-1031', title: 'Premium Catering Promo', media: 'BOOM', categories: ['Catering', 'Event Organizer'], status: 'RUNNING', impressions: 12750, engagements: 980, coinsLeft: 150 },
    { id: 'AD-1024', title: 'Summer Catering Offer', media: 'IMAGE', categories: ['Catering'], status: 'EXHAUSTED', impressions: 7750, engagements: 410, coinsLeft: 0 },
  ],
  categoriesReached: ['Makeup Artists', 'Decoration', 'Catering', 'Photographer', 'DJ', 'Event Organizer', 'Banquet Hall'],
}

const fmtN = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n))
const fmtMoney = n => `₹${Number(n).toLocaleString('en-IN')}`

const STATUS_STYLES = {
  RUNNING: 'bg-success/10 text-success',
  PAUSED: 'bg-warning/10 text-warning',
  EXHAUSTED: 'bg-slate-100 text-slate-500',
}
const STATUS_LABEL = { RUNNING: 'Running', PAUSED: 'Paused', EXHAUSTED: 'Exhausted' }

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

const DEMO = 'This screen is a static preview — actions here are not wired up yet.'

export default function AdManagerDashboardPage() {
  const navigate = useNavigate()
  const { auth } = useAdManagerAuth()
  const [toast, setToast] = useState('')
  const demo = () => { setToast(DEMO); setTimeout(() => setToast(''), 2500) }
  const go = (path) => navigate(path)

  const k = MOCK.kpis

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

      {toast && <p className="text-sm text-slate-600 bg-slate-100 rounded-xl px-4 py-2.5">{toast}</p>}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Ads Created" value={k.totalAds} sub="All time" color="brand" icon={I.ads} />
        <StatCard label="Active Ads" value={k.activeAds} sub="Currently running" color="success" icon={I.play} />
        <StatCard label="Paused Ads" value={k.pausedAds} sub="Temporarily halted" color="warning" icon={I.pause} />
        <StatCard label="Available Coin Credits" value={fmtN(k.availableCoins)} sub={`+ ${k.referralCoins} referral`} color="info" icon={I.coin} />
        <StatCard label="Total Impressions" value={fmtN(k.totalImpressions)} sub="Across all ads" color="brand" icon={I.eye} />
        <StatCard label="Customer Categories Reached" value={k.categoriesReached} sub="Interest-targeted" color="info" icon={I.target} />
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
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-100">
                  <tr>
                    {['Ad', 'Categories', 'Status', 'Impressions', 'Engagements', 'Coins left', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK.ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{ad.media}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{ad.title}</p>
                            <p className="text-[10px] text-slate-300 font-mono">{ad.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ad.categories.map(c => <span key={c} className="px-2 py-0.5 rounded-full bg-brand/8 text-brand text-[10px] font-bold">{c}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ad.status]}`}>{STATUS_LABEL[ad.status]}</span></td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmtN(ad.impressions)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtN(ad.engagements)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{ad.coinsLeft}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {ad.status === 'RUNNING' && <button onClick={demo} className="w-7 h-7 flex items-center justify-center rounded-lg bg-warning/8 text-warning hover:bg-warning/15" title="Pause">{I.pause}</button>}
                          {ad.status === 'PAUSED' && <button onClick={demo} className="w-7 h-7 flex items-center justify-center rounded-lg bg-success/8 text-success hover:bg-success/15" title="Resume">{I.play}</button>}
                          <button onClick={() => go('/admanager/ad-history')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-info/8 text-info hover:bg-info/15" title="Analytics">{I.history}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Wallet snapshot */}
        <Card title="Coin Wallet" sub="Coins are for ad spend only — non-refundable">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-info/8 rounded-xl p-3">
                <p className="text-[11px] font-semibold text-info/80 uppercase tracking-wide">Available</p>
                <p className="text-xl font-black text-info">{MOCK.wallet.available}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Referral coins</p>
                <p className="text-xl font-black text-slate-700">{MOCK.wallet.referral}</p>
                <p className="text-[10px] text-slate-400">valid 30 days · no withdrawal</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Min {MOCK.wallet.minToRun} coins to run an ad · {MOCK.wallet.rate} · {MOCK.wallet.reach}</p>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Buy coins</p>
              <div className="space-y-2">
                {MOCK.wallet.packs.map(p => (
                  <button key={p.coins} onClick={() => go('/admanager/wallet')} className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${p.popular ? 'border-info/40 bg-info/5' : 'border-slate-200 hover:border-info/40'}`}>
                    <span className="font-bold text-slate-800">{p.coins} coins {p.popular && <span className="ml-1 text-[10px] text-info font-bold">POPULAR</span>}</span>
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
              <li className="flex gap-2"><span className="text-info mt-0.5">{I.target}</span> Shown only to customers with recent interest in your selected categories (browsing, search, bookings, BOOM engagement).</li>
              <li className="flex gap-2"><span className="text-info mt-0.5">{I.play}</span> Priority placement in the <strong>BOOM video feed</strong> and the Customer App <strong>home banner</strong>.</li>
              <li className="flex gap-2"><span className="text-info mt-0.5">{I.eye}</span> 3-second scroll-lock — customers can't skip during the lock window.</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Categories reached</p>
              <div className="flex flex-wrap gap-1.5">
                {MOCK.categoriesReached.map(c => <span key={c} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">{c}</span>)}
              </div>
            </div>
          </Card>
        </div>

        {/* Mobile ad preview */}
        <Card title="Ad Preview" sub="How your ad looks in the Customer App">
          <div className="mx-auto w-40 rounded-[1.75rem] border-4 border-slate-800 bg-slate-800 p-1.5">
            <div className="rounded-[1.25rem] overflow-hidden bg-slate-100">
              <div className="h-40 bg-linear-to-b from-slate-300 to-slate-400 flex items-center justify-center text-[10px] font-black text-white/80">BOOM VIDEO</div>
              <div className="p-2.5">
                <p className="text-[11px] font-black text-slate-800 leading-tight">Wedding Makeup Reel</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Sponsored · salonvala</p>
                <button className="mt-2 w-full bg-info text-white text-[10px] font-bold py-1.5 rounded-lg">Book Now</button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">Clickable demo — preview only.</p>
        </Card>
      </div>

      {/* Support + guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card title="Wallet Guidelines">
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
              <li>Coins are strictly for ad spend — no conversion or withdrawal to a bank account.</li>
              <li>Purchased coins are non-refundable.</li>
              <li>Referral coins are valid for 30 days and cannot be withdrawn as cash.</li>
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
