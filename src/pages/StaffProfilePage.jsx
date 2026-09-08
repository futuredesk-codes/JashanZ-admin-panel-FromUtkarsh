import { useState, useRef } from 'react'
import { updateMyStaffProfile } from '../api/staff'
import { getPresignedUrl } from '../api/upload'
import { ApiError, uploadToPresignedUrl } from '../api/client'
import { useStaffProfile } from '../context/StaffProfileContext'

const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—')
const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin',
  SUPPORT_LEAD: 'Support Lead', SUPPORT_AGENT: 'Support Agent',
  FINANCE_ADMIN: 'Finance Admin', FINANCE_STAFF: 'Finance Staff',
  CONTENT_MANAGER: 'Content Manager',
}
const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'
const roLabel = (v) => ROLE_LABEL[v] || v

function Avatar({ src, name, size = 'w-20 h-20', text = 'text-2xl' }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken) {
    return <img src={src} alt={name} onError={() => setBroken(true)} className={`${size} rounded-2xl object-cover bg-slate-100 shrink-0`} />
  }
  return (
    <span className={`${size} ${text} rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-black shrink-0`}>
      {(name || '?')[0]?.toUpperCase()}
    </span>
  )
}

/* Keyed by profile.id by the parent, so its initial state is always seeded
   from the freshly-loaded profile — no state-sync effect needed. */
function ProfileForm({ profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    profileImg: profile.profileImg || '',
    password: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    setError(''); setUploading(true)
    try {
      const { presignedUrl, fileUrl } = await getPresignedUrl(file.name, file.type, 'staff')
      await uploadToPresignedUrl(presignedUrl, file)
      set('profileImg', fileUrl)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.')
    } finally {
      setUploading(false)
    }
  }

  const dirty =
    form.name !== (profile.name || '') ||
    form.profileImg !== (profile.profileImg || '') ||
    form.password.length > 0

  const save = async () => {
    if (form.password && form.password.length < 8) { setError('New password must be at least 8 characters.'); return }
    setSaving(true); setError(''); setMsg('')
    try {
      const payload = {}
      if (form.name !== (profile.name || '')) payload.name = form.name
      if (form.profileImg !== (profile.profileImg || '')) payload.profileImg = form.profileImg
      if (form.password) payload.password = form.password
      await updateMyStaffProfile(payload)
      setForm(f => ({ ...f, password: '' }))
      setMsg('Profile updated.')
      setTimeout(() => setMsg(''), 2500)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
        <Avatar src={form.profileImg} name={form.name || profile.username} />
        <div className="min-w-0">
          <p className="text-lg font-black text-slate-800 truncate">{form.name || profile.username}</p>
          <p className="text-xs text-slate-400">@{profile.username}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand/8 text-brand">{roLabel(profile.role)}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${profile.isActive ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>{profile.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Details / edit */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-black text-slate-800 text-sm">Account Details</h3>

        {error && <p className="text-sm text-danger font-semibold">{error}</p>}
        {msg && <p className="text-sm text-success font-semibold">{msg}</p>}

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Profile Photo</label>
          <div className="flex items-center gap-3">
            <Avatar src={form.profileImg} name={form.name || profile.username} size="w-12 h-12" text="text-base" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 bg-brand/8 text-brand rounded-lg px-3 py-2 text-xs font-bold hover:bg-brand/15 disabled:opacity-60">
              {uploading ? 'Uploading…' : form.profileImg ? 'Change' : 'Upload photo'}
            </button>
            {form.profileImg && !uploading && (
              <button type="button" onClick={() => set('profileImg', '')} className="text-xs font-semibold text-slate-400 hover:text-danger">Remove</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Name</label>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Username</label>
          <input className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed`} value={profile.username} disabled readOnly />
          <p className="text-[11px] text-slate-400 mt-1">Used to sign in — it can't be changed here. Ask a Super Admin from Staff Management if it must change.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Role</label>
          <input className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed`} value={roLabel(profile.role)} disabled readOnly />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">New Password</label>
          <input type="password" className={inputCls} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Leave blank to keep current password" minLength={8} />
        </div>

        <p className="text-xs text-slate-400">Member since {fmtDate(profile.createdAt)}</p>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving || uploading || !dirty} className="bg-brand text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-40">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function StaffProfilePage() {
  const { profile, loading, reload } = useStaffProfile()

  return (
    <div className="space-y-5 pb-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your account details and sign-in credentials</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">Loading…</div>
      ) : !profile ? (
        <div className="bg-danger/8 text-danger rounded-xl px-4 py-3 text-sm font-semibold">Could not load your profile.</div>
      ) : (
        <ProfileForm key={profile.id} profile={profile} onSaved={reload} />
      )}
    </div>
  )
}
