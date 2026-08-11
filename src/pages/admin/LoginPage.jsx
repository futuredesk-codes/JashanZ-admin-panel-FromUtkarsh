import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { ApiError } from '../../api/client'
import { decodeJwtPayload } from '../../utils/jwt'
import { useAdminAuth } from '../../context/AdminAuthContext'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN']

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login: loginAuth } = useAdminAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = username.trim().length >= 3 && password.length >= 1

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)
    try {
      const data = await login(username.trim(), password)
      const payload = decodeJwtPayload(data.token)
      if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
        setError('This account does not have access to the Admin Portal.')
        return
      }
      loginAuth({ token: data.token, username: payload.username, role: payload.role })
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all'

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Left panel */}
      <div className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid bg pattern */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px'}} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
            <svg width="20" height="18" viewBox="0 0 99 90" fill="white">
              <path d="M63 0H76L63.271 15.5L79 22L99 67L88.5 63L57.933 22L2.5 89.5H0L63 0Z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-xl leading-none">Jashanz</p>
            <p className="text-white/40 text-xs mt-0.5">Backoffice System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand/15 border border-brand/25 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            Secure Admin Access
          </div>
          <h2 className="text-white text-4xl font-black leading-tight mb-4">
            Admin Portal<br />
            <span className="text-brand">Control Center</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-xs">
            Authorized access for Jashanz administrators only.
          </p>

          <div className="space-y-3">
            {[
              ['Role-Based Access', 'Granular permissions per admin role'],
              ['Audit Trail', 'All admin actions are logged and monitored'],
              ['Session Management', 'Token-based session with auto-expiry'],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-brand/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3BBDF7" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold leading-none">{title}</p>
                  <p className="text-white/35 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-white/25 text-xs">© 2024 Zealous Virtuoso. Unauthorized access is strictly prohibited.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-l-3xl">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in with your admin username and password</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Username</label>
              <input
                autoFocus
                placeholder="Enter admin username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                  className={INPUT + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger font-semibold">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-3 rounded-xl bg-linear-to-r from-brand to-brand-dark text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand/25 active:scale-[0.99]"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0110 10" opacity=".75"/></svg>
                    Signing in...
                  </span>
                : 'Sign In'
              }
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            This is a secure admin area. Unauthorized access attempts are monitored.
          </p>
        </div>
      </div>
    </div>
  )
}
