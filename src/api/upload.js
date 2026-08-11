import { api } from './client'

export const getPresignedUrl = (fileName, fileType, folder = 'general') =>
  api.post('/upload/presigned-url', { fileName, fileType, folder })
