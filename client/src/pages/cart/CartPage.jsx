import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import OptimizedImage from '../../components/common/OptimizedImage'
import { useCart } from '../../context/CartContext.jsx'
import { buildLineMapByProductId, lineUnitFinalAfterDiscount, lineUnitOriginal, stringifyEntityId } from '../../utils/discountPreview'

function QtyStepper({ qty, onMinus, onPlus }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-1">
      <button
        type="button"
        onClick={onMinus}
        aria-label="Decrease quantity"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-semibold text-neutral-900">{qty}</span>
      <button
        type="button"
        onClick={onPlus}
        aria-label="Increase quantity"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

const CartPage = () => {
  const navigate = useNavigate()
  const {
    items,
    total,
    updateQty,
    removeItem,
    discountCode,
    setDiscountCode,
    discountPreview,
    discountPreviewError,
    discountPreviewLoading,
  } = useCart()
  const [removingId, setRemovingId] = useState('')
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [couponDraft, setCouponDraft] = useState(discountCode)

  useEffect(() => {
    setCouponDraft(discountCode)
  }, [discountCode])

  const cartTotal = useMemo(() => total, [total])

  const lineAdjustments = useMemo(() => {
    const lines = discountPreview?.appliedDiscountDetails?.lines
    return buildLineMapByProductId(lines)
  }, [discountPreview])

  const handleRemoveItem = async (productId, productName) => {
    try {
      setRemovingId(productId)
      await removeItem(productId)
      setToast({ type: 'success', message: 'Item deleted successfully.' })
    } catch {
      setToast({ type: 'error', message: 'Failed to delete item. Please try again.' })
    } finally {
      setRemovingId('')
      setDeleteTarget(null)
    }
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5">
      {toast?.message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-[7000] w-[calc(100%-1.5rem)] max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-2xl border ${toast.type === 'success'
            ? 'bg-green-600 text-white border-green-500'
            : 'bg-red-600 text-white border-red-500'
            }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <div className="mb-4 flex flex-col items-start gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl sm:text-3xl">Cart</h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">Review items, then continue to checkout.</p>
        </div>
        <Link to="/products" className="text-xs sm:text-sm font-medium text-blue-600 hover:underline">
          ← Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 sm:px-6 py-6 text-center">
          <p className="text-sm font-medium text-neutral-700">Your cart is empty.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 lg:gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <ul className="space-y-3 sm:space-y-4">
              {items.map((i) => {
                const adj = lineAdjustments.get(stringifyEntityId(i.id))
                const unitAfter = adj ? lineUnitFinalAfterDiscount(adj, i.qty) : null
                const unitOrig = adj ? lineUnitOriginal(adj) : null
                const unitDisplay =
                  unitAfter != null && Number.isFinite(unitAfter) && unitAfter >= 0 ? unitAfter : Number(i.price) || 0
                const lineTotalDisplay =
                  adj?.lineFinalTotal != null && Number.isFinite(Number(adj.lineFinalTotal))
                    ? Number(adj.lineFinalTotal)
                    : unitDisplay * i.qty
                const showStrike =
                  unitOrig != null && Number.isFinite(unitOrig) && unitOrig > unitDisplay

                return (
                <li
                  key={i.id}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-lg bg-neutral-100 shrink-0">
                      <OptimizedImage src={i.image} alt="" preset="thumb" variant="thumb" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{i.name}</p>
                      <p className="text-xs sm:text-sm text-neutral-600">
                        {showStrike ? (
                          <>
                            <span className="line-through text-neutral-400">₹{unitOrig.toLocaleString('en-IN')}</span>{' '}
                            <span className="font-medium text-emerald-800">₹{unitDisplay.toLocaleString('en-IN')}</span>
                            <span className="ml-1 text-[10px] text-emerald-700">(after discount)</span>
                          </>
                        ) : (
                          <>₹{unitDisplay.toLocaleString('en-IN')}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:gap-4 sm:flex-col sm:items-end">
                    <QtyStepper
                      qty={i.qty}
                      onMinus={() => updateQty(i.id, i.qty - 1)}
                      onPlus={() => updateQty(i.id, i.qty + 1)}
                    />

                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-neutral-900">
                        ₹{lineTotalDisplay.toLocaleString('en-IN')}
                      </p>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => setDeleteTarget({ id: i.id, name: i.name })}
                        disabled={removingId === i.id}
                        className="inline-flex h-9 w-9 items-center justify-center cursor-pointer rounded-md border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
                )
              })}
            </ul>
          </div>

          <aside className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold text-neutral-900">Coupon</h2>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="text"
                value={couponDraft}
                onChange={(e) => {
                  const next = e.target.value
                  setCouponDraft(next)
                  setDiscountCode(next)
                }}
                placeholder="Discount code"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setDiscountCode(couponDraft.trim())}
                className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
            {discountCode && (
              <button
                type="button"
                onClick={() => {
                  setCouponDraft('')
                  setDiscountCode('')
                }}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                Remove coupon
              </button>
            )}
            {discountPreviewLoading && (
              <p className="mt-2 text-xs text-neutral-500">Updating totals from server…</p>
            )}
            {discountPreviewError && (
              <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                {discountPreviewError}
              </p>
            )}
            {discountPreview?.appliedDiscountDetails?.couponCode && (
              <p className="mt-2 text-xs text-emerald-700">
                Applied: <span className="font-semibold">{discountPreview.appliedDiscountDetails.couponCode}</span>
              </p>
            )}

            <h2 className="mt-6 text-sm font-semibold text-neutral-900">Item details</h2>
            <ul className="mt-3 space-y-3">
              {items.map((i) => {
                const unitPrice = Number(i.price) || 0
                const adj = lineAdjustments.get(stringifyEntityId(i.id))
                const catalogLine = unitPrice * i.qty
                const lineFinal =
                  adj != null && adj.lineFinalTotal != null && Number.isFinite(Number(adj.lineFinalTotal))
                    ? Number(adj.lineFinalTotal)
                    : catalogLine
                const lineSaveFromApi = adj != null ? Number(adj.lineDiscountAmount ?? adj.discountAmount ?? 0) : 0
                const lineSave = Math.max(0, lineSaveFromApi, catalogLine - lineFinal)
                const listPrice = Number(i.listPrice || unitPrice)
                const hasCatalogDiscount = listPrice > unitPrice && !adj
                const discountAmount = hasCatalogDiscount ? (listPrice - unitPrice) * i.qty : 0
                return (
                  <li key={`summary-${i.id}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{i.name}</p>
                    <div className="mt-1 space-y-1 text-xs text-neutral-600">
                      <div className="flex items-center justify-between">
                        <span>Quantity</span>
                        <span>{i.qty}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Unit (cart)</span>
                        <span>₹{unitPrice.toLocaleString('en-IN')}</span>
                      </div>
                      {adj && lineSave > 0 && (
                        <div className="flex items-center justify-between text-emerald-700">
                          <span>Coupon / promo (server)</span>
                          <span>-₹{lineSave.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {!adj && (
                        <div className="flex items-center justify-between">
                          <span>Catalog discount</span>
                          <span>{discountAmount > 0 ? `-₹${discountAmount.toLocaleString('en-IN')}` : '₹0'}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-0.5 text-sm font-semibold text-neutral-900">
                        <span>Line total</span>
                        <span>₹{lineFinal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 sm:mt-5 rounded-lg bg-neutral-50 p-4 space-y-2">
              {discountPreview && !discountPreviewError && discountPreview.originalPrice != null && (
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>Subtotal</span>
                  <span>₹{Number(discountPreview.originalPrice).toLocaleString('en-IN')}</span>
                </div>
              )}
              {discountPreview && !discountPreviewError && Number(discountPreview.discountAmount) > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Discount{discountPreview.discountPercentage != null ? ` (${Number(discountPreview.discountPercentage).toFixed(1)}%)` : ''}</span>
                  <span>-₹{Number(discountPreview.discountAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                <p className="text-sm text-neutral-700">Total (server)</p>
                <p className="text-sm font-semibold text-neutral-900">
                  ₹{Number(cartTotal).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              disabled={items.length === 0}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Checkout
            </button>
          </aside>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[7100] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900">Remove item?</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Are you sure you want to delete "{deleteTarget.name}" from cart?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveItem(deleteTarget.id, deleteTarget.name)}
                className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage

