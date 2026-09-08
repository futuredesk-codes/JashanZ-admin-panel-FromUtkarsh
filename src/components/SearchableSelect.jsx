import { useState, useMemo } from 'react'

export default function SearchableSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select…',
  buttonClassName = 'min-w-40',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const rows = useMemo(
    () => [{ value: '', label: placeholder }, ...options.filter((o) => o.value !== '')],
    [options, placeholder],
  )
  const selected = rows.find((o) => String(o.value) === String(value)) || rows[0]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((o) => o.label.toLowerCase().includes(q)) : rows
  }, [rows, query])

  const close = () => { setOpen(false); setQuery('') }
  const pick = (v) => { onChange(v); close() }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className={`flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 ${value ? 'text-slate-800' : 'text-slate-400'} ${buttonClassName}`}
      >
        <span className="truncate">{selected.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={close} />
          <div className="absolute left-0 top-full mt-1 z-30 min-w-56 w-max max-w-[18rem] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && close()}
                placeholder="Search…"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400">No matches</p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => pick(o.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${String(o.value) === String(value) ? 'text-brand font-semibold bg-brand/5' : 'text-slate-700'}`}
                  >
                    {o.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
