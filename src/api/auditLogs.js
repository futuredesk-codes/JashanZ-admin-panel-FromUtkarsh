import { api } from './client'

export const getAuditLogs = (params) => api.get('/admin/audit-logs', params)
