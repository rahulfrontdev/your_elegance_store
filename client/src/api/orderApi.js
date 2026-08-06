import axiosInstance from './axiosInstance'

export const createOrderRequest = (body) => axiosInstance.post('/orders', body)

export const verifyOrderPaymentRequest = (body) =>
  axiosInstance.post('/orders/verify-payment', body)

export const getMyOrderByIdRequest = (orderId) => axiosInstance.get(`/orders/my/${orderId}`)

export const getUserOrdersRequest = (userId, params = {}) =>
  axiosInstance.get(`/orders/user/${userId}`, { params })

export const cancelOrderRequest = (orderId, body) =>
  axiosInstance.patch(`/orders/${orderId}/cancel`, body)

/** Admin-only: GET /orders/admin/all?page&limit&paymentStatus&orderStatus&q */
export const getAdminAllOrdersRequest = (params = {}) =>
  axiosInstance.get('/orders/admin/all', { params })

export const updateAdminOrderStatusRequest = (orderId, body) =>
  axiosInstance.patch(`/orders/admin/${orderId}/status`, body)

export const submitOrderReviewRequest = (orderId, body) =>
  axiosInstance.post(`/orders/${orderId}/review`, body)

