import { api, API_BASE_URL, getStoredAuth } from './client'

export const getCircles = (params) => api.get('/admin/circles', params)

export const createCircle = (payload) => api.post('/admin/circles/create', payload)

export const updateCircle = (id, payload) => api.post(`/admin/circles/${id}/update`, payload)

export const toggleCircle = (id) => api.post(`/admin/circles/${id}/toggle`)

export const deleteCircle = (id) => api.post(`/admin/circles/${id}/delete`)

export const getCircleMediaBlob = async (circleId, index) => {
	const auth = getStoredAuth()
	const response = await fetch(`${API_BASE_URL}/admin/circles/${circleId}/media/${index}`, {
		headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
	})
	if (!response.ok) throw new Error('Could not load image for resizing.')
	return response.blob()
}
