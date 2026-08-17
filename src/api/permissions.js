import { api } from './client'

export const getMyPermissions = () => api.get('/admin/permissions/mine')
