import { api } from './client'

// Coupons for the vendor registration fee. Money is in rupees on both sides (the server stores paise).
// params: { page, limit, search, status: 'active' | 'paused' } -> { coupons, total, page, limit, stats: { total, active } }
export const listCoupons = (params) => api.get('/admin/coupons', params)

export const createCoupon = (payload) => api.post('/admin/coupons/create', payload)

// The code itself can never change.
export const updateCoupon = (id, payload) => api.post(`/admin/coupons/${id}/update`, payload)

// Pause / resume. Takes effect at once.
export const toggleCoupon = (id) => api.post(`/admin/coupons/${id}/toggle`)

// Who used it: { redemptions, total, page, limit }
export const listCouponRedemptions = (id, params) => api.get(`/admin/coupons/${id}/redemptions`, params)
