import { api } from './client'

/* ── Auth ── */
export const supportLogin = (username, password) =>
  api.post('/support/auth/login', { username, password })

/* ── Dashboard ── */
export const getSupportDashboard = () => api.get('/support/dashboard')

/* ── Tickets ── */
export const listTickets = (params) => api.get('/support/tickets', params)
export const assignTicket = (id, agentId) => api.post(`/support/tickets/${id}/assign`, { agentId })
export const addTicketNote = (id, text) => api.post(`/support/tickets/${id}/note`, { text })
export const resolveTicket = (id) => api.post(`/support/tickets/${id}/resolve`)
export const escalateTicket = (id) => api.post(`/support/tickets/${id}/escalate`)
