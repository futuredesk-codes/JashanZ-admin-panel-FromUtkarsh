import { api } from './client'

export const getBoomsByProfile = (profileId, authorModel, page = 1, limit = 50) =>
  api.get(`/boom/by/${profileId}`, { authorModel, page, limit })
