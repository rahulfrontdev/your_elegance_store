import { Link, useLocation, useNavigate } from 'react-router-dom'

const OrderSuccessPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()

  const orderId = state?.orderId
  const totalAmount = Number(state?.totalAmount || 0)
  const paymentMethod = state?.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'
  const snapshot = state?.appliedDiscountSnapshot

  if (!orderId) {
    return (
      <div className="px-3 py-5 sm:px-4">
        <div className="mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-neutral-900">No recent order found</h1>
          <p className="mt-2 text-sm text-neutral-600">Looks like you reached this page directly.</p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-5 sm:px-4">
      <div className="mx-auto max-w-xl rounded-xl border border-green-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-green-700">Order placed successfully</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Thank you for your order</h1>

        <div className="mt-5 space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Order ID</span>
            <span className="font-semibold text-neutral-900">{orderId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Payment</span>
            <span className="font-semibold text-neutral-900">{paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Total</span>
            <span className="font-semibold text-neutral-900">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {snapshot && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Discount breakdown</p>
            {snapshot.subtotal != null || snapshot.subTotal != null ? (
              <div className="mt-2 flex justify-between text-neutral-700">
                <span>Subtotal</span>
                <span>
                  ₹{Number(snapshot.subtotal ?? snapshot.subTotal).toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}
            {snapshot.discountTotal != null && Number(snapshot.discountTotal) > 0 && (
              <div className="mt-1 flex justify-between text-emerald-700">
                <span>Discounts</span>
                <span>-₹{Number(snapshot.discountTotal).toLocaleString('en-IN')}</span>
              </div>
            )}
            {snapshot.couponCode && (
              <p className="mt-2 text-xs text-neutral-600">
                Coupon: <span className="font-medium text-neutral-900">{snapshot.couponCode}</span>
              </p>
            )}
            {snapshot.finalTotal != null && (
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
                <span>Final total</span>
                <span>₹{Number(snapshot.finalTotal).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Array.isArray(snapshot.lines) && snapshot.lines.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-neutral-200 pt-3 text-xs text-neutral-600">
                {snapshot.lines.map((ln, idx) => (
                  <li key={idx} className="flex justify-between gap-2">
                    <span className="line-clamp-2">{ln.name || ln.productName || 'Line'}</span>
                    <span className="shrink-0">
                      {ln.lineDiscountAmount != null && Number(ln.lineDiscountAmount) > 0
                        ? `-₹${Number(ln.lineDiscountAmount).toLocaleString('en-IN')}`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-neutral-600">
          You can track this order from your account orders page.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={state?.orderDbId ? `/account/orders/${state.orderDbId}` : '/account/orders'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View order details
          </Link>
          <Link
            to="/products"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
