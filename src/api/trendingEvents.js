import { api } from './client'

export const getTrendingEvents = (params) => api.get('/admin/trending-events', params)

export const createTrendingEvent = (payload) => api.post('/admin/trending-events/create', payload)

export const updateTrendingEvent = (id, payload) => api.post(`/admin/trending-events/${id}/update`, payload)

export const toggleTrendingEvent = (id) => api.post(`/admin/trending-events/${id}/toggle`)

export const deleteTrendingEvent = (id) => api.post(`/admin/trending-events/${id}/delete`)
