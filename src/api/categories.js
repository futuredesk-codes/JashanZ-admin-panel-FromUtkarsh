import { api } from './client'

export const getCategories = () => api.get('/admin/categories')

// The backend route itself needs no auth, so this works from any portal
// (e.g. AdManager's Create Ad targeting picker) — unlike getCategories above,
// which requires the 'categories' admin page permission.
export const getPublicCategories = () => api.get('/business/categories')

export const createCategory = (payload) => api.post('/admin/categories/create', payload)

export const updateCategory = (id, payload) => api.post(`/admin/categories/${id}/update`, payload)

export const toggleCategory = (id) => api.post(`/admin/categories/${id}/toggle`)

export const deleteCategory = (id) => api.post(`/admin/categories/${id}/delete`)
