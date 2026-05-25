/**
 * Normalizes POST /discounts/calculate (and similar) response shapes for UI.
 */

function toNum(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Pick first object that looks like a calculate payload */
function pickCalculateRoot(payload) {
  if (!payload || typeof payload !== 'object') return null
  const candidates = [
    payload?.data?.data,
    payload?.data?.result,
    payload?.data,
    payload?.result,
    payload,
  ].filter((x) => x && typeof x === 'object' && !Array.isArray(x))

  for (const c of candidates) {
    if (
      c.finalPrice != null ||
      c.originalPrice != null ||
      c.discountAmount != null ||
      c.appliedDiscountDetails != null ||
      c.discountDetails != null ||
      Array.isArray(c.lines) ||
      Array.isArray(c.items) ||
      Array.isArray(c.lineItems) ||
      Array.isArray(c.lineBreakdown) ||
      Array.isArray(c.productDiscounts)
    ) {
      return c
    }
  }
  return candidates[0] || null
}

/** Normalize Mongo / API id to a comparable string. */
export function stringifyEntityId(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'object' && raw.$oid != null) return String(raw.$oid)
  return String(raw).trim()
}

/**
 * Cart lines → API order/calculate shape. Drops rows with no product id so the server
 * never receives `{ productId: "" }` (often leads to null product + `.price` crashes).
 */
export function sanitizeOrderItemsForApi(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => ({
      productId: stringifyEntityId(item?.id ?? item?.productId),
      quantity: Math.max(1, Number(item?.qty ?? item?.quantity) || 1),
    }))
    .filter((row) => row.productId.length > 0)
}

export function normalizeDiscountCalculateResponse(responseData) {
  const root = pickCalculateRoot(responseData)
  if (!root) return null

  const details = root.appliedDiscountDetails || root.discountDetails || {}
  const rawLines =
    details.lines ||
    root.lines ||
    details.items ||
    root.items ||
    details.lineItems ||
    root.lineItems ||
    details.lineBreakdown ||
    root.lineBreakdown ||
    details.productDiscounts ||
    root.productDiscounts ||
    details.breakdown ||
    root.breakdown ||
    details.cartItems ||
    root.cartItems ||
    []
  const lines = Array.isArray(rawLines) ? rawLines : []

  return {
    originalPrice: toNum(root.originalPrice ?? root.subtotal ?? root.subTotal),
    discountAmount: toNum(root.discountAmount),
    discountPercentage: toNum(root.discountPercentage),
    finalPrice: toNum(root.finalPrice),
    appliedDiscountDetails: {
      couponCode: details.couponCode ?? root.couponCode ?? '',
      stackingMode: details.stackingMode,
      appliedDiscountIds: details.appliedDiscountIds,
      lines,
    },
  }
}

/** Product id from a calculate line (tolerant of populate / $oid shapes). */
export function lineProductId(line) {
  if (!line || typeof line !== 'object') return ''
  let pid =
    line.productId?._id ??
    line.productId?.id ??
    line.productId ??
    line.product_id ??
    line.itemId?._id ??
    line.itemId?.id ??
    line.itemId ??
    line.product?._id ??
    line.product?.id ??
    line.product
  if (pid && typeof pid === 'object' && pid.$oid != null) pid = pid.$oid
  return stringifyEntityId(pid)
}

export function buildLineMapByProductId(lines) {
  const map = new Map()
  if (!Array.isArray(lines)) return map
  lines.forEach((line) => {
    const id = lineProductId(line)
    if (id) map.set(id, line)
  })
  return map
}

/**
 * Unit price after discount for one catalog unit (qty 1 preview), when possible.
 */
export function lineUnitFinalAfterDiscount(line, qty = 1) {
  if (!line || typeof line !== 'object') return null
  const q = Math.max(1, Number(line.quantity ?? line.qty ?? qty) || 1)
  if (line.lineFinalTotal != null && Number.isFinite(Number(line.lineFinalTotal))) {
    return Number(line.lineFinalTotal) / q
  }
  if (line.finalTotal != null && Number.isFinite(Number(line.finalTotal))) {
    return Number(line.finalTotal) / q
  }
  if (line.lineTotalAfterDiscount != null && Number.isFinite(Number(line.lineTotalAfterDiscount))) {
    return Number(line.lineTotalAfterDiscount) / q
  }
  if (line.unitFinalPrice != null && Number.isFinite(Number(line.unitFinalPrice))) {
    return Number(line.unitFinalPrice)
  }
  if (line.finalUnitPrice != null && Number.isFinite(Number(line.finalUnitPrice))) {
    return Number(line.finalUnitPrice)
  }
  if (line.discountedUnitPrice != null && Number.isFinite(Number(line.discountedUnitPrice))) {
    return Number(line.discountedUnitPrice)
  }
  if (line.priceAfterDiscount != null && Number.isFinite(Number(line.priceAfterDiscount))) {
    return Number(line.priceAfterDiscount)
  }
  if (line.finalPrice != null && Number.isFinite(Number(line.finalPrice))) {
    return Number(line.finalPrice) / q
  }
  const original = lineUnitOriginal(line)
  const lineDiscount = toNum(
    line.lineDiscountAmount ??
      line.lineDiscount ??
      line.discountAmount ??
      line.discount ??
      line.savings ??
      line.savedAmount ??
      line.itemDiscount ??
      line.discountTotal
  )
  if (original != null && lineDiscount != null && q >= 1) {
    const after = original - lineDiscount / q
    if (Number.isFinite(after) && after >= 0) return after
  }
  const sub = toNum(line.subTotal ?? line.lineSubtotal ?? line.subtotal)
  const disc = toNum(line.lineDiscount ?? line.discountAmount ?? line.itemDiscount)
  if (sub != null && disc != null && q >= 1) {
    const after = sub - disc
    if (Number.isFinite(after) && after >= 0) return after / q
  }
  return null
}

export function lineUnitOriginal(line) {
  if (!line || typeof line !== 'object') return null
  const v =
    line.unitOriginalPrice ??
    line.originalUnitPrice ??
    line.mrp ??
    line.unitPrice ??
    line.price ??
    line.product?.price ??
    line.product?.mrp ??
    line.originalPrice ??
    line.listPrice
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
