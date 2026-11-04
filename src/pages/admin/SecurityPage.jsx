import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAdminActivity, getSecurityEvents, getSecurityEventAnalysis, getErrorLogs,
  exportAdminActivity, exportSecurityEvents, exportErrorLogs,
} from '../../api/security'
import { ApiError } from '../../api/client'

/*
 * Security page — three tabs, each backed by its own collection and endpoint.
 * SECURITY NOTE: identifiers, paths and error messages in these logs can be
 * attacker-controlled text. Everything is rendered as plain React text —
 * never dangerouslySetInnerHTML.
 */

const PAGE_SIZE = 25

const TABS = [
  { id: 'activity', label: 'Admin Activity' },
  { id: 'events', label: 'Security Events' },
  { id: 'errors', label: 'Server Errors' },
]

const EVENT_TYPES = {
  login: { label: 'Successful login', cls: 'bg-success/8 text-success' },
  failed_login: { label: 'Failed login', cls: 'bg-danger/8 text-danger' },
  rate_limited: { label: 'Rate limited', cls: 'bg-warning/8 text-warning' },
  suspicious_request: { label: 'Blocked attack attempt', cls: 'bg-danger/8 text-danger' },
}

const ROLE_OPTIONS = [
  ['STAFF', 'Staff (admin / support)'],
  ['FINANCE', 'Finance'],
  ['ADMANAGER', 'AdManager'],
  ['BUSINESS', 'Business'],
  ['CREATOR', 'Creator'],
  ['USER', 'User'],
]
const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS)

const LEVELS = {
  high: { label: 'High risk', badge: 'bg-danger text-white', soft: 'bg-danger/8 text-danger', dot: 'bg-danger' },
  medium: { label: 'Medium', badge: 'bg-warning text-white', soft: 'bg-warning/8 text-warning', dot: 'bg-warning' },
  low: { label: 'Low', badge: 'bg-info text-white', soft: 'bg-info/8 text-info', dot: 'bg-info' },
  info: { label: 'Normal', badge: 'bg-success text-white', soft: 'bg-success/8 text-success', dot: 'bg-success' },
}

const selectCls = 'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'
const thCls = 'px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap'

const fmtDateTime = (d) => {
  if (!d) return { date: '—', time: '' }
  const dt = new Date(d)
  return {
    date: dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }),
    time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  }
}

const errMessage = (err, fallback) => (err instanceof ApiError ? err.message : fallback)

// Admin-activity pill colour from the action wording (red = destructive,
// green = constructive, grey = anything else). Destructive is tested first
// so "Deactivated" is not caught by "activat".
const DESTRUCTIVE = /delet|remov|reject|deactivat|suspend|disabl|revok|block|ban|pause|cancel/i
const CONSTRUCTIVE = /creat|approv|publish|enabl|activat|resum|reactivat|grant|verif|add|credit|settl/i
const actionCls = (action = '') => {
  if (DESTRUCTIVE.test(action)) return 'bg-danger/8 text-danger'
  if (CONSTRUCTIVE.test(action)) return 'bg-success/8 text-success'
  return 'bg-slate-100 text-slate-600'
}

