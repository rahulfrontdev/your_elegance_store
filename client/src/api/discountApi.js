import axiosInstance from './axiosInstance'

/**
 * Optional JWT: axiosInstance attaches Bearer when logged in (per-user rate limits).
 * Body: { items: [{ productId, quantity }], discountCode?: string }
 */
export const validateDiscountRequest = (body) => axiosInstance.post('/discounts/validate', body)

/** Auth-aware preview: attaches Bearer token when logged in, works without token for guests. */
export const calculateDiscountRequest = (body) =>
  axiosInstance.post('/discounts/calculate', body)

/** Preview only; order totals come from POST /orders */
export const applyDiscountPreviewRequest = (body) => axiosInstance.post('/discounts/apply', body)
