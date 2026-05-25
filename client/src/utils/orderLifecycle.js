function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeStatusKey(value) {
  return normalizeText(value).toLowerCase()
}

function isCancelledStatus(value) {
  const key = normalizeStatusKey(value)
  return key === 'cancelled' || key === 'canceled'
}

function titleStatus(value, fallback = 'Pending') {
  if (isCancelledStatus(value)) return 'Cancelled'
  const key = normalizeStatusKey(value)
  if (key === 'confirmed') return 'Confirmed'
  if (key === 'shipped') return 'Shipped'
  if (key === 'delivered') return 'Delivered'
  if (key === 'paid') return 'Paid'
  if (key === 'failed') return 'Failed'
  if (key === 'pending') return 'Pending'
  return normalizeText(value) || fallback
}

export function isOnlinePaymentMethod(paymentMethod) {
  return normalizeStatusKey(paymentMethod) === 'online'
}

export function isCodPaymentMethod(paymentMethod) {
  return normalizeStatusKey(paymentMethod) === 'cod'
}

export function resolveOrderLifecycle(order) {
  const paymentMethod = normalizeText(order?.paymentMethod)
  const rawPaymentStatus = normalizeText(order?.paymentStatus)
  const rawOrderStatus = normalizeText(order?.orderStatus || order?.status)
  const orderStatusKey = normalizeStatusKey(rawOrderStatus)
  const paymentStatusKey = normalizeStatusKey(rawPaymentStatus)

  if (isCancelledStatus(rawOrderStatus)) {
    return {
      paymentMethod,
      paymentStatus: titleStatus(rawPaymentStatus),
      orderStatus: 'Cancelled',
    }
  }

  if (isOnlinePaymentMethod(paymentMethod)) {
    const isPaid = paymentStatusKey === 'paid'
    return {
      paymentMethod,
      paymentStatus: isPaid ? 'Paid' : titleStatus(rawPaymentStatus, 'Pending'),
      orderStatus: isPaid ? 'Confirmed' : titleStatus(rawOrderStatus, 'Pending'),
    }
  }

  if (isCodPaymentMethod(paymentMethod)) {
    const terminalOrProgressStatus = ['confirmed', 'shipped', 'delivered'].includes(orderStatusKey)
    return {
      paymentMethod,
      paymentStatus: titleStatus(rawPaymentStatus, 'Pending'),
      orderStatus: terminalOrProgressStatus ? titleStatus(rawOrderStatus) : 'Confirmed',
    }
  }

  return {
    paymentMethod,
    paymentStatus: titleStatus(rawPaymentStatus),
    orderStatus: titleStatus(rawOrderStatus),
  }
}
