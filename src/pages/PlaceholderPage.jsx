export default function PlaceholderPage({ title = 'Coming Soon', icon }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-4">
        {icon ?? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        )}
      </div>
      <h2 className="text-xl font-black text-slate-800 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 max-w-xs">This section is under development. Check back soon.</p>
    </div>
  )
}
