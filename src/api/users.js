import { api } from './client'

export const getUsers = (params) => api.get('/admin/users', params)

export const suspendUser = (id) => api.post(`/admin/users/${id}/suspend`)

export const reactivateUser = (id) => api.post(`/admin/users/${id}/reactivate`)

export const deleteUser = (id) => api.post(`/admin/users/${id}/delete`)

export const getUserBookings = (userId, params) =>
  api.get(`/admin/user/${userId}/bookings`, params)
