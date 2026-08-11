import { api } from './client'

export const getCircles = (params) => api.get('/admin/circles', params)

export const createCircle = (payload) => api.post('/admin/circles/create', payload)

export const updateCircle = (id, payload) => api.post(`/admin/circles/${id}/update`, payload)

export const toggleCircle = (id) => api.post(`/admin/circles/${id}/toggle`)

export const deleteCircle = (id) => api.post(`/admin/circles/${id}/delete`)
