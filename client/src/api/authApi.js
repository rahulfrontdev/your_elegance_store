import { axiosInstance } from './axiosInstance'

export const requestPasswordReset = (email) =>
  axiosInstance.post('/auth/forgot-password', { email: String(email || '').trim().toLowerCase() })

export const resetPasswordWithToken = ({ token, password }) =>
  axiosInstance.post('/auth/reset-password', { token, password })
