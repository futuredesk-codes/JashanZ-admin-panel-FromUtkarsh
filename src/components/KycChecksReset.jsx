import { useState } from 'react'
import { ApiError } from '../api/client'

// Same limits as the server (util/bankCheck.js, gstCheck.js, panCheck.js MAX_*_CHECKS).
const LIMIT = 5

/* How many paid registration checks (bank / GST / PAN) a vendor has used. With the registration KYC rule on, a
   vendor who used them all is stuck ("contact support"): staff give them back here. */
export default function KycChecksReset({ biz, reset }) {
  const [used, setUsed] = useState({
    Bank: biz.bankCheckAttempts || 0,
    GST: biz.gstCheckAttempts || 0,
    PAN: biz.panCheckAttempts || 0,
  })
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const anyUsed = Object.values(used).some((n) => n > 0)

  const doReset = async () => {
    setBusy(true)
    setNote('')
    try {
      await reset(biz._id)
      setUsed({ Bank: 0, GST: 0, PAN: 0 })
      setNote('Checks reset. The vendor can verify again.')
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : 'Could not reset the checks. Try again.')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Registration verification checks used</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-700">
          {Object.entries(used).map(([name, n], i) => (
            <span key={name} className={n >= LIMIT ? 'font-bold text-danger' : ''}>
              {i > 0 && ' · '}{name} {n}/{LIMIT}
            </span>
          ))}
        </p>
        {confirming ? (
          <span className="flex items-center gap-2">
            <button type="button" onClick={doReset} disabled={busy} className="bg-info text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60">
              {busy ? 'Resetting…' : 'Yes, reset'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="text-xs font-bold text-slate-500 px-2 py-1.5">Cancel</button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!anyUsed}
            title={anyUsed ? 'Each new check costs money (bank checks send ₹1)' : 'No checks used yet'}
            className="bg-info/8 text-info text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-info/15 disabled:opacity-40"
          >
            Reset checks
          </button>
        )}
      </div>
      {note && <p className="text-xs text-slate-500 mt-1.5">{note}</p>}
    </div>
  )
}
