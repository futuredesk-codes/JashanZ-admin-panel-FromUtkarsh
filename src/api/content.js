import { api } from './client'

/* ── Content Moderation (Booms & Posts) ── */
export const getAllBooms = (params) => api.get('/admin/content/booms', params)
export const getAllPosts = (params) => api.get('/admin/content/posts', params)

export const suspendBoom = (id) => api.post(`/admin/content/boom/${id}/suspend`)
export const suspendPost = (id) => api.post(`/admin/content/post/${id}/suspend`)

export const reactivateBoom = (id) => api.post(`/admin/content/boom/${id}/reactivate`)
export const reactivatePost = (id) => api.post(`/admin/content/post/${id}/reactivate`)

export const removeBoom = (id) => api.post(`/admin/content/boom/${id}/remove`)
export const removePost = (id) => api.post(`/admin/content/post/${id}/remove`)
