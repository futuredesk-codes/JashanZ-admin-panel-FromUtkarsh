// Shared helpers for the Vendor Ledger list + detail pages.

export const fmtMoney = (n) => {
  const v = Number(n || 0)
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

// Commission / EventCommission status, as shown to Finance.
export const STATUS_LABEL = { PENDING: 'Pending', SETTLED: 'Paid', ON_HOLD: 'On hold' }
export const STATUS_STYLES = {
  PENDING: 'bg-warning/10 text-warning',
  SETTLED: 'bg-success/10 text-success',
  ON_HOLD: 'bg-slate-100 text-slate-500',
}

export const PAYMENT_METHOD_LABEL = { BANK_TRANSFER: 'Bank transfer', UPI: 'UPI', CASH: 'Cash', OTHER: 'Other' }

export const selectCls =
  'bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20'

// Share of Earned that is Paid / Pending / On hold, as whole percentages for a stacked bar.
export const splitPercents = ({ earned, paid, pending, onHold }) => {
  if (!earned) return { paid: 0, pending: 0, onHold: 0 }
  const pct = (v) => Math.max(0, Math.round((v / earned) * 100))
  return { paid: pct(paid), pending: pct(pending), onHold: pct(onHold) }
}
