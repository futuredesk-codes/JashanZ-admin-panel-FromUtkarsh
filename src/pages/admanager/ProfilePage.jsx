import { useAdManagerAuth } from '../../context/AdManagerAuthContext'

/* AdManager Portal — Profile (UI ONLY, no API integration yet).
   Vendor details are static placeholders; the Vendor ID / username is the
   login identifier and is shown read-only. */
const MOCK = {
  businessName: 'Salonvala Beauty & Bridal',
  category: 'Makeup Artists',
  email: 'owner@salonvala.example',
  phone: '+91 90000 12345',
  city: 'Jaipur',
  premiumActive: true,
  tokenMasked: 'admanager_6a86…c1105',
  memberSince: '2026-08-27T00:00:00.000Z',
  wallet: { available: 640, referral: 60 },
}

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

function Field({ label, value, note }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800 break-words">{value || '—'}</p>
      {note && <p className="text-[11px] text-slate-400 mt-1">{note}</p>}
    </div>
  )
}

export default function AdManagerProfilePage() {
  const { auth } = useAdManagerAuth()
  const username = auth?.username || 'vendor_id'

  return (
    <div className="space-y-5 pb-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your premium vendor account and AdManager access</p>
      </div>

      {/* Identity */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
        <span className="w-16 h-16 rounded-2xl bg-info/10 text-info flex items-center justify-center text-2xl font-black shrink-0">
          {(MOCK.businessName || username)[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-black text-slate-800 truncate">{MOCK.businessName}</p>
          <p className="text-xs text-slate-400">@{username} · {MOCK.category}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${MOCK.premiumActive ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
              {MOCK.premiumActive ? 'Premium Active' : 'Premium Inactive'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-info/8 text-info">AdManager</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-black text-slate-800 text-sm">Account Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor ID / Username" value={username} note="Used to sign in — can't be changed here." />
          <Field label="Business Name" value={MOCK.businessName} />
          <Field label="Category" value={MOCK.category} />
          <Field label="City" value={MOCK.city} />
          <Field label="Email" value={MOCK.email} />
          <Field label="Phone" value={MOCK.phone} />
          <Field label="Premium Token" value={MOCK.tokenMasked} note="Entered once at login; session stays active until logout." />
          <Field label="Member Since" value={fmtDate(MOCK.memberSince)} />
        </div>
      </div>

      {/* Wallet snapshot */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-black text-slate-800 text-sm mb-3">Coin Wallet</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-info/8 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-info/80 uppercase tracking-wide">Available Coins</p>
            <p className="text-xl font-black text-info">{MOCK.wallet.available}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Referral Coins</p>
            <p className="text-xl font-black text-slate-700">{MOCK.wallet.referral}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">Coins are for ad spend only — non-refundable, no withdrawal to bank.</p>
      </div>

      <p className="text-xs text-slate-400">This screen is a static preview — editing and live data aren't wired up yet.</p>
    </div>
  )
}
