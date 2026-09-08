import { useState, useEffect } from 'react'
import { ApiError } from '../../api/client'
import { getAllConfig, setConfig, PLATFORM_INFO_KEYS } from '../../api/config'

// Commission rates / booking-type assignment live on the Finance dashboard,
// not here — this page is platform info + admin notification preferences only.
const TABS = ['General', 'Notifications']

/* ── Icons ── */
const IconSettings = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const IconBell = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>

const TAB_ICONS = { General: <IconSettings />, Notifications: <IconBell /> }

/* ── Shared field label ── */
const Label = ({ children }) => (
  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{children}</label>
)

/* ── Input / Select shared class ── */
const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

/* ── Toggle Switch ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex items-center shrink-0 transition-colors duration-200 ${checked ? 'bg-brand justify-end' : 'bg-slate-200 justify-start'}`}
    >
      <div className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm" />
    </button>
  )
}

/* ── Section card ── */
function Card({ title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
      {title && <h3 className="font-black text-slate-800 text-sm mb-0.5">{title}</h3>}
      {desc && <p className="text-xs text-slate-400 mb-4">{desc}</p>}
      {!desc && title && <div className="mb-4" />}
      {children}
    </div>
  )
}

/* ── General Tab ──
   Backed by the generic AdminConfig key/value store (GET/POST /admin/config) —
   the same store Commission rate, free inquiry limit, etc. already use.
   Keys: platformName, supportEmail, supportPhone, websiteUrl. */
const EMPTY_PLATFORM = { platformName: '', supportEmail: '', supportPhone: '', websiteUrl: '' }

function GeneralTab() {
  const [platform, setPlatform] = useState(EMPTY_PLATFORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getAllConfig()
      .then(data => {
        if (cancelled) return
        const byKey = Object.fromEntries((data?.configs || []).map(c => [c.key, c.value]))
        setPlatform({
          platformName: byKey.platformName ?? '',
          supportEmail: byKey.supportEmail ?? '',
          supportPhone: byKey.supportPhone ?? '',
          websiteUrl: byKey.websiteUrl ?? '',
        })
      })
      .catch(err => !cancelled && setError(err instanceof ApiError ? err.message : 'Could not load platform settings.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // One request per key — setConfig upserts a single { key, value } pair.
      await Promise.all(PLATFORM_INFO_KEYS.map(key => setConfig(key, platform[key])))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save platform settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Card title="Platform Information" desc="Basic contact and branding details">
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Platform Name</Label><input className={inputCls} value={platform.platformName} onChange={e => setPlatform(p => ({ ...p, platformName: e.target.value }))} /></div>
            <div><Label>Support Email</Label><input type="email" className={inputCls} value={platform.supportEmail} onChange={e => setPlatform(p => ({ ...p, supportEmail: e.target.value }))} /></div>
            <div><Label>Support Phone</Label><input className={inputCls} value={platform.supportPhone} onChange={e => setPlatform(p => ({ ...p, supportPhone: e.target.value }))} /></div>
            <div><Label>Website URL</Label><input type="url" className={inputCls} value={platform.websiteUrl} onChange={e => setPlatform(p => ({ ...p, websiteUrl: e.target.value }))} /></div>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-danger font-semibold">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={loading || saving} className="bg-brand text-white rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand/90 disabled:opacity-40">
          <IconSave />{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

/* ── Notifications Tab ── */
function NotificationsTab() {
  const [channels, setChannels] = useState([
    { id: 'push',  label: 'Push Notification', desc: 'Mobile and web push alerts',        enabled: true  },
    { id: 'email', label: 'Email',              desc: 'Send alerts to admin email',        enabled: true  },
    { id: 'sms',   label: 'SMS',                desc: 'Text message alerts',               enabled: false },
    { id: 'inapp', label: 'In-App',             desc: 'Alerts inside admin dashboard',     enabled: true  },
  ])
  const [triggers, setTriggers] = useState([
    { id: 'new_vendor',    label: 'New Vendor Registration', desc: 'Alert when a new vendor signs up',           enabled: true  },
    { id: 'large_coin',    label: 'Large Coin Purchase',     desc: 'Alert on coin purchases above ₹10,000',      enabled: true  },
    { id: 'large_booking', label: 'Booking over ₹50,000',   desc: 'Alert on any booking exceeding ₹50,000',     enabled: false },
    { id: 'dispute',       label: 'Vendor Dispute',          desc: 'Alert when a vendor raises a dispute',       enabled: true  },
    { id: 'failed_login',  label: 'Failed Login Attempts',   desc: 'Alert after 3+ failed login attempts',       enabled: true  },
    { id: 'escalated',     label: 'Ticket Escalated',        desc: 'Alert when a ticket is escalated',           enabled: true  },
  ])
  const [saved, setSaved] = useState(false)

  const toggleChannel = id => setChannels(cs => cs.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
  const toggleTrigger = id => setTriggers(ts => ts.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))

  return (
    <div className="space-y-4">
      <Card title="Notification Channels" desc="Choose which channels are used to send admin alerts">
        <div className="space-y-1">
          {channels.map(ch => (
            <div key={ch.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">{ch.label}</p>
                <p className="text-xs text-slate-400">{ch.desc}</p>
              </div>
              <Toggle checked={ch.enabled} onChange={() => toggleChannel(ch.id)} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Admin Alert Triggers" desc="Configure which events send admin notifications">
        <div className="space-y-1">
          {triggers.map(tr => (
            <div key={tr.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-snug">{tr.label}</p>
                <p className="text-xs text-slate-400">{tr.desc}</p>
              </div>
              <Toggle checked={tr.enabled} onChange={() => toggleTrigger(tr.id)} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className="bg-brand text-white rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand/90"
        >
          <IconSave />{saved ? 'Preferences Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('General')

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-800">Admin Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure platform settings and admin notifications</p>
      </div>

      {/* Tab nav — horizontal on mobile, vertical sidebar on lg+ */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
        {/* Tab list */}
        <div className="w-full lg:w-52 lg:shrink-0 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-row lg:flex-col overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 lg:gap-3
                px-3 lg:px-4 py-3 lg:py-3.5 text-sm font-bold whitespace-nowrap transition-colors
                border-b-2 lg:border-b lg:border-l-2 border-r lg:border-r-0 last:border-r-0 lg:last:border-b-0
                ${activeTab === tab
                  ? 'border-brand lg:border-slate-100 lg:border-l-brand bg-brand/8 text-brand'
                  : 'border-transparent lg:border-slate-100 lg:border-l-transparent text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              <span className={activeTab === tab ? 'text-brand' : 'text-slate-400'}>{TAB_ICONS[tab]}</span>
              <span className="hidden xs:inline sm:inline">{tab}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0 w-full">
          {activeTab === 'General'       && <GeneralTab />}
          {activeTab === 'Notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  )
}
