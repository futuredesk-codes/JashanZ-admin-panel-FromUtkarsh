import { api } from './client'

export const getMyNotifications = (page = 1, limit = 20) =>
  api.get('/notification/my', { page, limit })

export const getUnreadCount = () => api.get('/notification/unread-count')

export const markNotificationRead = (notificationId) =>
  api.post('/notification/read', { notificationId })

export const markAllNotificationsRead = () => api.post('/notification/read-all')
