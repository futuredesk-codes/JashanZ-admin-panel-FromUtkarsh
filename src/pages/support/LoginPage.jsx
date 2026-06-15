import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'

export default function SupportLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      <div className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px'}} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
            <svg width="20" height="18" viewBox="0 0 99 90" fill="white"><path d="M63 0H76L63.271 15.5L79 22L99 67L88.5 63L57.933 22L2.5 89.5H0L63 0Z"/></svg>
          </div>
          <div>
            <p className="text-white font-black text-xl">Jashanz</p>
            <p className="text-white/40 text-xs mt-0.5">Backoffice System</p>
          </div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-success/15 border border-success/25 text-success text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            Support Portal
          </div>
          <h2 className="text-white text-4xl font-black leading-tight mb-4">
            Support<br /><span className="text-success">Team Access</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Dedicated access for the Jashanz support team to manage vendor approvals and customer tickets.
          </p>
        </div>
        <p className="relative z-10 text-white/25 text-xs">© 2024 Zealous Virtuoso.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-l-3xl">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-black text-slate-800 mb-1">Support Login</h2>
          <p className="text-slate-500 text-sm mb-8">Access the support portal</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Username</label>
              <input placeholder="Enter username" value={form.username} onChange={set('username')} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
              <input type="password" placeholder="Enter password" value={form.password} onChange={set('password')} className={INPUT} />
            </div>
            <button
              onClick={() => navigate('/support/dashboard')}
              disabled={!form.username || !form.password}
              className="w-full py-3 rounded-xl bg-linear-to-r from-brand to-brand-dark text-white font-bold text-sm transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-brand/25"
            >
              Login to Support Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
