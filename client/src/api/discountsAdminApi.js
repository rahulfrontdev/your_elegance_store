import axiosInstance from './axiosInstance'

export const adminListDiscounts = (params = {}) => axiosInstance.get('/discounts', { params })

export const adminCreateDiscount = (body) => axiosInstance.post('/discounts', body)

export const adminGetDiscount = (id) => axiosInstance.get(`/discounts/${id}`)

export const adminUpdateDiscount = (id, body) => axiosInstance.put(`/discounts/${id}`, body)

export const adminPatchDiscount = (id, body) => axiosInstance.patch(`/discounts/${id}`, body)

export const adminDeleteDiscount = (id) => axiosInstance.delete(`/discounts/${id}`)

export const adminGetDiscountAnalytics = (id) => axiosInstance.get(`/discounts/${id}/analytics`)

export const adminPatchDiscountStatus = (id, body) => axiosInstance.patch(`/discounts/${id}/status`, body)
