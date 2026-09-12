import { api } from './client'

// token is only required on the first login after a token is issued (fresh
// purchase or renewal) — omit it once login has already succeeded once.
export const admanagerLogin = (username, password, token) =>
  api.post('/admanager/login', { username, password, ...(token ? { token } : {}) })

export const getAdManagerDashboard = () => api.get('/admanager/dashboard')

export const getMyAdManagerAds = () => api.get('/admanager/ads')

export const createAdManagerAd = (payload) => api.post('/admanager/ads/create', payload)

export const pauseAdManagerAd = (adId) => api.post(`/admanager/ads/${adId}/pause`)

export const resumeAdManagerAd = (adId) => api.post(`/admanager/ads/${adId}/resume`)

export const getAdManagerAdAnalytics = (adId) => api.get(`/admanager/ads/${adId}/analytics`)

// No auth — hit once an ad card is actually shown on screen in the User-facing
// Boom feed, not from the AdManager portal itself.
export const trackAdImpression = (adId) => api.post(`/admanager/ads/${adId}/impression`)

export const getAdManagerWallet = () => api.get('/admanager/wallet/me')

export const getAdManagerCoinPacks = () => api.get('/admanager/wallet/packs')

export const createAdManagerRechargeOrder = (packId) =>
  api.post('/admanager/wallet/recharge/create-order', { packId })

/** Payment confirmation is verified server-side against Cashfree, not trusted from the client. */
export const verifyAdManagerRechargePayment = (packId, razorpayOrderId) =>
  api.post('/admanager/wallet/recharge/verify-payment', { packId, razorpayOrderId })

// Buy any coin amount, not limited to the fixed pack catalog above.
export const createAdManagerCustomRechargeOrder = (coins) =>
  api.post('/admanager/wallet/recharge/create-custom-order', { coins })

/** Payment confirmation is verified server-side against Cashfree, not trusted from the client. */
export const verifyAdManagerCustomRechargePayment = (coins, razorpayOrderId) =>
  api.post('/admanager/wallet/recharge/verify-custom-payment', { coins, razorpayOrderId })

export const listAdManagerAccess = (params) => api.get('/admin/admanager-access', params)

export const approveAdManagerAccess = (accessId) =>
  api.post(`/admin/admanager-access/${accessId}/approve`)

export const rejectAdManagerAccess = (accessId, rejectionReason) =>
  api.post(`/admin/admanager-access/${accessId}/reject`, { rejectionReason })

export const revokeAdManagerAccess = (accessId) =>
  api.post(`/admin/admanager-access/${accessId}/revoke`)
