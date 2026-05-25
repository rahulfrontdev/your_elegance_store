/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addCartItem,
  clearCartRequest,
  fetchCart,
  mergeCartRequest,
  removeCartItem,
  updateCartItemQty,
} from '../api/cartApi'
import { calculateDiscountRequest } from '../api/discountApi'
import { createOrderRequest, verifyOrderPaymentRequest } from '../api/orderApi'
import {
  normalizeDiscountCalculateResponse,
  sanitizeOrderItemsForApi,
  stringifyEntityId,
} from '../utils/discountPreview'
import { resolveOrderLifecycle } from '../utils/orderLifecycle'

const CartContext = createContext(null)

const STORAGE_ORDERS_KEY = 'orders_v1'
const STORAGE_GUEST_CART_KEY = 'guest_cart_v1'
const STORAGE_AUTH_USER_KEY = 'auth_user'

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(STORAGE_GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveGuestCart(items) {
  try {
    localStorage.setItem(STORAGE_GUEST_CART_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function clearGuestCart() {
  try {
    localStorage.removeItem(STORAGE_GUEST_CART_KEY)
  } catch {
    // ignore
  }
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** API may send `address` as a string or the same shape as `shippingAddress` (object). */
function formatOrderAddressLine(order) {
  const raw = order?.address
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  const addr = typeof raw === 'object' && raw !== null ? raw : order?.shippingAddress
  if (!addr || typeof addr !== 'object') return ''
  return [
    addr.fullName,
    addr.mobile,
    addr.addressLine1,
    addr.addressLine2,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ')
}

function extractApiMessage(error) {
  const d = error?.response?.data
  if (typeof d?.message === 'string' && d.message.trim()) return d.message.trim()
  if (Array.isArray(d?.errors)) {
    const parts = d.errors.map((e) => e?.msg || e?.message).filter(Boolean)
    if (parts.length) return parts.join(', ')
  }
  if (typeof d?.error === 'string' && d.error.trim()) return d.error.trim()
  return error?.message || 'Request failed.'
}

function normalizeOrderPayload(payload) {
  const root = payload ?? {}
  const order =
    root?.data?.order ||
    root?.order ||
    (root?.data &&
    typeof root.data === 'object' &&
    !Array.isArray(root.data) &&
    (Array.isArray(root.data.items) || root.data.totalAmount != null || root.data._id)
      ? root.data
      : null) ||
    root

  const list = Array.isArray(order?.items) ? order.items : []
  const normalizedItems = list
    .map((line) => {
      if (line == null || typeof line !== 'object') return null
      const populated =
        line.product && typeof line.product === 'object' && !Array.isArray(line.product)
          ? line.product
          : null
      const id = stringifyEntityId(
        populated?._id ??
          populated?.id ??
          line.productId?._id ??
          line.productId ??
          line._id ??
          line.id
      )
      const qty = Math.max(1, Number(line.qty ?? line.quantity ?? 1) || 1)
      const unitFromLineTotal =
        line.lineFinalTotal != null && Number.isFinite(Number(line.lineFinalTotal))
          ? Number(line.lineFinalTotal) / qty
          : null
      const price = Number(
        unitFromLineTotal != null && Number.isFinite(unitFromLineTotal)
          ? unitFromLineTotal
          : line.unitOriginalPrice ??
              line.price ??
              line.unitPrice ??
              populated?.specialOfferPrice ??
              populated?.price ??
              0
      )
      return {
        id,
        name: line.name || populated?.name || 'Product',
        price: Number.isFinite(price) ? price : 0,
        unitOriginalPrice: Number(line.unitOriginalPrice ?? line.originalUnitPrice ?? price ?? 0),
        lineDiscountAmount: Number(line.lineDiscountAmount ?? line.discountAmount ?? 0),
        lineFinalTotal: Number(line.lineFinalTotal ?? line.total ?? line.lineTotal ?? price * qty),
        appliedDiscountName:
          line.appliedDiscountName ||
          line.discountName ||
          line.appliedDiscount?.name ||
          line.discount?.name ||
          '',
        qty,
        image:
          line.imageUrl ||
          line.image ||
          (Array.isArray(line.images) ? line.images[0] : '') ||
          populated?.imageUrl ||
          populated?.image ||
          (Array.isArray(populated?.images) ? populated.images[0] : '') ||
          '',
      }
    })
    .filter(Boolean)

  const formatted =
    typeof order?.formattedAddress === 'string' && order.formattedAddress.trim()
      ? order.formattedAddress.trim()
      : formatOrderAddressLine(order)
  const lifecycle = resolveOrderLifecycle(order)

  return {
    id: order?._id || order?.id || '',
    orderId: order?.orderId || order?.id || order?._id || '',
    items: normalizedItems,
    total: Number(
      order?.totalAmount ??
        order?.total ??
        order?.grandTotal ??
        order?.pricing?.grandTotal ??
        0
    ),
    address: formatted || formatOrderAddressLine(order),
    formattedAddress: formatted,
    paymentMethod: lifecycle.paymentMethod.toLowerCase(),
    paymentStatus: lifecycle.paymentStatus,
    orderStatus: lifecycle.orderStatus,
    placedAt: order?.placedAt || order?.createdAt || new Date().toISOString(),
    appliedDiscountSnapshot: order?.appliedDiscountSnapshot ?? null,
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() =>
    localStorage.getItem('token') && localStorage.getItem(STORAGE_AUTH_USER_KEY) ? [] : loadGuestCart()
  )
  const [serverTotals, setServerTotals] = useState({ subTotal: 0, gstTotal: 0, grandTotal: 0, totalItems: 0 })
  const [orders, setOrders] = useState(loadOrders)
  const [discountCode, setDiscountCode] = useState('')
  const [discountPreview, setDiscountPreview] = useState(null)
  const [discountPreviewError, setDiscountPreviewError] = useState('')
  const [discountPreviewLoading, setDiscountPreviewLoading] = useState(false)
  const guestMergePromiseRef = useRef(null)

  const resetDiscountState = useCallback(() => {
    setDiscountCode('')
    setDiscountPreview(null)
    setDiscountPreviewError('')
    setDiscountPreviewLoading(false)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders))
    } catch {
      // ignore write errors
    }
  }, [orders])

  const isAuthed = () => Boolean(localStorage.getItem('token') && localStorage.getItem(STORAGE_AUTH_USER_KEY))

  const normalizeCart = (payload) => {
    const root = payload ?? {}
    const cart =
      root?.data?.cart ||
      root?.cart ||
      root?.data ||
      root

    const list =
      (Array.isArray(root?.data) && root.data) ||
      (Array.isArray(cart?.items) && cart.items) ||
      (Array.isArray(root?.items) && root.items) ||
      (Array.isArray(root?.data?.items) && root.data.items) ||
      []

    const normalizedItems = list
      .map((line) => {
        if (line == null || typeof line !== 'object') return null
        const populated =
          line.product && typeof line.product === 'object' && !Array.isArray(line.product)
            ? line.product
            : null
        const id = stringifyEntityId(
          populated?._id ??
            populated?.id ??
            line.productId?._id ??
            line.productId ??
            line._id ??
            line.id
        )
        const qty = Math.max(1, Number(line.qty ?? line.quantity) || 1)
        const unitFromLineTotal =
          line.lineFinalTotal != null && Number.isFinite(Number(line.lineFinalTotal))
            ? Number(line.lineFinalTotal) / qty
            : null
        const price = Number(
          unitFromLineTotal != null && Number.isFinite(unitFromLineTotal)
            ? unitFromLineTotal
            : line.specialOfferPrice ??
                line.price ??
                line.unitPrice ??
                populated?.specialOfferPrice ??
                populated?.price ??
                0
        )
        return {
          id,
          name: line.name || populated?.name || 'Product',
          price: Number.isFinite(price) ? price : 0,
          image:
            line.imageUrl ||
            (Array.isArray(line.images) ? line.images[0] : '') ||
            populated?.imageUrl ||
            populated?.image ||
            '',
          qty,
        }
      })
      .filter((item) => item && item.id && item.qty > 0)

    const totalItems = Number(
      cart?.totalItems ||
      root?.totalItems ||
      root?.totalQuantity ||
      cart?.itemCount ||
      normalizedItems.reduce((count, item) => count + item.qty, 0)
    )

    return {
      items: normalizedItems,
      subTotal: Number(cart?.subTotal || cart?.subtotal || root?.subTotal || root?.subtotal || 0),
      gstTotal: Number(cart?.gstTotal || cart?.taxTotal || 0),
      grandTotal: Number(cart?.grandTotal || cart?.total || root?.grandTotal || 0),
      totalItems,
    }
  }

  const syncCart = useCallback(async () => {
    if (!isAuthed()) {
      setItems(loadGuestCart())
      setServerTotals({ subTotal: 0, gstTotal: 0, grandTotal: 0, totalItems: 0 })
      return
    }
    try {
      const { data } = await fetchCart()
      const normalized = normalizeCart(data)
      setItems(normalized.items)
      setServerTotals({
        subTotal: normalized.subTotal,
        gstTotal: normalized.gstTotal,
        grandTotal: normalized.grandTotal,
        totalItems: normalized.totalItems,
      })
    } catch {
      setItems([])
      setServerTotals({ subTotal: 0, gstTotal: 0, grandTotal: 0, totalItems: 0 })
    }
  }, [])

  const applyNormalizedCart = useCallback((normalized) => {
    setItems(normalized.items)
    setServerTotals({
      subTotal: normalized.subTotal,
      gstTotal: normalized.gstTotal,
      grandTotal: normalized.grandTotal,
      totalItems: normalized.totalItems,
    })
  }, [])

  const mergeGuestCart = useCallback(async () => {
    if (guestMergePromiseRef.current) return guestMergePromiseRef.current

    const guestItems = sanitizeOrderItemsForApi(loadGuestCart())
    if (!guestItems.length) {
      await syncCart()
      return { ok: true, merged: false }
    }

    guestMergePromiseRef.current = (async () => {
      try {
        const { data } = await mergeCartRequest({ items: guestItems })
        const normalized = normalizeCart(data)
        applyNormalizedCart(normalized)
        clearGuestCart()
        return { ok: true, merged: true, cart: normalized }
      } catch (error) {
        return { ok: false, message: extractApiMessage(error) }
      } finally {
        guestMergePromiseRef.current = null
      }
    })()

    return guestMergePromiseRef.current
  }, [applyNormalizedCart, syncCart])

  useEffect(() => {
    syncCart()
  }, [syncCart])

  useEffect(() => {
    const onStorage = async (e) => {
      if (e.key !== 'token') return
      syncCart()
    }
    const onFocus = () => syncCart()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [syncCart])

  // Persist guest cart whenever items change and user is not logged in.
  useEffect(() => {
    if (isAuthed()) return
    saveGuestCart(items)
  }, [items])

  useEffect(() => {
    if (!items.length) {
      setDiscountPreview(null)
      setDiscountPreviewError('')
      setDiscountPreviewLoading(false)
      return
    }

    let cancelled = false
    setDiscountPreviewLoading(true)
    setDiscountPreviewError('')

    const timer = setTimeout(async () => {
      try {
        const orderItems = sanitizeOrderItemsForApi(items)
        if (!orderItems.length) {
          if (!cancelled) {
            setDiscountPreview(null)
            setDiscountPreviewError('Remove invalid cart lines (missing product) and try again.')
          }
          return
        }
        const body = { items: orderItems, discountCode: discountCode.trim() }

        const { data } = await calculateDiscountRequest(body)
        const d = normalizeDiscountCalculateResponse(data)
        if (!cancelled) {
          setDiscountPreview(d)
          setDiscountPreviewError('')
        }
      } catch (error) {
        if (!cancelled) {
          setDiscountPreview(null)
          setDiscountPreviewError(extractApiMessage(error))
        }
      } finally {
        if (!cancelled) setDiscountPreviewLoading(false)
      }
    }, 380)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [items, discountCode])

  const cartCount = useMemo(() => {
    const localCount = items.reduce((n, i) => n + i.qty, 0)
    return localCount || serverTotals.totalItems || 0
  }, [items, serverTotals.totalItems])

  const total = useMemo(() => {
    if (discountPreview && discountPreview.finalPrice != null && !discountPreviewError) {
      return Number(discountPreview.finalPrice)
    }
    if (serverTotals.grandTotal > 0) return serverTotals.grandTotal
    return items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.qty, 0)
  }, [items, serverTotals.grandTotal, discountPreview, discountPreviewError])

  const getItem = (id) => items.find((i) => String(i.id) === String(id)) ?? null

  const addItem = async (product, qty = 1) => {
    if (!product?.id) return { ok: false, message: 'Invalid product.' }
    const addQty = Math.max(1, Number(qty) || 1)

    // Optimistic update for snappy UI
    setItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(product.id))
      if (existing) {
        return prev.map((i) =>
          String(i.id) === String(product.id) ? { ...i, qty: i.qty + addQty } : i
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name || 'Product',
          price: Number(product?.price ?? product?.specialOfferPrice ?? 0),
          image: product.image || product.imageUrl || '',
          qty: addQty,
        },
      ]
    })

    try {
      if (isAuthed()) {
        await addCartItem({ productId: stringifyEntityId(product.id), quantity: addQty })
        // Keep UI responsive; sync in background.
        syncCart()
      }
      return { ok: true }
    } catch (error) {
      // Re-sync to rollback optimistic state if server rejected.
      await syncCart()
      return { ok: false, message: extractApiMessage(error) }
    }
  }

  const updateQty = async (productId, qty) => {
    const nextQty = Number(qty)

    // Optimistic qty update for instant +/- response.
    const previousItems = items
    setItems((prev) => {
      if (Number.isNaN(nextQty) || nextQty <= 0) {
        return prev.filter((i) => String(i.id) !== String(productId))
      }
      return prev.map((i) =>
        String(i.id) === String(productId) ? { ...i, qty: nextQty } : i
      )
    })

    try {
      if (isAuthed()) {
        if (Number.isNaN(nextQty) || nextQty <= 0) {
          await removeCartItem(productId)
        } else {
          await updateCartItemQty({
            productId,
            quantity: nextQty,
          })
        }
        // Background sync to keep totals aligned to server values.
        syncCart()
      }
    } catch {
      // Rollback optimistic update if backend call fails.
      setItems(previousItems)
      await syncCart()
    }
  }

  const removeItem = async (productId) => {
    if (!isAuthed()) {
      setItems((prev) => prev.filter((i) => String(i.id) !== String(productId)))
      return
    }
    try {
      await removeCartItem(productId)
    } finally {
      await syncCart()
    }
  }

  const clearCart = async () => {
    resetDiscountState()
    if (!isAuthed()) {
      setItems([])
      clearGuestCart()
      setServerTotals({ subTotal: 0, gstTotal: 0, grandTotal: 0, totalItems: 0 })
      return
    }
    try {
      await clearCartRequest()
    } finally {
      await syncCart()
    }
  }

  const placeOrder = async ({ shippingAddress, paymentMethod = 'cod', discountCode: discountOverride }) => {
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return { ok: false, message: 'Please enter shipping address.' }
    }
    if (items.length === 0) return { ok: false, message: 'Cart is empty.' }
    if (!['cod', 'online'].includes(paymentMethod)) {
      return { ok: false, message: 'Please choose a valid payment method.' }
    }

    const code =
      discountOverride !== undefined ? String(discountOverride).trim() : discountCode.trim()

    const orderItems = sanitizeOrderItemsForApi(items)
    if (!orderItems.length) {
      return {
        ok: false,
        message:
          'Your cart has no valid products to order. Refresh the cart or remove lines with missing products.',
      }
    }

    const payload = {
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        mobile: shippingAddress.mobile,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        landmark: shippingAddress.landmark || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country,
      },
      paymentMethod: paymentMethod === 'online' ? 'ONLINE' : 'COD',
      discountCode: code,
    }

    try {
      const { data } = await createOrderRequest(payload)
      const order = normalizeOrderPayload(data)
      const root = data?.data || data || {}
      const razorpayOrder = root?.razorpayOrder || data?.razorpayOrder || null
      const key = root?.key || data?.key || razorpayOrder?.key || ''

      setOrders((prev) => [order, ...prev.filter((entry) => String(entry.id) !== String(order.id))])

      if (paymentMethod === 'cod') {
        await clearCart()
      }

      return { ok: true, order, razorpayOrder, key }
    } catch (error) {
      return {
        ok: false,
        message: extractApiMessage(error),
      }
    }
  }

  const verifyOrderPayment = async (payload) => {
    try {
      const { data } = await verifyOrderPaymentRequest(payload)
      const order = {
        ...normalizeOrderPayload(data),
        paymentStatus: 'Paid',
        orderStatus: 'Confirmed',
      }
      setOrders((prev) => [order, ...prev.filter((entry) => String(entry.id) !== String(order.id))])
      await clearCart()
      return { ok: true, order }
    } catch (error) {
      return {
        ok: false,
        message: extractApiMessage(error),
      }
    }
  }

  const value = {
    items,
    cartCount,
    total,
    orders,
    discountCode,
    setDiscountCode,
    discountPreview,
    discountPreviewError,
    discountPreviewLoading,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    getItem,
    placeOrder,
    verifyOrderPayment,
    mergeGuestCart,
    refreshCart: syncCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

