import axiosInstance from './axiosInstance'

/** Must match axiosInstance baseURL so local dev hits localhost, not production. */
const apiBaseUrl = () =>
  String(
    import.meta.env.VITE_API_BASE_URL ||
      axiosInstance.defaults.baseURL ||
      'http://localhost:8000/api'
  ).replace(/\/+$/, '')

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
async function multipartFormRequest(method, path, formData) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : ''
  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
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
export const adminCreateCategoryUpload = (formData) =>
  formData instanceof FormData
    ? multipartFormRequest('POST', '/categories/create', formData)
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
export const adminCreateProduct = (body) =>
  body instanceof FormData
    ? multipartFormRequest('POST', '/products', body)
    : axiosInstance.post('/products', body)

export const adminUpdateProduct = (id, body) =>
  body instanceof FormData
    ? multipartFormRequest('PUT', `/products/${id}`, body)
    : axiosInstance.put(`/products/${id}`, body)
export const adminDeleteProduct = (id) => axiosInstance.delete(`/products/${id}`)

/** Users (admin) */
export const adminFetchUsers = () => axiosInstance.get('/users')
export const adminUpdateUser = (id, body) => axiosInstance.patch(`/users/${id}`, body)
