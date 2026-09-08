

export const fmtN = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n))
export const fmtMoney = (n) => `₹${Number(n).toLocaleString('en-IN')}`
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })

export const STATUS_STYLES = {
  RUNNING: 'bg-success/10 text-success',
  PAUSED: 'bg-warning/10 text-warning',
  EXHAUSTED: 'bg-slate-100 text-slate-500',
  PENDING_REVIEW: 'bg-info/10 text-info',
}
export const STATUS_LABEL = { RUNNING: 'Running', PAUSED: 'Paused', EXHAUSTED: 'Exhausted', PENDING_REVIEW: 'In review' }

export const CATEGORIES = [
  'Makeup Artists', 'Decoration', 'Catering', 'Photographer', 'DJ', 'Event Organizer',
  'Banquet Hall', 'Mehndi Artists', 'Wedding', 'Nail Artists', 'Sound System', 'Spa Service',
]

export const MOCK_BOOMS = [
  { id: 'BM-501', title: 'Bridal glam transformation' },
  { id: 'BM-498', title: 'Behind the scenes — wedding décor' },
  { id: 'BM-482', title: 'Live catering counter walkthrough' },
]

export const MOCK_ADS = [
  { id: 'AD-1042', title: 'Wedding Makeup Reel', media: 'BOOM', categories: ['Makeup Artists', 'Wedding'], status: 'RUNNING', views: 18420, reached: 14100, engagements: 1260, ctr: 6.8, conversions: 34, spent: 190, createdAt: '2026-08-30T00:00:00.000Z' },
  { id: 'AD-1039', title: 'Diwali Decor Boost', media: 'IMAGE', categories: ['Decoration'], status: 'PAUSED', views: 9310, reached: 7600, engagements: 540, ctr: 5.8, conversions: 12, spent: 260, createdAt: '2026-08-28T00:00:00.000Z' },
  { id: 'AD-1031', title: 'Premium Catering Promo', media: 'BOOM', categories: ['Catering', 'Event Organizer'], status: 'RUNNING', views: 12750, reached: 10200, engagements: 980, ctr: 7.7, conversions: 21, spent: 150, createdAt: '2026-08-22T00:00:00.000Z' },
  { id: 'AD-1024', title: 'Summer Catering Offer', media: 'IMAGE', categories: ['Catering'], status: 'EXHAUSTED', views: 7750, reached: 6100, engagements: 410, ctr: 5.3, conversions: 8, spent: 100, createdAt: '2026-07-15T00:00:00.000Z' },
]

export const MOCK_SPEND = [
  { id: 'TX-9001', date: '2026-09-06T00:00:00.000Z', adId: 'AD-1042', adTitle: 'Wedding Makeup Reel', coins: 40, type: 'Ad Boost' },
  { id: 'TX-8990', date: '2026-09-04T00:00:00.000Z', adId: 'AD-1031', adTitle: 'Premium Catering Promo', coins: 30, type: 'Ad Boost' },
  { id: 'TX-8975', date: '2026-09-01T00:00:00.000Z', adId: '—', adTitle: 'Coin pack purchase', coins: 500, type: 'Purchase' },
  { id: 'TX-8960', date: '2026-08-30T00:00:00.000Z', adId: 'AD-1039', adTitle: 'Diwali Decor Boost', coins: 60, type: 'Ad Boost' },
  { id: 'TX-8951', date: '2026-08-27T00:00:00.000Z', adId: '—', adTitle: 'Referral bonus', coins: 20, type: 'Referral' },
]

export const COIN_PACKS = [
  { coins: 100, price: 1000 },
  { coins: 500, price: 5000, popular: true },
  { coins: 1000, price: 10000 },
]

export function Card({ title, sub, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

/** Phone-frame mock of how the ad appears in the Customer App.
 *  `image` — an object URL / src to show for a banner ad (media === 'IMAGE'). */
export function AdPhonePreview({ title = 'Your ad title', desc = '', vendor = 'your business', media = 'BOOM', image = '' }) {
  return (
    <div className="mx-auto w-44 rounded-[1.75rem] border-4 border-slate-800 bg-slate-800 p-1.5">
      <div className="rounded-[1.25rem] overflow-hidden bg-slate-100">
        {media === 'IMAGE' && image ? (
          <img src={image} alt="Banner preview" className="h-44 w-full object-cover" />
        ) : (
          <div className="h-44 bg-linear-to-b from-slate-300 to-slate-400 flex items-center justify-center text-[10px] font-black text-white/80">
            {media === 'IMAGE' ? 'BANNER IMAGE' : 'BOOM VIDEO'}
          </div>
        )}
        <div className="p-2.5">
          <p className="text-[11px] font-black text-slate-800 leading-tight line-clamp-2">{title}</p>
          {desc && <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">{desc}</p>}
          <p className="text-[9px] text-slate-400 mt-1">Sponsored · {vendor}</p>
          <button className="mt-2 w-full bg-info text-white text-[10px] font-bold py-1.5 rounded-lg">Book Now</button>
        </div>
      </div>
    </div>
  )
}

export const btnPrimary = 'bg-info text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity'
export const btnGhost = 'bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200'
export const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-info/20'
