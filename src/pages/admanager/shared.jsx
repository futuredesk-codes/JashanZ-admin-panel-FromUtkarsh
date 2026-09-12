

export const fmtN = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n))
export const fmtMoney = (n) => `₹${Number(n).toLocaleString('en-IN')}`
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })

// Matches the real backend enum (adManagerModel.js's Ad.status) exactly —
// RUNNING/EXHAUSTED-only naming from the old mock data has been replaced.
export const STATUS_STYLES = {
  ACTIVE: 'bg-success/10 text-success',
  PAUSED: 'bg-warning/10 text-warning',
  EXHAUSTED: 'bg-slate-100 text-slate-500',
  PENDING_REVIEW: 'bg-info/10 text-info',
  REJECTED: 'bg-danger/10 text-danger',
}
export const STATUS_LABEL = {
  ACTIVE: 'Running',
  PAUSED: 'Paused',
  EXHAUSTED: 'Exhausted',
  PENDING_REVIEW: 'In review',
  REJECTED: 'Rejected',
}

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
 *  `image` — an object URL / src to show for a banner ad (media === 'IMAGE').
 *  `video` — a src to play for a BOOM ad (media === 'BOOM'); falls back to a
 *  static placeholder when not yet known (e.g. on the standalone Preview
 *  tool, which has no real video to show). */
export function AdPhonePreview({ title = 'Your ad title', desc = '', vendor = 'your business', media = 'BOOM', image = '', video = '' }) {
  return (
    <div className="mx-auto w-44 rounded-[1.75rem] border-4 border-slate-800 bg-slate-800 p-1.5">
      <div className="rounded-[1.25rem] overflow-hidden bg-slate-100">
        {media === 'IMAGE' && image ? (
          <img src={image} alt="Banner preview" className="h-44 w-full object-contain bg-slate-900" />
        ) : media === 'BOOM' && video ? (
          <video src={video} className="h-44 w-full object-cover bg-slate-900" muted loop autoPlay playsInline />
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
