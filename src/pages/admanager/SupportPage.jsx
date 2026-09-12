import { useState, useEffect, useCallback } from 'react'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'
import { createTicket, getMyTickets } from '../../api/support'
import { ApiError } from '../../api/client'
import { Card, btnPrimary, inputCls } from './shared'

const TYPES = [
  { value: 'AD_COMPLAINT', label: 'Ad Issue / Complaint' },
  { value: 'PAYMENT_ISSUE', label: 'Payment / Coins' },
  { value: 'ACCOUNT', label: 'Account / Access' },
  { value: 'GENERAL', label: 'General' },
]
const TYPE_LABEL = Object.fromEntries(TYPES.map(t => [t.value, t.label]))
const STATUS_STYLES = {
  OPEN: 'bg-info/10 text-info',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  ESCALATED: 'bg-danger/10 text-danger',
}

export default function SupportPage() {
  const { auth } = useAdManagerAuth()
  const [form, setForm] = useState({ type: 'AD_COMPLAINT', subject: '', contact: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')

  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSubmit = form.subject.trim().length >= 3 && form.description.trim().length >= 10

  const loadTickets = useCallback(() => {
    setTicketsLoading(true)
    getMyTickets(1, 20)
      .then(d => setTickets(d.items || []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadTickets' own setState calls are the fetch-on-mount trigger, not a derived-render value
  useEffect(() => { loadTickets() }, [loadTickets])

  const submit = async () => {
    if (!canSubmit) { setError('Add a subject (3+ chars) and a description (10+ chars).'); return }
    setError('')
    setSubmitting(true)
    try {
      const description = form.contact.trim()
        ? `Best contact: ${form.contact.trim()}\n\n${form.description.trim()}`
        : form.description.trim()
      const res = await createTicket({ type: form.type, subject: form.subject.trim(), description })
      setCreated(res?.ticket || null)
      setForm({ type: 'AD_COMPLAINT', subject: '', contact: '', description: '' })
      loadTickets()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Technical Support</h1>
        <p className="text-sm text-slate-500 mt-0.5">Raise a request — the Jashanz Support team will pick it up</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:flex-1 lg:max-w-2xl">
          {created ? (
            <Card>
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p className="font-black text-slate-800">Request submitted</p>
                <p className="text-sm text-slate-500 mt-1">Ticket ID <span className="font-mono font-bold text-slate-800">{String(created._id).slice(-8).toUpperCase()}</span></p>
                <p className="text-xs text-slate-400 mt-1">Support has been notified. Track its status in “My Requests”.</p>
                <button onClick={() => setCreated(null)} className={`${btnPrimary} mt-4`}>Raise another</button>
              </div>
            </Card>
          ) : (
            <Card title="Report an Issue">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Issue Type</label>
                    <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Vendor ID</label>
                    <input className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed`} value={auth?.username || 'vendor_id'} disabled readOnly />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Subject</label>
                  <input className={inputCls} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Briefly, what's wrong?" maxLength={200} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Best contact <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                  <input className={inputCls} value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Email or phone for the reply" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Describe your issue</label>
                  <textarea rows={5} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Include the Ad ID if relevant." maxLength={2000} />
                </div>
                {error && <p className="text-xs text-danger font-semibold">{error}</p>}
                <div className="flex items-center gap-3">
                  <button onClick={submit} disabled={submitting || !canSubmit} className={btnPrimary}>{submitting ? 'Submitting…' : 'Submit to Support'}</button>
                  <span className="text-[11px] text-slate-400">Shows up instantly in the Support portal.</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="w-full lg:flex-1">
          <Card title="My Requests">
            {ticketsLoading ? (
              <p className="text-sm text-slate-400 text-center py-6">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">You haven't raised any requests yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 -m-5">
                {tickets.map(t => (
                  <div key={t._id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{t.subject}</p>
                      <p className="text-[11px] text-slate-400">{TYPE_LABEL[t.type] || t.type} · {new Date(t.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${STATUS_STYLES[t.status] || 'bg-slate-100 text-slate-500'}`}>{String(t.status).replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
