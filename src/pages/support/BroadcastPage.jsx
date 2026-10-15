import { useState, useEffect, useCallback } from 'react'
import { sendBroadcast, getBroadcastHistory } from '../../api/support'
import { getPresignedUrl } from '../../api/upload'
import { ApiError, uploadToPresignedUrl } from '../../api/client'
import { usePermissions } from '../../context/PermissionsContext'

const TABS = [
  { id: 'USER', label: 'User', appName: 'Jashanz', dark: false },
  { id: 'BUSINESS', label: 'Business', appName: 'Jashanz Business', dark: true },
  { id: 'CREATOR', label: 'Creator', appName: 'Jashanz Creator', dark: true },
]

const TITLE_MAX = 100
const BODY_MAX = 500
const BUTTON_LABEL_MAX = 20

const PICSUM = (seed) => `https://picsum.photos/seed/${seed}/1024/512`

// Pre-written samples staff can one-click fill, same idea as the client's
// mockup — not live data, just starting points for a common broadcast.
const SAMPLES = {
  USER: [
    { title: 'Weekend sale', body: 'Book any service this weekend and save 30%. Offer ends Sunday midnight.', seed: 'jashanz-user-sale', button: 'Book now' },
    { title: 'Your order is on the way', body: 'Your order has been picked up and will arrive soon.', seed: 'jashanz-user-order', button: 'Track order' },
    { title: '₹100 added to your wallet', body: 'Cashback from your last booking has been credited. Use it on your next order.', seed: 'jashanz-user-wallet', button: 'View wallet' },
  ],
  BUSINESS: [
    { title: 'New order received', body: 'You have a new order. Accept it within 5 minutes.', seed: 'jashanz-biz-order', button: 'View order' },
    { title: 'Payout processed', body: 'Your latest payout has been sent to your bank account.', seed: 'jashanz-biz-payout', button: 'View payout' },
    { title: 'Complete your KYC', body: 'Upload your remaining documents to keep receiving orders.', seed: 'jashanz-biz-kyc', button: 'Complete now' },
  ],
  CREATOR: [
    { title: 'New campaign for you', body: 'A brand wants to work with you. Review the brief and apply by Friday.', seed: 'jashanz-creator-campaign', button: 'View campaign' },
    { title: 'Earnings update', body: 'You earned a payout this week. It will be processed on Monday.', seed: 'jashanz-creator-earnings', button: 'View earnings' },
    { title: 'Complete your profile', body: 'Creators with full profiles get more campaign invites.', seed: 'jashanz-creator-profile', button: 'Edit profile' },
  ],
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function PhonePreview({ platform, dark, appName, title, body, imageUrl, buttonLabel }) {
  const bodyText = body || 'Your message will appear here.'
  const titleText = title || 'Notification title'
  if (platform === 'ios') {
    return (
      <div
        className="rounded-[22px] p-3.5 grid grid-cols-[38px_1fr] gap-2.5 shadow-xl backdrop-blur"
        style={{ background: dark ? '#1c1c1ee6' : '#ffffffee', color: dark ? '#fff' : '#0f172a' }}
      >
        <div className="w-[38px] h-[38px] rounded-[9px] grid place-items-center text-[16px] font-extrabold shrink-0" style={{ background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff' }}>J</div>
        <div className="min-w-0">
          <div className="flex items-center justify-between text-[12px]" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
            <b style={{ color: dark ? '#fff' : '#0f172a' }}>{appName}</b>
            <span>now</span>
          </div>
          <h4 className="text-[15px] font-semibold line-clamp-3">{titleText}</h4>
          <p className="text-[14px] leading-tight line-clamp-3" style={{ color: dark ? '#d4d4d8' : '#475569' }}>{bodyText}</p>
        </div>
        {imageUrl && <img src={imageUrl} alt="" className="col-span-2 rounded-xl mt-1 aspect-[2/1] object-contain bg-black/5" />}
        {buttonLabel && (
          <span
            className="col-span-2 mt-1 px-4 py-2 rounded-full text-[13px] font-bold w-max max-w-full"
            style={{ background: dark ? '#fff' : '#0ea5e9', color: dark ? '#000' : '#fff' }}
          >
            {buttonLabel}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="rounded-[22px] p-3.5 shadow-xl" style={{ background: dark ? '#161616' : '#fff', color: dark ? '#fff' : '#0f172a', fontFamily: 'Roboto, Arial, sans-serif' }}>
      <div className="flex items-center gap-2 text-[12px] mb-2" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
        <span className="w-5 h-5 rounded-[6px] grid place-items-center text-[11px] font-extrabold" style={{ background: '#0ea5e9', color: '#fff' }}>J</span>
        <span>{appName}</span> · now
      </div>
      <h4 className="text-[15px] font-semibold mb-0.5 line-clamp-3">{titleText}</h4>
      <p className="text-[14px] leading-snug line-clamp-3" style={{ color: dark ? '#d4d4d8' : '#475569' }}>{bodyText}</p>
      {imageUrl && <img src={imageUrl} alt="" className="rounded-xl mt-2.5 aspect-[2/1] object-contain bg-black/5 w-full" />}
      {buttonLabel && (
        <span
          className="inline-block mt-2.5 px-4 py-2 rounded-full text-[13px] font-bold"
          style={{ background: dark ? '#fff' : '#0ea5e9', color: dark ? '#000' : '#fff' }}
        >
          {buttonLabel}
        </span>
      )}
    </div>
  )
}

export default function BroadcastPage() {
  const { can } = usePermissions()
  const canSend = can('supportBroadcast', 'FULL')

  const [tab, setTab] = useState('USER')
  const [platform, setPlatform] = useState('android')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [buttonLabel, setButtonLabel] = useState('')
  const [buttonLink, setButtonLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState('')
  const [buttonError, setButtonError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    setHistoryError('')
    getBroadcastHistory({ audience: tab, limit: 20 })
      .then(data => setHistory(data.items || []))
      .catch(err => setHistoryError(err instanceof ApiError ? err.message : 'Could not load broadcast history.'))
      .finally(() => setHistoryLoading(false))
  }, [tab])

  useEffect(() => { (async () => { loadHistory() })() }, [loadHistory])

  const resetForm = () => {
    setTitle(''); setBody(''); setImageUrl(''); setImageUrlInput('')
    setButtonLabel(''); setButtonLink('')
  }

  const switchTab = (id) => {
    setTab(id)
    setSuccessMsg('')
    setError('')
    resetForm()
  }

  const applySample = (sample) => {
    setTitle(sample.title)
    setBody(sample.body)
    setImageUrl(PICSUM(sample.seed))
    setImageUrlInput(PICSUM(sample.seed))
    setButtonLabel(sample.button)
    setButtonLink('https://jashanz.com/open')
    setError(''); setImageError(''); setButtonError('')
  }

  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/image\/(png|jpeg|jpg)/.test(file.type)) return setImageError('Use a JPG or PNG image.')
    if (file.size > 2 * 1024 * 1024) return setImageError('Poster is over 2 MB. Choose a smaller file.')
    setImageError('')
    setUploading(true)
    try {
      const { presignedUrl, fileUrl } = await getPresignedUrl(file.name, file.type, 'broadcasts')
      await uploadToPresignedUrl(presignedUrl, file)
      setImageUrl(fileUrl)
      setImageUrlInput(fileUrl)
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  const applyImageUrl = (v) => {
    setImageUrlInput(v)
    const trimmed = v.trim()
    if (!trimmed) { setImageUrl(''); setImageError(''); return }
    if (!/^https:\/\/\S+$/.test(trimmed)) { setImageError('Use a public https image link.'); return }
    setImageError('')
    setImageUrl(trimmed)
  }

  const clearImage = () => { setImageUrl(''); setImageUrlInput(''); setImageError('') }

  const handleSendClick = (e) => {
    e.preventDefault()
    let ok = true
    if (!title.trim() || !body.trim()) { setError('Enter both a title and a message.'); ok = false }
    else setError('')
    const hasButton = buttonLabel.trim() || buttonLink.trim()
    if (hasButton && !/^https:\/\/\S+$/.test(buttonLink.trim())) {
      setButtonError('Enter a public https link for the button.')
      ok = false
    } else {
      setButtonError('')
    }
    if (!ok) return
    setConfirming(true)
  }

  const confirmSend = async () => {
    setSending(true)
    setError('')
    try {
      const extra = {}
      if (imageUrl) extra.imageUrl = imageUrl
      if (buttonLabel.trim() && buttonLink.trim()) {
        extra.buttonLabel = buttonLabel.trim()
        extra.buttonLink = buttonLink.trim()
      }
      const data = await sendBroadcast(tab, title.trim(), body.trim(), extra)
      setSuccessMsg(`Sent to ${data.sent} device${data.sent === 1 ? '' : 's'}${data.errors ? ` (${data.errors} failed)` : ''}.`)
      resetForm()
      setConfirming(false)
      loadHistory()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send broadcast.')
      setConfirming(false)
    } finally {
      setSending(false)
    }
  }

  const active = TABS.find(t => t.id === tab)
  const activeLabel = active.label

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Push Notifications</h1>
        <p className="text-sm text-slate-500 mt-0.5">Send a push notification to every User, Business, or Creator with the app installed.</p>
      </div>

      {/* Audience tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-5 items-start">
        {/* Compose form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-black text-slate-800 text-sm">Send to all {activeLabel}s</h3>

          {!canSend ? (
            <p className="text-xs text-slate-400">Sending broadcasts needs full access on this page — ask a Support Lead.</p>
          ) : (
            <form onSubmit={handleSendClick} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Title</label>
                <input
                  required
                  maxLength={TITLE_MAX}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="e.g. App maintenance tonight"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setError('') }}
                />
                <p className="text-[11px] text-slate-400 mt-1 text-right">{title.length}/{TITLE_MAX}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Message</label>
                <textarea
                  required
                  rows={4}
                  maxLength={BODY_MAX}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20 resize-none"
                  placeholder="What do you want to tell them?"
                  value={body}
                  onChange={e => { setBody(e.target.value); setError('') }}
                />
                <p className="text-[11px] text-slate-400 mt-1 text-right">{body.length}/{BODY_MAX}</p>
              </div>

              {/* Poster image */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Poster <span className="normal-case tracking-normal font-normal text-slate-400">Optional · 1024 × 512 px, JPG or PNG, max 2 MB</span>
                </label>
                <label
                  className={`relative flex items-center justify-center min-h-[120px] rounded-xl border-2 border-dashed cursor-pointer text-sm text-slate-400 bg-slate-50 overflow-hidden ${imageError ? 'border-danger' : 'border-slate-300 hover:border-brand'}`}
                >
                  {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={pickImage} disabled={uploading} />
                  {uploading ? 'Uploading…' : imageUrl ? (
                    <button type="button" onClick={(e) => { e.preventDefault(); clearImage() }} className="absolute top-2.5 right-2.5 bg-black/60 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold z-10">Remove</button>
                  ) : (
                    <span>Drag a poster here or <b className="text-brand">browse files</b></span>
                  )}
                </label>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5 mt-3">Or paste an image URL</label>
                <input
                  type="url"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="https://example.com/poster.jpg"
                  value={imageUrlInput}
                  onChange={e => applyImageUrl(e.target.value)}
                />
                {imageError && <p className="text-xs text-danger font-semibold mt-1">{imageError}</p>}

                <p className="text-xs text-slate-400 mt-3 mb-1.5">Sample notifications (fill title, message and poster)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SAMPLES[tab].map((s) => (
                    <button
                      key={s.seed}
                      type="button"
                      onClick={() => applySample(s)}
                      className="h-[68px] rounded-lg border border-slate-200 bg-cover bg-center flex items-end p-2 text-left text-[11px] font-bold text-white"
                      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.65)), url("${PICSUM(s.seed)}")` }}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Button label <span className="normal-case tracking-normal font-normal text-slate-400">Optional</span>
                  </label>
                  <input
                    maxLength={BUTTON_LABEL_MAX}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="e.g. Shop now"
                    value={buttonLabel}
                    onChange={e => { setButtonLabel(e.target.value); setButtonError('') }}
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-right">{buttonLabel.length}/{BUTTON_LABEL_MAX}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Button link <span className="normal-case tracking-normal font-normal text-slate-400">Optional</span>
                  </label>
                  <input
                    type="url"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="https://jashanz.com/offers"
                    value={buttonLink}
                    onChange={e => { setButtonLink(e.target.value); setButtonError('') }}
                  />
                </div>
              </div>
              {buttonError && <p className="text-xs text-danger font-semibold">{buttonError}</p>}

              {error && <p className="text-sm text-danger font-semibold">{error}</p>}
              {successMsg && <p className="text-sm text-success font-semibold">{successMsg}</p>}

              <button
                type="submit"
                disabled={sending || uploading}
                className="bg-brand text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-50"
              >
                Send to all {activeLabel}s
              </button>
            </form>
          )}
        </div>

        {/* Live preview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-black text-slate-800 text-sm mb-4">Live preview</h3>
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            {['android', 'ios'].map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors ${platform === p ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div
            className="rounded-2xl p-6 min-h-[280px] flex items-center justify-center"
            style={{ background: active.dark ? 'linear-gradient(160deg,#27272a,#050505)' : 'linear-gradient(160deg,#7dd3fc,#e0f2fe)' }}
          >
            <div className="w-full max-w-[320px]">
              <PhonePreview
                platform={platform}
                dark={active.dark}
                appName={active.appName}
                title={title}
                body={body}
                imageUrl={imageUrl}
                buttonLabel={buttonLabel}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            {active.id === 'USER' ? 'User app theme: sky blue and white' : `${active.label} app theme: black`}
          </p>
        </div>
      </div>

      {/* Confirm-before-send dialog — a broadcast reaches every device in the
          audience at once and can't be recalled, so this step exists to
          catch a mistaken send before it goes out. */}
      {confirming && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && !sending && setConfirming(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800">Send this to every {activeLabel}?</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-400">This will push to every {activeLabel.toLowerCase()} account with the app installed, right now. This can't be undone.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{body}</p>
                {imageUrl && <img src={imageUrl} alt="" className="rounded-lg mt-2 aspect-[2/1] object-contain bg-black/5 w-full" />}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={sending}
                  className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSend}
                  disabled={sending}
                  className="flex-1 bg-brand text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recent {activeLabel} Broadcasts</p>
        </div>
        {historyError && <p className="text-sm text-danger font-semibold px-5 py-3">{historyError}</p>}
        {historyLoading ? (
          <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No broadcasts sent to {activeLabel.toLowerCase()}s yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100">
                <tr>
                  {['Poster', 'Title', 'Sent', 'Delivered'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(h => (
                  <tr key={h._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      {h.imageUrl ? (
                        <span className="block w-16 h-9 rounded-md bg-slate-100 overflow-hidden">
                          <img src={h.imageUrl} alt="" className="w-full h-full object-contain" />
                        </span>
                      ) : (
                        <span className="block w-16 h-9 rounded-md bg-slate-100" />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-800 truncate max-w-xs">{h.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 max-w-xs">{h.body}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {h.sentByUsername}<br />{formatDateTime(h.createdAt)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 font-bold text-xs rounded-full px-2.5 py-1">{h.recipientCount}/{h.totalInAudience}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
