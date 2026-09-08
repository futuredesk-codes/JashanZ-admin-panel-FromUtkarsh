import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdManagerAuth } from '../../context/AdManagerAuthContext'
import { Card, AdPhonePreview, inputCls, btnPrimary } from './shared'

export default function PreviewPage() {
  const navigate = useNavigate()
  const { auth } = useAdManagerAuth()
  const vendor = auth?.username || 'salonvala'

  const [d, setD] = useState({ title: 'Book your bridal makeup slot', desc: 'Limited weekend dates — reserve now', media: 'BOOM' })
  const set = (k, v) => setD(s => ({ ...s, [k]: v }))

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admanager/dashboard')} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">Ad Preview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Exactly how customers see your ad in the app</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Tweak the preview">
          <div className="space-y-3">
            <div className="flex gap-2">
              {['BOOM', 'IMAGE'].map(m => (
                <button key={m} onClick={() => set('media', m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${d.media === m ? 'bg-info text-white' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                  {m === 'BOOM' ? 'BOOM Video' : 'Banner'}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Title</label>
              <input className={inputCls} value={d.title} onChange={e => set('title', e.target.value)} maxLength={100} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={d.desc} onChange={e => set('desc', e.target.value)} maxLength={300} />
            </div>
            <button onClick={() => navigate('/admanager/create-ad')} className={btnPrimary}>Use in a new ad</button>
          </div>
        </Card>

        {/* BOOM feed */}
        <Card title="In the BOOM feed" sub="Priority placement · 3-sec scroll-lock">
          <AdPhonePreview title={d.title} desc={d.desc} vendor={vendor} media={d.media} />
        </Card>

        {/* Home banner */}
        <Card title="On the Customer App home banner">
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <div className="h-28 bg-linear-to-r from-info/80 to-info flex items-center px-4">
              <div className="text-white">
                <p className="text-[10px] font-bold opacity-80">Sponsored · {vendor}</p>
                <p className="text-sm font-black leading-tight line-clamp-2">{d.title}</p>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between bg-white">
              <p className="text-[11px] text-slate-400 line-clamp-1">{d.desc}</p>
              <button className="bg-info text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0">Book Now</button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Clickable demo — buttons are inert in preview.</p>
        </Card>
      </div>
    </div>
  )
}
