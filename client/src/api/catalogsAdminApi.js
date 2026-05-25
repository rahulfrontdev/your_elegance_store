import axiosInstance from './axiosInstance'

export const adminListCatalogs = (params = {}) => axiosInstance.get('/catalogs', { params })

export const adminCreateCatalog = (body) => axiosInstance.post('/catalogs', body)

export const adminGetCatalog = (id) => axiosInstance.get(`/catalogs/${id}`)

export const adminUpdateCatalog = (id, body) => axiosInstance.put(`/catalogs/${id}`, body)

export const adminDeleteCatalog = (id) => axiosInstance.delete(`/catalogs/${id}`)
