import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supportLogin } from '../../api/support'
import { ApiError } from '../../api/client'
import { decodeJwtPayload } from '../../utils/jwt'
import { useSupportAuth } from '../../context/SupportAuthContext'

const ALLOWED_ROLES = ['SUPPORT_LEAD', 'SUPPORT_AGENT', 'SUPER_ADMIN', 'ADMIN']

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'

export default function SupportLoginPage() {
  const navigate = useNavigate()
  const { login: loginAuth } = useSupportAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const canSubmit = form.username.trim().length >= 3 && form.password.length >= 1

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)
    try {
      const data = await supportLogin(form.username.trim(), form.password)
      const payload = decodeJwtPayload(data.token)
      if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
        setError('This account does not have access to the Support Portal.')
        return
      }
      loginAuth({ token: data.token, username: payload.username, role: payload.role })
      navigate('/support/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

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
              <input
                placeholder="Enter username"
                value={form.username}
                onChange={set('username')}
                onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={set('password')}
                onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                className={INPUT}
              />
            </div>
            {error && <p className="text-sm text-danger font-semibold">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-3 rounded-xl bg-linear-to-r from-brand to-brand-dark text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand/25"
            >
              {loading ? 'Signing in...' : 'Login to Support Portal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
