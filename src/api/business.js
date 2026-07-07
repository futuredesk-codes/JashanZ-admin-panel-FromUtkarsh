import { api } from './client'

export const getBusinesses = (params) => api.get('/admin/businesses/all', params)

export const verifyBusiness = (businessId, status) =>
  api.post(`/admin/business/${businessId}/verify`, { status })

export const getBusinessBookings = (businessId, params) =>
  api.get(`/admin/business/${businessId}/bookings`, params)

export const getCategories = () => api.get('/business/categories')
