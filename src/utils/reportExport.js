

export const PREVIEW_ROW_CAP = 500

/* ── Date range presets ── */
const pad = (n) => String(n).padStart(2, '0')
export const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const DAY_MS = 86400000

export const PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 90 days' },
  { key: 'thisYear', label: 'This year' },
  { key: 'custom', label: 'Custom' },
]

export function presetRange(key) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (key) {
    case 'all': return { from: '', to: '' }
    case 'thisMonth': return { from: isoDay(new Date(y, m, 1)), to: isoDay(now) }
    case 'lastMonth': return { from: isoDay(new Date(y, m - 1, 1)), to: isoDay(new Date(y, m, 0)) }
    case 'last7': return { from: isoDay(new Date(now.getTime() - 6 * DAY_MS)), to: isoDay(now) }
    case 'last30': return { from: isoDay(new Date(now.getTime() - 29 * DAY_MS)), to: isoDay(now) }
    case 'last90': return { from: isoDay(new Date(now.getTime() - 89 * DAY_MS)), to: isoDay(now) }
    case 'thisYear': return { from: isoDay(new Date(y, 0, 1)), to: isoDay(now) }
    default: return null // 'custom' — keep whatever the inputs hold
  }
}

export const fmtDay = (s) =>
  s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

export function rangeLabelFor(from, to) {
  if (!from && !to) return 'All time'
  return `${fmtDay(from) || 'the beginning'} – ${fmtDay(to) || 'today'}`
}

/* ── CSV / table builders ── */
export const csvEscape = (v) => {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const flattenValue = (v) => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') {
    if (v.username) return v.username
    if (v.name) return v.name
    if (v._id) return String(v._id)
    return ''
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('en-IN')
  return v
}

export const downloadBlob = (content, mime, filename) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const buildCsv = (columns, rows) => {
  const header = columns.map(([, label]) => label)
  const lines = [header.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(columns.map(([key]) => csvEscape(flattenValue(row[key]))).join(','))
  }
  return lines.join('\n')
}

export const buildHtmlTable = (columns, rows, title, subtitle) => {
  const head = columns.map(([, label]) => `<th>${label}</th>`).join('')
  const body = rows.length
    ? rows.map((row) => `<tr>${columns.map(([key]) => `<td>${flattenValue(row[key])}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" style="text-align:center;color:#94a3b8">No data for the selected filters</td></tr>`
  return `<html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px}
      h1{font-size:16px;margin-bottom:4px}
      p.sub{color:#64748b;font-size:11px;margin:0 0 14px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;text-align:left}
      th{background:#f1f5f9}
    </style></head>
    <body><h1>${title}</h1>${subtitle ? `<p class="sub">${subtitle}</p>` : ''}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
}

/** Machine-safe filename fragment describing the exported period. */
export function periodSlug(from, to) {
  if (from || to) return `${from || 'start'}_to_${to || 'today'}`
  return `all-time_asof_${new Date().toISOString().slice(0, 10)}`
}
