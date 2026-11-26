// A vendor's PAN number and its check (Admin "Businesses" and Support "Vendor Approvals"). The name is the one
// QuickEKYC returned for that PAN; without `panVerification` an older, already verified vendor still shows as verified.

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const badge = 'inline-block px-2 py-0.5 rounded-full text-[11px] font-bold'

export default function PanCheckBlock({ profile }) {
  const number = profile?.panNumber
  const check = profile?.panVerification
  // the PAN inside the GST number should be the same one
  const gstPan = profile?.gstNumber?.length === 15 ? profile.gstNumber.toUpperCase().slice(2, 12) : ''
  const differs = Boolean(number && gstPan && gstPan !== number.toUpperCase())

  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">PAN Number</p>
      <p className="text-sm font-bold text-slate-800">{number || 'Not provided'}</p>
      {number && (
        <div className="mt-2 space-y-1.5">
          {profile.isPanVerified ? (
            <span className={`${badge} bg-success/10 text-success`}>PAN verified</span>
          ) : check?.state === 'NOT_FOUND' ? (
            <span className={`${badge} bg-danger/10 text-danger`}>PAN not found</span>
          ) : (
            <span className={`${badge} bg-slate-200 text-slate-600`}>Not checked</span>
          )}
          {profile.isPanVerified && profile.panVerifiedName && (
            <p className="text-xs text-slate-600"><span className="text-slate-400">Name on PAN:</span> <span className="font-semibold">{profile.panVerifiedName}</span></p>
          )}
          {check?.category && <p className="text-xs text-slate-600"><span className="text-slate-400">PAN type:</span> <span className="font-semibold capitalize">{check.category}</span></p>}
          {differs && <p className="text-xs font-semibold text-warning">This PAN is not the one inside the GST number ({gstPan}).</p>}
          {check?.checkedAt && <p className="text-[11px] text-slate-400">Checked on {fmtDate(check.checkedAt)}. Match the name with the business and the PAN card photo.</p>}
        </div>
      )}
    </div>
  )
}
