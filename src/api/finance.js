import { api } from './client'

/* ── View (read-only, works for FINANCE_ADMIN/FINANCE_STAFF/SUPER_ADMIN) ── */
export const getFinanceDashboard = () => api.get('/finance/dashboard')
export const getVendorPayments = (params) => api.get('/finance/vendor-payments', params)
export const getWalletTransactions = (params) => api.get('/finance/transactions', params)
export const getLeadRecharges = (params) => api.get('/finance/lead-recharges', params)
export const exportFinanceReport = (params) => api.get('/finance/reports/export', params)

/* ── Commissions (view via /admin, edit/delete = SUPER_ADMIN only) ── */
export const getCommissions = (params) => api.get('/admin/commissions', params)
export const updateCommission = (id, status) => api.post(`/admin/commission/${id}/update`, { status })
export const deleteCommission = (id) => api.post(`/admin/commission/${id}/delete`)

/* ── Settlements (view + create/mark-transferred/delete = SUPER_ADMIN only) ── */
export const getSettlements = (params) => api.get('/admin/settlements', params)
export const createSettlement = (businessId) => api.post('/admin/settlement/create', { businessId })
export const markSettlementTransferred = (id, razorpayPayoutId) =>
  api.post(`/admin/settlement/${id}/mark-transferred`, razorpayPayoutId ? { razorpayPayoutId } : {})
export const deleteSettlement = (id) => api.post(`/admin/settlement/${id}/delete`)

/* ── Vendor payments edit (SUPER_ADMIN only) ── */
export const setRegistrationPayment = (businessId, isPaid) =>
  api.post(`/admin/business/${businessId}/registration-payment`, { isPaid })

/* ── Wallet credit (SUPER_ADMIN only) — the ledger-safe way to adjust a vendor's balance ── */
export const creditCoinsToVendor = (businessId, coins, reason) =>
  api.post('/admin/vendor/credit-coins', { businessId, coins, reason })
