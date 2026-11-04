import { api, downloadFile } from './client'

// Admin Activity tab — the platform's audit trail (page permission: 'security')
export const getAdminActivity = (params) => api.get('/admin/audit-log', params)

// Security Events tab — params: { page, limit, type, role }
export const getSecurityEvents = (params) => api.get('/admin/security-events', params)

// Drawer: "Is this an attack?" analysis for a single event
export const getSecurityEventAnalysis = (id) => api.get(`/admin/security-events/${encodeURIComponent(id)}`)

// Server Errors tab
export const getErrorLogs = (params) => api.get('/admin/error-log', params)

// CSV exports — download the whole tab (Security Events keeps its filters)
export const exportAdminActivity = () => downloadFile('/admin/audit-log/export', { fallbackName: 'admin-activity.csv' })
export const exportSecurityEvents = (params) => downloadFile('/admin/security-events/export', { params, fallbackName: 'security-events.csv' })
export const exportErrorLogs = () => downloadFile('/admin/error-log/export', { fallbackName: 'server-errors.csv' })
