// The GST check of a vendor, shown under their GST number (Admin "Businesses" and Support "Vendor Approvals").
// `profile.gstVerification` is the answer QuickEKYC gave when the vendor pressed Verify; without it nothing was checked.

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

const LOOKS = {
  VERIFIED: { label: 'GST verified', cls: 'bg-success/10 text-success' },
  NOT_ACTIVE: { label: 'GST not active', cls: 'bg-warning/10 text-warning' },
  NOT_FOUND: { label: 'Not found in GST records', cls: 'bg-danger/10 text-danger' },
}

export default function GstCheckStatus({ profile }) {
  const g = profile?.gstVerification
  const look = g && LOOKS[g.state]
  if (!look) {
    return profile?.gstNumber ? (
      <p className="mt-2 text-[11px] text-slate-400">
        <span className="px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600">Not checked</span> Check the certificate by hand.
      </p>
    ) : null
  }
  const rows = [
    ['Legal name', g.legalName],
    ['Trade name', g.tradeName],
    ['Status', g.gstStatus],
    ['Business type', [g.constitution, g.taxpayerType].filter(Boolean).join(' · ')],
    ['Registered on', g.registrationDate],
    ['Cancelled on', g.cancellationDate],
  ].filter(([, v]) => v)
  return (
    <div className="mt-2 space-y-1.5">
      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${look.cls}`}>{look.label}</span>
      {rows.map(([k, v]) => (
        <p key={k} className="text-xs text-slate-600">
          <span className="text-slate-400">{k}:</span> <span className="font-semibold">{v}</span>
        </p>
      ))}
      <p className="text-[11px] text-slate-400">Checked on {fmtDate(g.checkedAt)}. Match the legal name with the business and its documents.</p>
    </div>
  )
}
