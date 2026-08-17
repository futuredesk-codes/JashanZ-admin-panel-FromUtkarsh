import { api } from './client'

export const listStaff = (roles) => api.get('/admin/staff', roles?.length ? { roles: roles.join(',') } : undefined)

export const createStaff = (payload) => api.post('/admin/staff/create', payload)

export const updateStaff = (id, payload) => api.patch(`/admin/staff/${id}`, payload)

export const toggleStaff = (id) => api.post(`/admin/staff/${id}/toggle`)

export const deleteStaff = (id) => api.delete(`/admin/staff/${id}`)

export const getStaffPermissions = (id) => api.get(`/admin/staff/${id}/permissions`)

export const updateStaffPermissions = (id, permissions) => api.patch(`/admin/staff/${id}/permissions`, { permissions })
