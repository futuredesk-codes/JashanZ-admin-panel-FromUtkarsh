import { api } from "./client";

/* ── Auth ── */
export const financeLogin = (username, password) =>
  api.post("/finance/auth/login", { username, password });

/* ── View (read-only, works for FINANCE_ADMIN/FINANCE_STAFF/SUPER_ADMIN) ── */
export const getFinanceDashboard = () => api.get("/finance/dashboard");
/** Rich, filterable finance-portal dashboard. params: { from, to, city, category, granularity } */
export const getFinanceDashboardOverview = (params) =>
  api.get("/finance/dashboard-overview", params);
export const getVendorPayments = (params) =>
  api.get("/finance/vendor-payments", params);
export const getBookingPayments = (params) =>
  api.get("/finance/booking-payments", params);
export const getBookingPaymentDetails = (id) =>
  api.get(`/finance/booking-payments/${id}`);

export const deleteBookingPayment = (id) =>
  api.delete(`/finance/booking-payments/${id}`);
export const getFinancePayouts = (params) =>
  api.get("/finance/settlements", params);
export const getFinanceCommissions = (params) =>
  api.get("/finance/commissions", params);
export const getFinanceCommissionRates = () =>
  api.get("/finance/commission-rates");
export const setFinanceGlobalCommissionRate = (rate) =>
  api.post("/finance/commission-rate/global", { rate });
export const setFinanceVendorCommissionRate = (businessId, rate) =>
  api.post(`/finance/commission-rate/vendor/${businessId}`, { rate });
export const getRefundablePayments = (params) =>
  api.get("/finance/refunds/payments", params);
export const getRefunds = (params) => api.get("/finance/refunds", params);
export const initiateRefund = (payload) =>
  api.post("/finance/refunds", payload);
export const getWalletTransactions = (params) =>
  api.get("/finance/transactions", params);
export const getLeadRecharges = (params) =>
  api.get("/finance/lead-recharges", params);
export const exportFinanceReport = (params) =>
  api.get("/finance/reports/export", params);

export const getPricing = () => api.get("/finance/pricing");
export const updateFee = (key, value) =>
  api.post("/finance/pricing/fee", { key, value });
export const updateSubscriptionPlanPrice = (planId, price) =>
  api.post(`/finance/pricing/subscription-plan/${planId}`, { price });

export const deleteTransaction = (id) =>
  api.delete(`/finance/transactions/${id}`);

/* ── Commissions (view via /admin, edit/delete = SUPER_ADMIN only) ── */
export const getCommissions = (params) => api.get("/admin/commissions", params);
export const updateCommission = (id, status) =>
  api.post(`/admin/commission/${id}/update`, { status });
export const deleteCommission = (id) =>
  api.post(`/admin/commission/${id}/delete`);

export const getSettlements = (params) => api.get("/admin/settlements", params);
export const createSettlement = (businessId) =>
  api.post("/admin/settlement/create", { businessId });
export const markSettlementTransferred = (id, razorpayPayoutId) =>
  api.post(
    `/admin/settlement/${id}/mark-transferred`,
    razorpayPayoutId ? { razorpayPayoutId } : {},
  );
export const deleteSettlement = (id) =>
  api.post(`/admin/settlement/${id}/delete`);

export const setRegistrationPayment = (businessId, isPaid) =>
  api.post(`/admin/business/${businessId}/registration-payment`, { isPaid });

export const creditCoinsToVendor = (businessId, coins, reason) =>
  api.post("/admin/vendor/credit-coins", { businessId, coins, reason });
