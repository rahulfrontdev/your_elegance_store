import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, CreditCard, MapPin, Package } from 'lucide-react'
import { getMyOrderByIdRequest, submitOrderReviewRequest } from '../../api/orderApi'
import { resolveOrderLifecycle } from '../../utils/orderLifecycle'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

function canReviewOrder(orderStatus) {
  return String(orderStatus || '').trim() === 'Delivered'
}

const AccountOrderDetailsPage = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewDrafts, setReviewDrafts] = useState({})
  const [reviewSubmittingId, setReviewSubmittingId] = useState('')
  const [reviewFeedback, setReviewFeedback] = useState({})

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Order id is missing.')
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError('')
      try {
        const { data } = await getMyOrderByIdRequest(orderId)
        const raw = data?.data?.order || data?.order || data?.data || null
        if (!raw) {
          setError('Order details not found.')
          return
        }
        const lifecycle = resolveOrderLifecycle(raw)
        setOrder({
          id: raw?._id || raw?.id || '',
          orderNo: raw?.orderId || raw?._id || raw?.id || '',
          items: (Array.isArray(raw?.items) ? raw.items : []).map((line) => {
            const product =
              line?.product && typeof line.product === 'object' && !Array.isArray(line.product)
                ? line.product
                : {}
            const snapshotLine = Array.isArray(raw?.appliedDiscountSnapshot?.lines)
              ? raw.appliedDiscountSnapshot.lines.find((ln) => {
                  const a = String(ln?.productId ?? ln?.product?._id ?? ln?.product?.id ?? '')
                  const b = String(product?._id || product?.id || line?.productId || '')
                  return a && b && a === b
                })
              : null
            const qty = Number(line?.quantity || line?.qty || snapshotLine?.quantity || 1)
            const unitOriginalPrice = Number(
              line?.unitOriginalPrice ??
                snapshotLine?.unitOriginalPrice ??
                line?.unitPrice ??
                line?.price ??
                product?.price ??
                0
            )
            return {
              id: product?._id || product?.id || line?._id || line?.id || line?.productId || '',
              name: line?.name || product?.name || 'Product',
              image:
                line?.imageUrl ||
                line?.image ||
                product?.imageUrl ||
                product?.image ||
                (Array.isArray(product?.images) ? product.images[0] : '') ||
                '',
              description: line?.description || product?.description || '',
              colour: line?.colour || product?.colour || '',
              category:
                line?.category ||
                product?.category?.name ||
                (typeof product?.category === 'string' ? product.category : ''),
              qty,
              unitPrice: unitOriginalPrice,
              lineDiscountAmount: Number(
                line?.lineDiscountAmount ??
                  snapshotLine?.lineDiscountAmount ??
                  line?.discountAmount ??
                  snapshotLine?.discountAmount ??
                  0
              ),
              lineTotal: Number(
                line?.lineFinalTotal ??
                  snapshotLine?.lineFinalTotal ??
                  line?.total ??
                  line?.lineTotal ??
                  qty * unitOriginalPrice
              ),
              appliedDiscountName:
                line?.appliedDiscountName ||
                snapshotLine?.appliedDiscountName ||
                line?.discountName ||
                snapshotLine?.discountName ||
                '',
              raw: line,
            }
          }),
          totalAmount: Number(raw?.totalAmount ?? raw?.total ?? 0),
          paymentMethod: lifecycle.paymentMethod || 'COD',
          paymentStatus: lifecycle.paymentStatus,
          orderStatus: lifecycle.orderStatus,
          shippingAddress: raw?.shippingAddress || {},
          formattedAddress: raw?.formattedAddress || '',
          appliedDiscountSnapshot: raw?.appliedDiscountSnapshot || null,
          createdAt: raw?.createdAt || raw?.placedAt || '',
        })
      } catch (e) {
        setError(e?.response?.data?.message || 'Could not load order details.')
      } finally {
        setIsLoading(false)
      }
    }
    loadOrder()
  }, [orderId])

  const fullAddress = useMemo(() => {
    if (!order?.shippingAddress) return 'N/A'
    return [
      order.shippingAddress.addressLine1,
      order.shippingAddress.addressLine2,
      order.shippingAddress.city,
      order.shippingAddress.state,
      order.shippingAddress.pincode,
      order.shippingAddress.country,
    ]
      .filter(Boolean)
      .join(', ')
  }, [order])

  const updateReviewDraft = (productId, partial) => {
    setReviewDrafts((prev) => {
      const existing = prev[productId] || { rating: 5, comment: '' }
      return {
        ...prev,
        [productId]: { ...existing, ...partial },
      }
    })
  }

  const submitReview = async (productId) => {
    if (!order?.id || !productId || reviewSubmittingId) return
    if (!canReviewOrder(order.orderStatus)) {
      setReviewFeedback((prev) => ({
        ...prev,
        [productId]: { type: 'error', message: 'Review available after delivery.' },
      }))
      return
    }
    const draft = reviewDrafts[productId] || { rating: 5, comment: '' }
    const rating = Number(draft.rating)
    const comment = String(draft.comment || '').trim()

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewFeedback((prev) => ({
        ...prev,
        [productId]: { type: 'error', message: 'Please select a valid rating between 1 and 5.' },
      }))
      return
    }

    if (!comment) {
      setReviewFeedback((prev) => ({
        ...prev,
        [productId]: { type: 'error', message: 'Please write a review comment.' },
      }))
      return
    }

    setReviewSubmittingId(productId)
    setReviewFeedback((prev) => ({ ...prev, [productId]: null }))

    try {
      await submitOrderReviewRequest(order.id, {
        productId,
        rating,
        comment,
      })
      setReviewFeedback((prev) => ({
        ...prev,
        [productId]: {
          type: 'success',
          message: 'Review submitted. It will appear on the website after admin approval.',
        },
      }))
      setReviewDrafts((prev) => ({
        ...prev,
        [productId]: { rating: 5, comment: '' },
      }))
    } catch (e) {
      setReviewFeedback((prev) => ({
        ...prev,
        [productId]: {
          type: 'error',
          message: e?.response?.data?.message || 'Could not submit review. Please try again.',
        },
      }))
    } finally {
      setReviewSubmittingId('')
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
        Loading order details...
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-700">{error || 'Order details not found.'}</p>
        <Link to="/account/orders" className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  const isReviewAvailable = canReviewOrder(order.orderStatus)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Order Details</h2>
          <p className="mt-1 text-sm text-neutral-600">Order No: {order.orderNo}</p>
        </div>
        <Link to="/account/orders" className="text-sm font-medium text-blue-600 hover:underline">
          Back to orders
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">Status</p>
          <p className="mt-1 text-sm font-semibold capitalize text-neutral-900">{order.orderStatus}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">Payment</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {order.paymentMethod} - {order.paymentStatus}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-900">Items</h3>
        <ul className="mt-3 space-y-3">
          {order.items.map((item, idx) => {
            return (
              <li key={`${item?.id || idx}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item?.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-neutral-900">{item?.name || 'Product'}</span>
                      <span className="text-neutral-700">₹{Number(item?.lineTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {item?.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{item.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
                      <span>Qty: {Number(item?.qty || 1)}</span>
                      <span>unitOriginalPrice: ₹{Number(item?.unitPrice || 0).toLocaleString('en-IN')}</span>
                      {item?.lineDiscountAmount > 0 && (
                        <span className="text-emerald-700">
                          lineDiscountAmount: -₹{Number(item.lineDiscountAmount).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span>lineFinalTotal: ₹{Number(item?.lineTotal || 0).toLocaleString('en-IN')}</span>
                      {item?.appliedDiscountName && (
                        <span className="text-neutral-500">appliedDiscountName: {item.appliedDiscountName}</span>
                      )}
                      {item?.colour && <span>Color: {item.colour}</span>}
                      {item?.category && <span>Category: {item.category}</span>}
                    </div>

                    {item?.id && (
                      <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                        {isReviewAvailable ? (
                          <>
                            <p className="text-xs font-semibold text-neutral-800">Write a review</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr]">
                              <label className="text-xs text-neutral-700">
                                Rating
                                <select
                                  value={reviewDrafts[item.id]?.rating ?? 5}
                                  onChange={(e) => updateReviewDraft(item.id, { rating: Number(e.target.value) })}
                                  className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                                >
                                  <option value={5}>5 - Excellent</option>
                                  <option value={4}>4 - Good</option>
                                  <option value={3}>3 - Average</option>
                                  <option value={2}>2 - Poor</option>
                                  <option value={1}>1 - Bad</option>
                                </select>
                              </label>
                              <label className="text-xs text-neutral-700">
                                Comment
                                <textarea
                                  value={reviewDrafts[item.id]?.comment ?? ''}
                                  onChange={(e) => updateReviewDraft(item.id, { comment: e.target.value })}
                                  rows={2}
                                  placeholder="Share your experience with this product"
                                  className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs resize-y"
                                />
                              </label>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => submitReview(item.id)}
                                disabled={reviewSubmittingId === item.id}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {reviewSubmittingId === item.id ? 'Submitting...' : 'Submit Review'}
                              </button>
                              {reviewFeedback[item.id]?.message && (
                                <p
                                  className={`text-xs ${
                                    reviewFeedback[item.id].type === 'success' ? 'text-green-700' : 'text-red-700'
                                  }`}
                                >
                                  {reviewFeedback[item.id].message}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs font-medium text-neutral-500">Review available after delivery.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-2 text-neutral-600">
            <Package size={15} className="text-neutral-400" />
            {order.items.length} item(s)
          </p>
          <p className="flex items-center gap-2 text-neutral-600">
            <Calendar size={15} className="text-neutral-400" />
            {formatDate(order.createdAt)}
          </p>
          <p className="flex items-center gap-2 text-neutral-600">
            <CreditCard size={15} className="text-neutral-400" />
            Total: ₹{order.totalAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-900">Shipping Address</h3>
        <p className="mt-2 text-sm font-medium text-neutral-900">{order.shippingAddress.fullName || 'N/A'}</p>
        <p className="mt-1 text-xs text-neutral-600">Mobile: {order.shippingAddress.mobile || 'N/A'}</p>
        <p className="mt-2 flex items-start gap-2 text-sm text-neutral-700">
          <MapPin size={15} className="mt-0.5 text-neutral-400" />
          <span>{order.formattedAddress || fullAddress || 'N/A'}</span>
        </p>
      </div>

      {order.appliedDiscountSnapshot && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Discounts applied</h3>
          <div className="mt-3 space-y-2 text-sm text-neutral-700">
            {order.appliedDiscountSnapshot.subtotal != null || order.appliedDiscountSnapshot.subTotal != null ? (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₹{Number(order.appliedDiscountSnapshot.subtotal ?? order.appliedDiscountSnapshot.subTotal).toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}
            {order.appliedDiscountSnapshot.discountTotal != null &&
              Number(order.appliedDiscountSnapshot.discountTotal) > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount total</span>
                  <span>-₹{Number(order.appliedDiscountSnapshot.discountTotal).toLocaleString('en-IN')}</span>
                </div>
              )}
            {order.appliedDiscountSnapshot.couponCode && (
              <p className="text-xs text-neutral-600">
                Coupon:{' '}
                <span className="font-semibold text-neutral-900">{order.appliedDiscountSnapshot.couponCode}</span>
              </p>
            )}
            {order.appliedDiscountSnapshot.finalTotal != null && (
              <div className="flex justify-between border-t border-emerald-200 pt-2 font-semibold text-neutral-900">
                <span>Final total</span>
                <span>₹{Number(order.appliedDiscountSnapshot.finalTotal).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountOrderDetailsPage

