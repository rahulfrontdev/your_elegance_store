import axiosInstance, { publicAxiosInstance } from './axiosInstance'
import { getApiBaseUrl } from '../config/api.js'

const apiBaseUrl = () => getApiBaseUrl()

async function readJsonBody(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text.slice(0, 300) }
  }
}

async function multipartCarouselRequest(method, path, formData, { onProgress } = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : ''
  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  if (typeof onProgress === 'function' && typeof XMLHttpRequest !== 'undefined') {
    const data = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onload = () => {
        let parsed = {}
        try {
          parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {}
        } catch {
          parsed = { message: xhr.responseText?.slice(0, 300) || xhr.statusText }
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          if (parsed && parsed.success === false) {
            reject(new Error(parsed.message || 'Save failed'))
            return
          }
          resolve(parsed)
          return
        }
        reject(new Error(parsed?.message || parsed?.error || xhr.statusText || 'Upload failed'))
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
    return { data, status: 200 }
  }

  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { method, headers, body: formData })
  const data = await readJsonBody(res)
  if (!res.ok) {
    throw new Error(data?.message || data?.error || res.statusText || 'Upload failed')
  }
  return { data, status: res.status }
}

export const adminFetchAllCarouselSlides = () => axiosInstance.get('/carousel/admin/all')

export const adminFetchCarouselSlideById = (id) => axiosInstance.get(`/carousel/admin/${id}`)

export const adminCreateCarouselSlide = (formData, options) =>
  multipartCarouselRequest('POST', '/carousel', formData, options)

export const adminUpdateCarouselSlide = (id, formData, options) =>
  multipartCarouselRequest('PUT', `/carousel/${id}`, formData, options)

export const adminDeleteCarouselSlide = (id) => axiosInstance.delete(`/carousel/${id}`)

const publicCarouselPath = (import.meta.env.VITE_PUBLIC_CAROUSEL_PATH || 'carousel').replace(/^\/+/, '')

export const fetchPublicCarouselSlides = () => publicAxiosInstance.get(publicCarouselPath)
