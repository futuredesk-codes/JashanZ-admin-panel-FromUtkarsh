import { api } from './client'

// Admin's Ad Review endpoints.
export const getAds = (params) => api.get('/admin/ads', params)
export const approveAd = (adId) => api.post(`/admin/ads/${adId}/approve`)
export const rejectAd = (adId, rejectionReason) =>
  api.post(`/admin/ads/${adId}/reject`, { rejectionReason })
export const pauseAd = (adId, reason) =>
  api.post(`/admin/ads/${adId}/pause`, { reason })
export const resumeAd = (adId) => api.post(`/admin/ads/${adId}/resume`)

// Support's Ad Review & Moderation endpoints — same underlying Ad documents
// and the exact same backend handlers as the Admin ones above (see
// supportRouter.js), just reached through Support's own route/permission
// ('supportAds' instead of Admin's SUPER_ADMIN/ADMIN-only gate).
export const getAdsAsSupport = (params) => api.get('/support/ads', params)
export const approveAdAsSupport = (adId) => api.post(`/support/ads/${adId}/approve`)
export const rejectAdAsSupport = (adId, rejectionReason) =>
  api.post(`/support/ads/${adId}/reject`, { rejectionReason })
export const pauseAdAsSupport = (adId, reason) =>
  api.post(`/support/ads/${adId}/pause`, { reason })
export const resumeAdAsSupport = (adId) => api.post(`/support/ads/${adId}/resume`)
