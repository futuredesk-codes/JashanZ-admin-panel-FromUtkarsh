import { api } from './client'

export const getPlatformAnalytics = () => api.get('/admin/analytics')