/* ── Small shared pieces ── */
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const IconChevron = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform ${open ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6" /></svg>

function Pill({ cls, children }) {
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${cls}`}>{children}</span>
}

function IpCell({ ip, city }) {
  return (
    <div>
      <p className="font-mono text-[11px] text-slate-600">{ip || '—'}</p>
      {city && <p className="text-[11px] text-slate-400">{city}</p>}
    </div>
  )
}

function WhenCell({ value }) {
  const { date, time } = fmtDateTime(value)
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{date}</p>
      <p className="text-[11px] text-slate-400 font-mono">{time}</p>
    </div>
  )
}

function StateBox({ children, tone = 'text-slate-400' }) {
  return <div className={`px-4 py-12 text-center text-sm ${tone}`}>{children}</div>
}

function PaginationBar({ meta, onPage, noun }) {
  const page = meta?.page || 1
  const totalPages = meta?.totalPages || 1
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
      <span>{meta?.total ?? 0} {noun}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Prev</button>
        <span className="font-semibold text-slate-500">Page {page} of {totalPages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">Next</button>
      </div>
    </div>
  )
}

// Fetches one page of one tab. `params` changing (page/filters) triggers
// exactly one request; late responses from superseded requests are ignored.
function useListData(fetcher, params) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const requestId = useRef(0)
  const paramsKey = JSON.stringify(params)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const data = await fetcher(JSON.parse(paramsKey))
      if (id === requestId.current) setState({ data, loading: false, error: '' })
    } catch (err) {
      if (id === requestId.current) setState({ data: null, loading: false, error: errMessage(err, 'Could not load this tab.') })
    }
  }, [fetcher, paramsKey])

  useEffect(() => {
    (async () => { await load() })()
    const current = requestId
    return () => { current.current += 1 }
  }, [load])

  return state
}

/* ── Tab 1: Admin Activity ── */
function ActivityTab({ page, onPage }) {
  const { data, loading, error } = useListData(getAdminActivity, { page, limit: PAGE_SIZE })
  const entries = data?.entries || []

  return (
    <>
      <div className="bg-brand/5 border border-brand/10 text-slate-600 rounded-xl px-4 py-3 text-xs">
        A record of sensitive admin actions - account changes, content publishing, moderation decisions, financial settlements.
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Admin', 'Action', 'Target', 'Details', 'IP', 'When'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((log) => {
                const change = log.oldValue !== undefined || log.newValue !== undefined
                  ? `${log.oldValue ?? '—'} → ${log.newValue ?? '—'}`
                  : ''
                return (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{log.actorUsername}</p>
                      <p className="text-[11px] text-slate-400">{log.actorRole}</p>
                    </td>
                    <td className="px-3 py-2.5"><Pill cls={actionCls(log.action)}>{log.action}</Pill></td>
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] text-slate-400">{log.module}</p>
                      <p className="text-xs text-slate-700 max-w-[180px] truncate" title={log.targetLabel}>{log.targetLabel || '—'}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-xs text-slate-600 max-w-[220px] truncate" title={change}>{change || '—'}</p>
                    </td>
                    <td className="px-3 py-2.5"><IpCell ip={log.ipAddress} city={log.ipCity} /></td>
                    <td className="px-3 py-2.5"><WhenCell value={log.createdAt} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {loading && <StateBox>Loading…</StateBox>}
        {!loading && error && <StateBox tone="text-danger">{error}</StateBox>}
        {!loading && !error && entries.length === 0 && <StateBox>No admin activity recorded yet</StateBox>}
        <PaginationBar meta={data} onPage={onPage} noun="entries" />
      </div>
    </>
  )
}

/* ── Tab 2: Security Events (+ analysis drawer) ── */
function EventsTab({ page, onPage, filters, onFilters }) {
  const { data, loading, error } = useListData(getSecurityEvents, { page, limit: PAGE_SIZE, type: filters.type, role: filters.role })
  const [selectedId, setSelectedId] = useState(null)
  const events = data?.events || []

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <select aria-label="Filter by role" className={selectCls} value={filters.role} onChange={(e) => onFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Filter by event type" className={selectCls} value={filters.type} onChange={(e) => onFilters({ ...filters, type: e.target.value })}>
          <option value="">All events</option>
          {Object.entries(EVENT_TYPES).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>{['Event', 'Role', 'Identifier', 'Path', 'IP', 'When'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => {
                const type = EVENT_TYPES[ev.type] || { label: ev.type, cls: 'bg-slate-100 text-slate-600' }
                return (
                  <tr
                    key={ev._id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open analysis: ${type.label}`}
                    onClick={() => setSelectedId(ev._id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(ev._id) } }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30"
                  >
                    <td className="px-3 py-2.5"><Pill cls={type.cls}>{type.label}</Pill></td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{ROLE_LABELS[ev.role] || '—'}</td>
                    <td className="px-3 py-2.5"><p className="text-xs text-slate-800 max-w-[200px] truncate" title={ev.identifier || ''}>{ev.identifier || '—'}</p></td>
                    <td className="px-3 py-2.5"><p className="font-mono text-[11px] text-slate-500 max-w-[220px] truncate" title={ev.path || ''}>{ev.path || '—'}</p></td>
                    <td className="px-3 py-2.5"><IpCell ip={ev.ip} city={ev.ipCity} /></td>
                    <td className="px-3 py-2.5"><WhenCell value={ev.createdAt} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {loading && <StateBox>Loading…</StateBox>}
        {!loading && error && <StateBox tone="text-danger">{error}</StateBox>}
        {!loading && !error && events.length === 0 && <StateBox>No security events match your filters</StateBox>}
        <PaginationBar meta={data} onPage={onPage} noun="events" />
      </div>

      {selectedId && <AnalysisDrawer key={selectedId} eventId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </section>
  )
}

