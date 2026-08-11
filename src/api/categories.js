import { api } from './client'

export const getCategories = () => api.get('/admin/categories')

export const createCategory = (payload) => api.post('/admin/categories/create', payload)

export const updateCategory = (id, payload) => api.post(`/admin/categories/${id}/update`, payload)

export const toggleCategory = (id) => api.post(`/admin/categories/${id}/toggle`)
