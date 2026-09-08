import { useState, useEffect, useCallback } from 'react'
import { getAdManagerDashboard, getMyAdManagerAds } from '../../api/admanager'
import { createTicket } from '../../api/support'
import { ApiError } from '../../api/client'

const STATUS_LABEL = {
  PENDING_REVIEW: 'Pending Review',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  EXHAUSTED: 'Exhausted',
  REJECTED: 'Rejected',
}
const STATUS_STYLES = {
  PENDING_REVIEW: 'bg-warning/10 text-warning',
  ACTIVE: 'bg-success/10 text-success',
  PAUSED: 'bg-info/10 text-info',
  EXHAUSTED: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-danger/10 text-danger',
}

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

/* ── Raise Ticket modal — same AD_COMPLAINT ticket type Business/Creator/User
   Settings pages already raise (shows up correctly on Support's existing
   Ticket Management page), with an optional ad picker so the vendor can
   point Support at a specific ad instead of a generic complaint. ── */
function RaiseTicketModal({ ads, onClose, onCreated }) {
  const [form, setForm] = useState({ subject: '', description: '', adId: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createTicket({
        type: 'AD_COMPLAINT',
        subject: form.subject.trim(),
        description: form.description.trim(),
        adId: form.adId || undefined,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800">Report an Ad Issue</h3>

        {ads.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Related Ad <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <select
              className={`${inputCls} appearance-none cursor-pointer`}
              value={form.adId}
              onChange={e => setForm(f => ({ ...f, adId: e.target.value }))}
            >
              <option value="">Not tied to a specific ad</option>
              {ads.map(ad => <option key={ad._id} value={ad._id}>{ad.title}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Subject</label>
          <input
            type="text"
            placeholder="Briefly describe the issue"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
          <textarea
            rows={4}
            placeholder="Explain what happened..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={`${inputCls} resize-none`}
          />
        </div>

        {error && <p className="text-xs text-danger font-semibold">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdManagerDashboardPage() {
  const [data, setData] = useState(null)
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRaiseTicket, setShowRaiseTicket] = useState(false)
  const [toast, setToast] = useState('')

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashboardData, adsData] = await Promise.all([
        getAdManagerDashboard(),
        getMyAdManagerAds().catch(() => ({ ads: [] })),
      ])
      setData(dashboardData)
      setAds(adsData.ads || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { (async () => { await fetchDashboard() })() }, [fetchDashboard])

  const handleTicketCreated = () => {
    setShowRaiseTicket(false)
    setToast('Ticket submitted — Support will review it shortly.')
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) return <p className="text-sm text-slate-400 text-center py-24">Loading...</p>
  if (error) return <p className="text-sm text-danger font-semibold text-center py-24">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">AdManager Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your promoted ads and ad wallet</p>
        </div>
        <button
          onClick={() => setShowRaiseTicket(true)}
          className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
        >
          Report an Issue
        </button>
      </div>

      {toast && <p className="text-sm text-success font-semibold bg-success/10 rounded-xl px-4 py-2.5">{toast}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Ads', value: data.totalAds, cls: 'text-brand' },
          { label: 'Active Ads', value: data.activeAds, cls: 'text-success' },
          { label: 'Paused Ads', value: data.pausedAds, cls: 'text-warning' },
          { label: 'Available Coins', value: data.availableCoins, cls: 'text-info' },
          { label: 'Referral Coins', value: data.referralCoins, cls: 'text-info' },
          { label: 'Total Impressions', value: data.totalImpressions, cls: 'text-brand' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">My Ads</h2>
        </div>
        {ads.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No ads created yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ads.map(ad => (
              <div key={ad._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-800 truncate">{ad.title}</p>
                  <p className="text-[11px] text-slate-400">{ad.mediaType} &middot; {ad.coinsSpent} coins &middot; {ad.impressions ?? 0} impressions</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${STATUS_STYLES[ad.status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABEL[ad.status] || ad.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRaiseTicket && (
        <RaiseTicketModal
          ads={ads}
          onClose={() => setShowRaiseTicket(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </div>
  )
}
