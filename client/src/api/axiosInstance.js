import axios from 'axios'
import { getApiBaseUrl } from '../config/api.js'

const baseURL = getApiBaseUrl()

export const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Public client: never attaches admin token.
export const publicAxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData && config.headers) {
    const h = config.headers
    if (typeof h.delete === 'function') {
      h.delete('Content-Type')
      h.delete('content-type')
    } else {
      delete h['Content-Type']
      delete h['content-type']
    }
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default axiosInstance
