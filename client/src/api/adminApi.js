import axiosInstance from './axiosInstance'
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

/**
 * Multer routes: use `fetch` + FormData without setting Content-Type so the browser sets
 * the multipart boundary. Axios default JSON Content-Type often breaks Multer.
 */
async function multipartFormRequest(method, path, formData, { onProgress } = {}) {
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
            const err = new Error(typeof parsed.message === 'string' ? parsed.message : 'Save failed')
            err.response = { status: xhr.status, data: parsed }
            reject(err)
            return
          }
          resolve(parsed)
          return
        }
        const err = new Error(
          typeof parsed?.message === 'string'
            ? parsed.message
            : typeof parsed?.error === 'string'
              ? parsed.error
              : xhr.statusText || 'Request failed'
        )
        err.response = { status: xhr.status, data: parsed }
        reject(err)
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
    const err = new Error(
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : res.statusText || 'Request failed'
    )
    err.response = { status: res.status, data }
    throw err
  }
  if (data && data.success === false) {
    const err = new Error(typeof data.message === 'string' ? data.message : 'Save failed')
    err.response = { status: res.status, data }
    throw err
  }
  return { data, status: res.status }
}

/**
 * Align these paths with your Express routes. Common patterns:
 * - /categories, /products, /users with admin-only middleware
 * - or /admin/categories, etc.
 */

/** Categories — POST multipart (same Multer / Content-Type constraints as products) */
export const adminCreateCategoryUpload = (formData, options) =>
  formData instanceof FormData
    ? multipartFormRequest('POST', '/categories/create', formData, options)
    : axiosInstance.post('/categories/create', formData)
export const adminFetchCategoryTree = (options = {}) =>
  axiosInstance.get('/categories/tree', { params: options })
export const adminFetchRootCategories = (options = {}) =>
  axiosInstance.get('/categories/getRoot', { params: options })
export const adminFetchCategoryChildren = (id, options = {}) =>
  axiosInstance.get(`/categories/${id}/children`, { params: options })
export const adminUpdateCategory = (id, body) => axiosInstance.put(`/categories/${id}`, body)
export const adminDeleteCategory = (id) => axiosInstance.delete(`/categories/${id}`)
export const adminToggleCategoryStatus = (id) => axiosInstance.patch(`/categories/${id}/toggle-status`)
export const adminEnableCategoryTree = (id) => axiosInstance.patch(`/categories/${id}/enable-tree`)
export const adminDisableCategoryTree = (id) => axiosInstance.patch(`/categories/${id}/disable-tree`)

/** Products */
export const adminFetchProducts = () => axiosInstance.get('/products')
export const adminFetchProductById = (id) => axiosInstance.get(`/products/${id}`)
export const adminFetchProductGstRates = () => axiosInstance.get('/products/gst-rates')
/** POST /products — multipart FormData; admin Bearer JWT (see multipartFormRequest). */
export const adminCreateProduct = (body, options) =>
  body instanceof FormData
    ? multipartFormRequest('POST', '/products', body, options)
    : axiosInstance.post('/products', body)

export const adminUpdateProduct = (id, body, options) =>
  body instanceof FormData
    ? multipartFormRequest('PUT', `/products/${id}`, body, options)
    : axiosInstance.put(`/products/${id}`, body)
export const adminDeleteProduct = (id) => axiosInstance.delete(`/products/${id}`)

/** Users / customers (admin) */
export const adminFetchUsers = (params = {}) =>
  axiosInstance.get('/users', { params })
export const adminFetchUserById = (id) => axiosInstance.get(`/users/${id}`)
export const adminUpdateUser = (id, body) => axiosInstance.patch(`/users/${id}`, body)

/** Reviews moderation (admin) */
export const adminFetchReviews = (params = {}) =>
  axiosInstance.get('/reviews', { params })
export const adminModerateReview = (productId, reviewId, body) =>
  axiosInstance.patch(`/reviews/${productId}/${reviewId}`, body)
