import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = ['Username', 'Password', 'Mobile OTP', 'Email OTP']
const OTP_LEN = 6

function OtpBoxes({ value, onChange }) {
  const refs = useRef([])
  const digits = value.split('').concat(Array(OTP_LEN).fill('')).slice(0, OTP_LEN)

  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      const next = [...digits]
      if (digits[i]) { next[i] = ''; onChange(next.join('')) }
      else if (i > 0) { next[i - 1] = ''; onChange(next.join('')); refs.current[i - 1]?.focus() }
    } else if (e.key >= '0' && e.key <= '9') {
      const next = [...digits]
      next[i] = e.key
      onChange(next.join(''))
      if (i < OTP_LEN - 1) refs.current[i + 1]?.focus()
    }
    e.preventDefault()
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    onChange(text.padEnd(OTP_LEN, '').slice(0, OTP_LEN))
    refs.current[Math.min(text.length, OTP_LEN - 1)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          value={d}
          onChange={() => {}}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={() => refs.current[i]?.select()}
          maxLength={1}
          className={`w-12 h-12 rounded-xl border-2 bg-slate-50 text-center text-lg font-bold text-slate-800 outline-none transition-all ${
            d ? 'border-brand text-brand' : 'border-slate-200 focus:border-brand'
          }`}
        />
      ))}
    </div>
  )
}

function Countdown({ seconds, onResend }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
    const id = setInterval(() => setLeft(p => { if (p <= 1) { clearInterval(id); return 0 } return p - 1 }), 1000)
    return () => clearInterval(id)
  }, [seconds])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  if (left > 0) return <span className="text-sm text-slate-500">Resend in <span className="text-brand font-semibold">{mm}:{ss}</span></span>
  return <button onClick={onResend} className="text-sm text-brand font-semibold hover:underline">Resend OTP</button>
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [mobileOtp, setMobileOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const canNext = [
    username.trim().length >= 3,
    password.length >= 6,
    mobileOtp.length === OTP_LEN,
    emailOtp.length === OTP_LEN,
  ][step]

  const handleNext = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (step < 3) setStep(s => s + 1)
      else navigate('/admin/dashboard')
    }, 800)
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
            Multi-factor authenticated access for authorized Jashanz administrators only.
          </p>

          <div className="space-y-3">
            {[
              ['Multi-Factor Authentication', 'Username + Password + Mobile OTP + Email OTP'],
              ['Session Management', 'Auto-timeout with device tracking'],
              ['Audit Trail', 'All admin actions are logged and monitored'],
              ['Role-Based Access', 'Granular permissions per admin role'],
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
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i < step ? 'bg-brand text-white' : i === step ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-slate-100 text-slate-400'
                }`}>
                  {i < step
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-10 rounded-full transition-all ${i < step ? 'bg-brand' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="mb-6">
            {step === 0 && <>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Welcome back</h2>
              <p className="text-slate-500 text-sm">Enter your admin username to continue</p>
            </>}
            {step === 1 && <>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Enter Password</h2>
              <p className="text-slate-500 text-sm">Verify your identity with your password</p>
            </>}
            {step === 2 && <>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Mobile Verification</h2>
              <p className="text-slate-500 text-sm">OTP sent to <span className="font-semibold text-slate-700">+91 98XXX XXXXX</span></p>
            </>}
            {step === 3 && <>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Email Verification</h2>
              <p className="text-slate-500 text-sm">OTP sent to <span className="font-semibold text-slate-700">a****@jashanz.in</span></p>
            </>}
          </div>

          {/* Form */}
          <div className="space-y-4">
            {step === 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Username</label>
                <input
                  autoFocus
                  placeholder="Enter admin username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext && handleNext()}
                  className={INPUT}
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    autoFocus
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canNext && handleNext()}
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
                <button className="text-xs text-brand font-semibold mt-1.5 hover:underline">Forgot password?</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <OtpBoxes value={mobileOtp} onChange={setMobileOtp} />
                <div className="text-center">
                  <Countdown seconds={120} onResend={() => setMobileOtp('')} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <OtpBoxes value={emailOtp} onChange={setEmailOtp} />
                <div className="text-center">
                  <Countdown seconds={120} onResend={() => setEmailOtp('')} />
                </div>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!canNext || loading}
              className="w-full py-3 rounded-xl bg-linear-to-r from-brand to-brand-dark text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand/25 active:scale-[0.99]"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0110 10" opacity=".75"/></svg>
                    Verifying...
                  </span>
                : step === 3 ? 'Complete Login' : 'Continue'
              }
            </button>
          </div>

          {/* Back */}
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mt-4 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
            This is a secure admin area. Unauthorized access attempts are monitored.
          </p>
        </div>
      </div>
    </div>
  )
}
