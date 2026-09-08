import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'
import { Card, AdPhonePreview, CATEGORIES, MOCK_BOOMS, btnPrimary, btnGhost, inputCls } from './shared'

const CITIES = ['Any city', 'Jaipur', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai']

export default function CreateAdPage() {
  const navigate = useNavigate()
  const { auth } = useAdManagerAuth()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    media: 'BOOM',
    boomId: MOCK_BOOMS[0].id,
    imageName: '',
    imageUrl: '',
    title: '',
    description: '',
    categories: [],
    coins: 100,
    city: 'Any city',
    scheduleFrom: '',
    scheduleTo: '',
  })
  const [toast, setToast] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (c) => set('categories', form.categories.includes(c) ? form.categories.filter(x => x !== c) : [...form.categories, c])

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setForm(f => {
      if (f.imageUrl) URL.revokeObjectURL(f.imageUrl)
      return { ...f, imageName: file.name, imageUrl: URL.createObjectURL(file) }
    })
  }
  const clearImage = () => setForm(f => {
    if (f.imageUrl) URL.revokeObjectURL(f.imageUrl)
    return { ...f, imageName: '', imageUrl: '' }
  })

  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2600) }

  const canSubmit = form.title.trim() && form.categories.length > 0 && form.coins >= 100
  const reach = Math.round((Number(form.coins) || 0) * 10)

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admanager/dashboard')} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">Create New Ad</h1>
          <p className="text-sm text-slate-500 mt-0.5">Boost a BOOM video or banner to interested customers</p>
        </div>
      </div>

      {toast && <p className="text-sm text-slate-600 bg-slate-100 rounded-xl px-4 py-2.5">{toast}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Media */}
          <Card title="1 · Media" sub="Video is optional — a BOOM you already uploaded in the app, or a banner image">
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
                <select className={inputCls} value={form.boomId} onChange={e => set('boomId', e.target.value)}>
                  {MOCK_BOOMS.map(b => <option key={b.id} value={b.id}>{b.title} ({b.id})</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Banner image</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => fileRef.current?.click()} className="bg-info/8 text-info rounded-lg px-3 py-2 text-xs font-bold hover:bg-info/15">Choose image</button>
                  <span className="text-xs text-slate-400">{form.imageName || 'No file selected'}</span>
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
                <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="A short line customers will see under the title" maxLength={300} />
              </div>
            </div>
          </Card>

          {/* Targeting */}
          <Card title="3 · Target Customer Categories" sub="Shown only to customers with recent interest in these categories">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => toggleCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${form.categories.includes(c) ? 'bg-info text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-info/40'}`}>
                  {c}
                </button>
              ))}
            </div>
            {form.categories.length > 0 && <p className="text-[11px] text-slate-400">{form.categories.length} selected</p>}
          </Card>

          {/* Budget + add-ons */}
          <Card title="4 · Budget & Schedule">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Coins to spend <span className="normal-case font-normal text-slate-400">(min 100)</span></label>
                <input type="number" min={100} step={10} className={inputCls} value={form.coins} onChange={e => set('coins', e.target.value)} />
                <p className="text-[11px] text-slate-400 mt-1">≈ {reach.toLocaleString('en-IN')} interested customers</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Geo-target <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                <select className={inputCls} value={form.city} onChange={e => set('city', e.target.value)}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
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

          <div className="flex items-center gap-3">
            <button onClick={() => flash('Ad submitted for review — this is a static preview, nothing was sent.')} disabled={!canSubmit} className={btnPrimary}>Submit Ad</button>
            <button onClick={() => navigate('/admanager/preview')} className={btnGhost}>Open full preview</button>
            {!canSubmit && <span className="text-xs text-slate-400">Add a title, at least one category, and 100+ coins</span>}
          </div>
        </div>

        {/* Live preview */}
        <Card title="Preview" sub="Live — updates as you type">
          <AdPhonePreview title={form.title || 'Your ad title'} desc={form.description} vendor={auth?.username || 'your business'} media={form.media} image={form.imageUrl} />
          <p className="text-[11px] text-slate-400 text-center mt-3">Appears in the BOOM feed (priority) and the Customer App home banner. 3-second scroll-lock enforced.</p>
        </Card>
      </div>
    </div>
  )
}
