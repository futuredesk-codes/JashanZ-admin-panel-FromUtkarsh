import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'
import { Card, AdPhonePreview, btnPrimary, btnGhost, inputCls } from './shared'
import { createAdManagerAd } from '../../api/admanager'
import { getPublicCategories } from '../../api/categories'
import { getBoomsByProfile } from '../../api/boom'
import { getPresignedUrl } from '../../api/upload'
import { ApiError, uploadToPresignedUrl } from '../../api/client'
import { decodeJwtPayload } from '../../utils/jwt'

const MIN_COINS = 100

export default function CreateAdPage() {
  const navigate = useNavigate()
  const { auth } = useAdManagerAuth()
  const fileRef = useRef(null)
  // LoginPage stores businessId on fresh sessions; decode the token as a
  // fallback so a session from before that change still works here.
  const businessId = auth?.businessId || decodeJwtPayload(auth?.token)?.id

  const [form, setForm] = useState({
    media: 'BOOM',
    boomId: '',
    imageUrl: '',
    title: '',
    description: '',
    categoryIds: [],
    coins: 100,
    city: '',
    scheduleFrom: '',
    scheduleTo: '',
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [categories, setCategories] = useState([])
  const [booms, setBooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const loadOptions = useCallback(async () => {
    if (!businessId) { setLoadingOptions(false); return }
    setLoadingOptions(true)
    try {
      const [cats, boomsData] = await Promise.all([
        getPublicCategories(),
        getBoomsByProfile(businessId, 'Business'),
      ])
      setCategories(cats || [])
      const items = boomsData.items || []
      setBooms(items)
      if (items.length > 0) setForm(f => ({ ...f, boomId: items[0]._id }))
    } catch {
      // Non-fatal — the form still works with categories/booms empty; the
      // submit validation below catches a missing boomId for BOOM ads.
    } finally {
      setLoadingOptions(false)
    }
  }, [businessId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadOptions' own setState calls are the fetch-on-mount trigger, not a derived-render value
    loadOptions()
  }, [loadOptions])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (id) => set('categoryIds', form.categoryIds.includes(id) ? form.categoryIds.filter(x => x !== id) : [...form.categoryIds, id])

  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const { presignedUrl, fileUrl } = await getPresignedUrl(file.name, file.type, 'ads')
      await uploadToPresignedUrl(presignedUrl, file)
      set('imageUrl', fileUrl)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }
  const clearImage = () => set('imageUrl', '')

  const selectedBoom = booms.find(b => b._id === form.boomId)

  const missingReasons = [
    !form.title.trim() && 'a title',
    !form.city.trim() && 'a target city',
    form.media === 'IMAGE' ? !form.imageUrl && 'a banner image' : !form.boomId && 'a BOOM video',
    Number(form.coins) < MIN_COINS && `at least ${MIN_COINS} coins (you entered ${form.coins || 0})`,
  ].filter(Boolean)

  const canSubmit = missingReasons.length === 0 && !uploading && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      await createAdManagerAd({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        mediaType: form.media,
        boomId: form.media === 'BOOM' ? form.boomId : undefined,
        imageUrl: form.media === 'IMAGE' ? form.imageUrl : undefined,
        targetCategories: form.categoryIds,
        targetCity: form.city.trim(),
        coinsSpent: Number(form.coins),
        scheduledFrom: form.scheduleFrom || undefined,
        scheduledTo: form.scheduleTo || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the ad.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2 className="text-lg font-black text-slate-800">Ad submitted for review</h2>
        <p className="text-sm text-slate-500 mt-1.5">Coins have been debited from your wallet. Jashanz's team will review it before it goes live.</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => navigate('/admanager/ad-history')} className={btnPrimary}>View Ad History</button>
          <button onClick={() => navigate('/admanager/dashboard')} className={btnGhost}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admanager/dashboard')} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">Create New Ad</h1>
          <p className="text-sm text-slate-500 mt-0.5">Boost a BOOM video or banner to customers in a city you choose</p>
        </div>
      </div>

      {error && <p className="text-sm text-danger font-semibold bg-danger/5 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Media */}
          <Card title="1 · Media" sub="A BOOM video you already uploaded, or a banner image">
            <div className="flex gap-2 mb-4">
              {['BOOM', 'IMAGE'].map(m => (
                <button key={m} onClick={() => set('media', m)} className={`px-4 py-2 rounded-xl text-sm font-bold ${form.media === m ? 'bg-info text-white' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                  {m === 'BOOM' ? 'BOOM Video' : 'Banner Image'}
                </button>
              ))}
            </div>
            {form.media === 'BOOM' ? (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Select BOOM video</label>
                {loadingOptions ? (
                  <p className="text-sm text-slate-400">Loading your BOOM videos…</p>
                ) : booms.length === 0 ? (
                  <p className="text-sm text-slate-400">You haven't uploaded any BOOM videos yet. Switch to Banner Image, or upload a BOOM first.</p>
                ) : (
                  <select className={inputCls} value={form.boomId} onChange={e => set('boomId', e.target.value)}>
                    {booms.map(b => <option key={b._id} value={b._id}>{b.caption ? b.caption.slice(0, 60) : `BOOM ${b._id.slice(-6)}`}</option>)}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Banner image</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-info/8 text-info rounded-lg px-3 py-2 text-xs font-bold hover:bg-info/15 disabled:opacity-50">
                    {uploading ? 'Uploading…' : 'Choose image'}
                  </button>
                  {form.imageUrl && <button onClick={clearImage} className="text-xs font-bold text-danger hover:underline">Remove</button>}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                </div>
                {form.imageUrl && <img src={form.imageUrl} alt="Banner" className="mt-3 max-h-40 rounded-xl border border-slate-200 object-cover" />}
              </div>
            )}
          </Card>

          {/* Copy */}
          <Card title="2 · Ad Title & Description">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Ad Title</label>
                <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Book your bridal makeup slot" maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="A short line customers will see under the title" maxLength={500} />
              </div>
            </div>
          </Card>

          {/* Targeting */}
          <Card title="3 · Target Customer Categories" sub="Stored for reference — not currently used to filter who sees the ad">
            {loadingOptions ? (
              <p className="text-sm text-slate-400">Loading categories…</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {categories.map(c => (
                  <button key={c._id} onClick={() => toggleCat(c._id)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${form.categoryIds.includes(c._id) ? 'bg-info text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-info/40'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {form.categoryIds.length > 0 && <p className="text-[11px] text-slate-400">{form.categoryIds.length} selected</p>}
          </Card>

          {/* Budget + add-ons */}
          <Card title="4 · Budget & City" sub="Your ad is only shown to customers whose registered city matches this">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Coins to spend <span className="normal-case font-normal text-slate-400">(min {MIN_COINS})</span></label>
                <input
                  type="number"
                  min={MIN_COINS}
                  step={10}
                  className={`${inputCls} ${form.coins !== '' && Number(form.coins) < MIN_COINS ? 'border-danger focus:ring-danger/20' : ''}`}
                  value={form.coins}
                  onChange={e => set('coins', e.target.value)}
                />
                {form.coins !== '' && Number(form.coins) < MIN_COINS ? (
                  <p className="text-[11px] text-danger font-semibold mt-1">Minimum {MIN_COINS} coins are required to run an ad.</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">1 coin = 1 impression shown to a customer</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Target city</label>
                <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Jaipur" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Run from <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                <input type="date" className={inputCls} value={form.scheduleFrom} onChange={e => set('scheduleFrom', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Run until <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                <input type="date" className={inputCls} value={form.scheduleTo} onChange={e => set('scheduleTo', e.target.value)} />
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleSubmit} disabled={!canSubmit} className={btnPrimary}>{submitting ? 'Submitting…' : 'Submit Ad'}</button>
            <button onClick={() => navigate('/admanager/preview')} className={btnGhost}>Open full preview</button>
            {missingReasons.length > 0 && !submitting && (
              <span className="text-xs text-slate-400">
                Missing: {missingReasons.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Live preview */}
        <Card title="Preview" sub="Live — updates as you type">
          <AdPhonePreview title={form.title || 'Your ad title'} desc={form.description} vendor={auth?.username || 'your business'} media={form.media} image={form.imageUrl} video={selectedBoom?.videoUrl} />
          <p className="text-[11px] text-slate-400 text-center mt-3">Appears in the customer's BOOM feed, marked "Sponsored".</p>
        </Card>
      </div>
    </div>
  )
}
