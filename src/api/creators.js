import { api } from './client'

export const getCreators = (params) => api.get('/admin/creators', params)

export const verifyCreator = (creatorId, status) =>
  api.post(`/admin/creator/${creatorId}/verify`, { status })

export const updateCreatorSocialStats = (creatorId, payload) =>
  api.post(`/admin/creator/${creatorId}/social-stats`, payload)