function Fact({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-800 font-semibold text-right break-all">{children}</span>
    </div>
  )
}

function AnalysisDrawer({ eventId, onClose }) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  useEffect(() => {
    let cancelled = false
    getSecurityEventAnalysis(eventId)
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: '' }) })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: errMessage(err, 'Could not load the analysis.') }) })
    return () => { cancelled = true }
  }, [eventId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data, loading, error } = state
  const analysis = data?.analysis
  const event = data?.event
  const level = LEVELS[analysis?.level] || LEVELS.info
  const ip = analysis?.ipActivity
  const who = analysis?.identifierActivity
  const type = EVENT_TYPES[event?.type]

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Security event analysis">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <aside className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Is this an attack?</p>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        {loading && <StateBox>Analysing…</StateBox>}
        {error && <StateBox tone="text-danger">{error}</StateBox>}

        {analysis && (
          <>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl text-sm font-black ${level.badge}`}>{level.label}</span>
              <h2 className="text-base font-black text-slate-800 leading-tight">{analysis.title}</h2>
            </div>

            <Section title="Event">
              <div className="rounded-xl border border-slate-100 px-3 py-1 divide-y divide-slate-100">
                <Fact label="Type">{type?.label || event.type}</Fact>
                <Fact label="Identifier">{event.identifier || '—'}</Fact>
                <Fact label="Path">{event.path || '—'}</Fact>
                <Fact label="IP">{event.ip || '—'}{event.ipCity ? ` · ${event.ipCity}` : ''}</Fact>
                <Fact label="When">{new Date(event.createdAt).toLocaleString('en-IN')}</Fact>
              </div>
            </Section>

            <Section title="Why">
              <ul className="space-y-2">
                {analysis.reasons.map((r, i) => {
                  const l = LEVELS[r.level] || LEVELS.info
                  return (
                    <li key={i} className={`flex gap-2 rounded-xl px-3 py-2 text-xs ${l.soft}`}>
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${l.dot}`} />
                      <span>{r.text}</span>
                    </li>
                  )
                })}
              </ul>
            </Section>

            <Section title="What to do">
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Section>

            <Section title="Activity from this IP (24 h)">
              <div className="rounded-xl border border-slate-100 px-3 py-1 divide-y divide-slate-100">
                <Fact label="Total events">{ip.total}</Fact>
                <Fact label="By type">
                  {Object.keys(ip.byType).length === 0 ? '—' : Object.entries(ip.byType).map(([t, n]) => `${EVENT_TYPES[t]?.label || t}: ${n}`).join(' · ')}
                </Fact>
                <Fact label="Accounts tried">{ip.accountsTriedCount === 0 ? '—' : `${ip.accountsTriedCount} (${ip.accountsTried.slice(0, 5).join(', ')}${ip.accountsTriedCount > 5 ? ', …' : ''})`}</Fact>
                <Fact label="Top paths">{ip.topPaths.length === 0 ? '—' : ip.topPaths.map((p) => `${p.path} ×${p.count}`).join(', ')}</Fact>
                <Fact label="First seen">{ip.firstSeen ? new Date(ip.firstSeen).toLocaleString('en-IN') : '—'}</Fact>
                <Fact label="Last seen">{ip.lastSeen ? new Date(ip.lastSeen).toLocaleString('en-IN') : '—'}</Fact>
              </div>
            </Section>

            {who && (
              <Section title="Account activity (24 h)">
                <div className="rounded-xl border border-slate-100 px-3 py-1 divide-y divide-slate-100">
                  <Fact label="Failed logins">{who.failedCount}</Fact>
                  <Fact label="Successful logins">{who.successCount}</Fact>
                  <Fact label="Distinct failing IPs">{who.distinctFailedIps}</Fact>
                  <Fact label="Account exists">{who.accountExists === null ? 'Unknown' : who.accountExists ? 'Yes' : 'No'}</Fact>
                  <Fact label="Last successful login">
                    {who.lastSuccess ? `${new Date(who.lastSuccess.at).toLocaleString('en-IN')} · ${who.lastSuccess.ip || '—'}${who.lastSuccess.ipCity ? ` (${who.lastSuccess.ipCity})` : ''}` : '—'}
                  </Fact>
                </div>
              </Section>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

/* ── Tab 3: Server Errors ── */
function ErrorsTab({ page, onPage }) {
  const { data, loading, error } = useListData(getErrorLogs, { page, limit: PAGE_SIZE })
  const [open, setOpen] = useState(() => new Set())
  const errors = data?.errors || []

  const toggle = (id) => setOpen((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {errors.map((e) => {
          const isOpen = open.has(e._id)
          return (
            <li key={e._id}>
              <button
                onClick={() => toggle(e._id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30"
              >
                <Pill cls="bg-danger/8 text-danger">{e.statusCode}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-slate-800 truncate">{e.method} {e.path}</p>
                  <p className="text-xs text-slate-500 truncate" title={e.message || ''}>{e.message || 'No message'}</p>
                </div>
                <div className="hidden sm:block"><IpCell ip={e.ip} city={e.ipCity} /></div>
                <WhenCell value={e.createdAt} />
                <span className="text-slate-400"><IconChevron open={isOpen} /></span>
              </button>
              {isOpen && (
                <pre className="mx-4 mb-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-900 text-slate-100 text-[11px] leading-relaxed p-4">
                  {e.stack || 'No stack trace was captured.'}
                </pre>
              )}
            </li>
          )
        })}
      </ul>
      {loading && <StateBox>Loading…</StateBox>}
      {!loading && error && <StateBox tone="text-danger">{error}</StateBox>}
      {!loading && !error && errors.length === 0 && <StateBox>No server errors recorded</StateBox>}
      <PaginationBar meta={data} onPage={onPage} noun="errors" />
    </div>
  )
}

/* ── Page ── */
export default function SecurityPage() {
  const [tab, setTab] = useState('activity')
  const [pages, setPages] = useState({ activity: 1, events: 1, errors: 1 }) // each tab keeps its own page
  const [eventFilters, setEventFilters] = useState({ type: '', role: '' })
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const setPage = (id) => (n) => setPages((p) => ({ ...p, [id]: Math.max(1, n) }))
  const changeFilters = (next) => {
    setEventFilters(next)
    setPages((p) => ({ ...p, events: 1 })) // a filter change goes back to page 1
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      if (tab === 'activity') await exportAdminActivity()
      else if (tab === 'events') await exportSecurityEvents({ type: eventFilters.type, role: eventFilters.role })
      else await exportErrorLogs()
    } catch (err) {
      setExportError(errMessage(err, 'Could not export. Please try again.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">Security</h1>
          <p className="text-sm text-slate-500 mt-0.5">Who did what, who tried to get in, and what broke.</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90 disabled:opacity-50">
          <IconDownload /> {exporting ? 'Preparing...' : 'Export to Excel'}
        </button>
      </div>

      <div role="tablist" aria-label="Security sections" className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold -mb-px border-b-2 transition-colors ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {exportError && <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">{exportError}</div>}

      {/* Only the open tab is mounted, so only its page is fetched. */}
      {tab === 'activity' && <ActivityTab page={pages.activity} onPage={setPage('activity')} />}
      {tab === 'events' && <EventsTab page={pages.events} onPage={setPage('events')} filters={eventFilters} onFilters={changeFilters} />}
      {tab === 'errors' && <ErrorsTab page={pages.errors} onPage={setPage('errors')} />}
    </div>
  )
}
