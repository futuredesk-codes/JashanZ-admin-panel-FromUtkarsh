import { api } from './client'

/* ── Auth ── */
export const supportLogin = (username, password) =>
  api.post('/support/auth/login', { username, password })

/* ── Dashboard ── */
export const getSupportDashboard = () => api.get('/support/dashboard')

/* ── Tickets ── */
export const listTickets = (params) => api.get('/support/tickets', params)
export const getTicketDetails = (id) => api.get(`/support/tickets/${id}`)
export const assignTicket = (id, agentId) => api.post(`/support/tickets/${id}/assign`, { agentId })
export const addTicketNote = (id, text) => api.post(`/support/tickets/${id}/note`, { text })
export const resolveTicket = (id) => api.post(`/support/tickets/${id}/resolve`)
export const escalateTicket = (id) => api.post(`/support/tickets/${id}/escalate`)

/* ── Raise Ticket (vendor-facing — used by the AdManager portal to raise an
   AD_COMPLAINT; same endpoints Business/Creator/User Settings pages use in
   the website repo) ── */
export const createTicket = (payload) => api.post('/support/ticket/create', payload)
export const getMyTickets = (page = 1, limit = 10, status) =>
  api.get('/support/ticket/my', { page, limit, status })
export const getMyTicket = (ticketId) => api.get(`/support/ticket/${ticketId}`)
