import { api } from './client'

export const login = (username, password) =>
  api.post('/support/auth/login', { username, password })
