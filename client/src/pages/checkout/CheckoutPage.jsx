import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AddressForm from '../../components/address/AddressForm'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useAddresses from '../../hooks/useAddresses'
import {
  buildLineMapByProductId,
  lineUnitFinalAfterDiscount,
  lineUnitOriginal,
  stringifyEntityId,
} from '../../utils/discountPreview'

const emptyForm = () => ({
  fullName: '',
  mobile: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  landmark: '',
  pincode: '',
  country: 'India',
})

function addressId(address) {
  return address?._id || address?.id
}

function pickDefaultAddress(addresses) {
  return addresses.find((address) => address?.isDefault) || addresses[0] || null
}

function userProfileForm(user, previous) {
  return {
    ...previous,
    fullName: previous.fullName || user?.name || user?.fullName || '',
    email: previous.email || user?.email || '',
    mobile: previous.mobile || user?.mobile || user?.phone || '',
    addressLine1: previous.addressLine1 || user?.address?.addressLine1 || '',
    addressLine2: previous.addressLine2 || user?.address?.addressLine2 || '',
    city: previous.city || user?.address?.city || '',
    state: previous.state || user?.address?.state || '',
    pincode: previous.pincode || user?.address?.postalCode || user?.address?.pincode || '',
    country: previous.country || user?.address?.country || 'India',
  }
}

function addressToCheckoutForm(address, user, previous) {
  return {
    ...previous,
    fullName: address?.fullName || previous.fullName || user?.name || user?.fullName || '',
    email: previous.email || user?.email || '',
    mobile: address?.mobileNumber || address?.mobile || address?.phone || previous.mobile || user?.mobile || user?.phone || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    landmark: address?.landmark || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.postalCode || address?.pincode || '',
    country: address?.country || 'India',
  }
}

function checkoutAddressSeed(user) {
  return {
    fullName: user?.name || user?.fullName || '',
    mobileNumber: user?.mobile || user?.phone || '',
    country: 'India',
    addressType: 'Home',
  }
}

let razorpayScriptPromise = null

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    if (razorpayScriptPromise) {
      razorpayScriptPromise.then(resolve)
      return
    }

    razorpayScriptPromise = new Promise((innerResolve) => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => innerResolve(true), { once: true })
        existingScript.addEventListener('error', () => innerResolve(false), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => innerResolve(true)
      script.onerror = () => innerResolve(false)
      document.body.appendChild(script)
    })

    razorpayScriptPromise.then(resolve)
  })

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { items, total, placeOrder, verifyOrderPayment, discountPreview, discountPreviewError, discountPreviewLoading, discountCode } = useCart()
  const { user, isAuthenticated } = useAuth()
  const {
    actionLoading: addressActionLoading,
    addresses,
    createAddress,
    error: addressError,
    fetchAddresses,
    loading: addressesLoading,
    totalAddressCount,
  } = useAddresses()
  const [form, setForm] = useState(() => emptyForm())
  const [currentStep, setCurrentStep] = useState(1)
  const [isGuestCheckout, setIsGuestCheckout] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [addressServerErrors, setAddressServerErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState(null)

  const checkoutItems = useMemo(() => items, [items])
  const checkoutLineById = useMemo(() => {
    const lines = discountPreview?.appliedDiscountDetails?.lines
    if (!Array.isArray(lines)) return new Map()
    return buildLineMapByProductId(lines)
  }, [discountPreview])
  const isLoggedIn = Boolean(isAuthenticated && user)

  useEffect(() => {
    if (!isLoggedIn || !user) return undefined

    let cancelled = false
    const loadSavedAddresses = async () => {
      const result = await fetchAddresses({ page: 1, limit: 10 })
      if (cancelled) return

      setIsGuestCheckout(false)
      if (result.ok && result.addresses.length) {
        const preferredAddress = pickDefaultAddress(result.addresses)
        setSelectedAddressId(String(addressId(preferredAddress)))
        setForm((prev) => addressToCheckoutForm(preferredAddress, user, prev))
        return
      }

      setForm((prev) => userProfileForm(user, prev))
    }

    loadSavedAddresses()
    return () => {
      cancelled = true
    }
  }, [fetchAddresses, isLoggedIn, user])

  const addAddressSeed = useMemo(() => checkoutAddressSeed(user), [user])

  const onSelectSavedAddress = (address) => {
    setSelectedAddressId(String(addressId(address)))
    setIsAddingAddress(false)
    setAddressServerErrors({})
    setStatus(null)
    setForm((prev) => addressToCheckoutForm(address, user, prev))
  }

  const onCreateCheckoutAddress = async (payload) => {
    setAddressServerErrors({})
    const result = await createAddress(payload)

    if (!result.ok) {
      setAddressServerErrors(result.fieldErrors || {})
      setStatus({ type: 'error', message: result.message || 'Could not save address.' })
      return
    }

    const savedAddress = result.address
    if (savedAddress) {
      setSelectedAddressId(String(addressId(savedAddress)))
      setForm((prev) => addressToCheckoutForm(savedAddress, user, prev))
    }
    setIsAddingAddress(false)
    setStatus({ type: 'success', message: 'Address saved and selected for checkout.' })
  }

  const validateCustomerAndAddress = () => {
    if (!form.fullName.trim() || !form.mobile.trim() || !form.email.trim()) {
      setStatus({ type: 'error', message: 'Please enter full name, mobile number and email.' })
      return false
    }
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' })
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' })
      return false
    }
    if (!form.addressLine1.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim() || !form.country.trim()) {
      setStatus({ type: 'error', message: 'Please fill complete shipping address.' })
      return false
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setStatus({ type: 'error', message: 'Please enter a valid 6-digit pincode.' })
      return false
    }
    return true
  }

  const onSaveAndContinue = () => {
    if (!validateCustomerAndAddress()) return
    setStatus(null)
    setCurrentStep(2)
  }

  const onSubmitGuestOrder = async () => {
    if (isPlacingOrder) return
    if (!validateCustomerAndAddress()) return

    const shippingAddress = {
      fullName: form.fullName.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim().toLowerCase(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      country: form.country.trim(),
    }

    const openRazorpayCheckout = async ({ order, razorpayOrder, key }) => {
      const orderId = order?.id || order?._id
      const keyId = key || razorpayOrder?.key
      const backendOrderId = razorpayOrder?.id
      const backendAmount = razorpayOrder?.amount
      const backendCurrency = razorpayOrder?.currency

      if (!orderId || !keyId || !backendOrderId || !backendAmount || !backendCurrency) {
        setStatus({ type: 'error', message: 'Payment session could not be created. Please try again.' })
        return false
      }

      const razorpayReady = await loadRazorpayScript()
      if (!razorpayReady) {
        setStatus({ type: 'error', message: 'Could not load Razorpay. Please check your connection and retry.' })
        return false
      }

      return new Promise((resolve) => {
        const razorpay = new window.Razorpay({
          key: keyId,
          amount: backendAmount,
          currency: backendCurrency,
          order_id: backendOrderId,
          name: 'Checkout Payment',
          description: 'Order payment',
          prefill: {
            name: form.fullName.trim(),
            email: form.email.trim(),
            contact: form.mobile.trim(),
          },
          handler: async (response) => {
            const verifyRes = await verifyOrderPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            if (!verifyRes?.ok) {
              setStatus({
                type: 'error',
                message: `${verifyRes?.message || 'Payment verification failed.'} You can retry payment.`,
              })
              resolve(false)
              return
            }

            setPendingOnlineOrder(null)
            navigate('/checkout/success', {
              state: {
                orderId: verifyRes.order.orderId || verifyRes.order.id,
                orderDbId: verifyRes.order.id,
                totalAmount: verifyRes.order.total,
                paymentMethod: verifyRes.order.paymentMethod,
                appliedDiscountSnapshot: verifyRes.order.appliedDiscountSnapshot,
                formattedAddress: verifyRes.order.formattedAddress,
              },
              replace: true,
            })
            resolve(true)
          },
          modal: {
            ondismiss: () => {
              setStatus({
                type: 'error',
                message: 'Payment was cancelled. Retry to complete this order.',
              })
              resolve(false)
            },
          },
        })

        razorpay.on('payment.failed', () => {
          setStatus({
            type: 'error',
            message: 'Payment failed. Retry to complete this order.',
          })
          resolve(false)
        })

        razorpay.open()
      })
    }

    setStatus(null)
    setIsPlacingOrder(true)
    const res = await placeOrder({
      paymentMethod: 'online',
      shippingAddress,
    })

    if (!res?.ok) {
      setIsPlacingOrder(false)
      setStatus({ type: 'error', message: res?.message || 'Could not place order.' })
      return
    }

    const pendingSession = {
      order: res.order,
      razorpayOrder: res.razorpayOrder,
      key: res.key,
    }
    setPendingOnlineOrder(pendingSession)
    await openRazorpayCheckout(pendingSession)
    setIsPlacingOrder(false)
  }

  const onRetryPayment = async () => {
    if (!pendingOnlineOrder || isPlacingOrder) return
    setStatus(null)
    setIsPlacingOrder(true)

    const orderId = pendingOnlineOrder?.order?.id || pendingOnlineOrder?.order?._id
    const keyId = pendingOnlineOrder?.key || pendingOnlineOrder?.razorpayOrder?.key
    const backendOrderId = pendingOnlineOrder?.razorpayOrder?.id
    const backendAmount = pendingOnlineOrder?.razorpayOrder?.amount
    const backendCurrency = pendingOnlineOrder?.razorpayOrder?.currency
    if (!orderId || !keyId || !backendOrderId || !backendAmount || !backendCurrency) {
      setIsPlacingOrder(false)
      setStatus({ type: 'error', message: 'No pending online payment session found.' })
      return
    }

    const razorpayReady = await loadRazorpayScript()
    if (!razorpayReady) {
      setIsPlacingOrder(false)
      setStatus({ type: 'error', message: 'Could not load Razorpay. Please check your connection and retry.' })
      return
    }

    const razorpay = new window.Razorpay({
      key: keyId,
      amount: backendAmount,
      currency: backendCurrency,
      order_id: backendOrderId,
      name: 'Checkout Payment',
      description: 'Order payment',
      prefill: {
        name: form.fullName.trim(),
        email: form.email.trim(),
        contact: form.mobile.trim(),
      },
      handler: async (response) => {
        const verifyRes = await verifyOrderPayment({
          orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })

        setIsPlacingOrder(false)

        if (!verifyRes?.ok) {
          setStatus({
            type: 'error',
            message: `${verifyRes?.message || 'Payment verification failed.'} You can retry payment.`,
          })
          return
        }

        setPendingOnlineOrder(null)
        navigate('/checkout/success', {
          state: {
            orderId: verifyRes.order.orderId || verifyRes.order.id,
            orderDbId: verifyRes.order.id,
            totalAmount: verifyRes.order.total,
            paymentMethod: verifyRes.order.paymentMethod,
            appliedDiscountSnapshot: verifyRes.order.appliedDiscountSnapshot,
            formattedAddress: verifyRes.order.formattedAddress,
          },
          replace: true,
        })
      },
      modal: {
        ondismiss: () => {
          setIsPlacingOrder(false)
          setStatus({
            type: 'error',
            message: 'Payment was cancelled. Retry to complete this order.',
          })
        },
      },
    })

    razorpay.on('payment.failed', () => {
      setIsPlacingOrder(false)
      setStatus({
        type: 'error',
        message: 'Payment failed. Retry to complete this order.',
      })
    })

    razorpay.open()
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="px-3 sm:px-4 py-4 sm:py-5">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Checkout</h1>
        <p className="mt-2 text-sm text-neutral-600">Your cart is empty.</p>
        <Link to="/products" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">  Checkout</h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">
            Step {currentStep} of 2
          </p>
        </div>
        <Link to="/cart" className="text-xs sm:text-sm font-medium text-blue-600 hover:underline">
          ← Back to cart
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
          {currentStep === 1 ? (
            <>
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">Checkout option</p>
                  {isLoggedIn ? (
                    <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      Logged in checkout
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestCheckout(true)
                        setStatus(null)
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isGuestCheckout
                        ? 'bg-blue-600 text-white'
                        : 'border border-neutral-300 bg-white text-neutral-700'
                        }`}
                    >
                      Continue as Guest
                    </button>
                  )}
                </div>
                {isLoggedIn && (
                  <p className="mt-2 text-xs text-neutral-600">
                    Select a saved address from Address Master or add a new one for this order.
                  </p>
                )}
              </div>

              {(isGuestCheckout || isLoggedIn) && (
                <>
                  {isLoggedIn && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-semibold text-neutral-900">Saved addresses</h2>
                          <p className="mt-1 text-xs text-neutral-600">
                            Default address is selected automatically. You can choose another address or add a new one.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingAddress((prev) => !prev)
                            setAddressServerErrors({})
                            setStatus(null)
                          }}
                          disabled={totalAddressCount >= 3 && !isAddingAddress}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
                        >
                          {isAddingAddress ? 'Select saved address' : totalAddressCount >= 3 ? 'Address limit reached' : 'Add new address'}
                        </button>
                      </div>

                      {addressesLoading ? (
                        <div className="mt-3 space-y-2">
                          {[0, 1].map((item) => (
                            <div key={item} className="h-20 animate-pulse rounded-lg bg-neutral-100" />
                          ))}
                        </div>
                      ) : addressError ? (
                        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                          {addressError}
                        </p>
                      ) : addresses.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {addresses.map((address) => {
                            const id = String(addressId(address))
                            const isSelected = selectedAddressId === id
                            return (
                              <label
                                key={id}
                                className={`cursor-pointer rounded-xl border p-3 transition ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10'
                                    : 'border-neutral-200 bg-white hover:border-blue-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="radio"
                                    name="savedAddress"
                                    checked={isSelected}
                                    onChange={() => onSelectSavedAddress(address)}
                                    className="mt-1"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold text-neutral-900">
                                        {address.fullName || 'Saved address'}
                                      </span>
                                      {address.isDefault && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                          Default
                                        </span>
                                      )}
                                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                                        {address.addressType || 'Home'}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs font-medium text-neutral-600">
                                      {address.mobileNumber || address.mobile || address.phone}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-neutral-600">
                                      {[
                                        address.addressLine1,
                                        address.addressLine2,
                                        address.landmark,
                                        address.city,
                                        address.state,
                                        address.postalCode || address.pincode,
                                        address.country,
                                      ]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-center">
                          <p className="text-sm font-medium text-neutral-800">No saved addresses found.</p>
                          <p className="mt-1 text-xs text-neutral-600">Add one here to save it in Address Master.</p>
                        </div>
                      )}

                      {isAddingAddress && (
                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Add new checkout address</h3>
                          <AddressForm
                            initialAddress={addAddressSeed}
                            mode="create"
                            serverErrors={addressServerErrors}
                            submitting={addressActionLoading === 'create'}
                            onCancel={() => {
                              setIsAddingAddress(false)
                              setAddressServerErrors({})
                            }}
                            onSubmit={onCreateCheckoutAddress}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <h2 className="text-sm font-semibold text-neutral-900">Customer details</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                      <span className="text-neutral-700">Full Name</span>
                      <input
                        value={form.fullName}
                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter Name"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-neutral-700">Mobile Number</span>
                      <input
                        value={form.mobile}
                        onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter Mobile number"
                      />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="text-neutral-700">Email ID</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="guest@gmail.com"
                      />
                    </label>
                  </div>

                  <h2 className="text-sm font-semibold text-neutral-900 pt-2">Shipping address</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm sm:col-span-2">
                      <span className="text-neutral-700">Address Line 1</span>
                      <input
                        value={form.addressLine1}
                        onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Flat 12, ABC Apartments"
                      />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="text-neutral-700">Address Line 2</span>
                      <input
                        value={form.addressLine2}
                        onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Near Metro Station"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-neutral-700">City</span>
                      <input
                        value={form.city}
                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-neutral-700">State</span>
                      <input
                        value={form.state}
                        onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-neutral-700">Landmark</span>
                      <input
                        value={form.landmark}
                        onChange={(e) => setForm((p) => ({ ...p, landmark: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Opp Big Bazaar"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-neutral-700">Pincode</span>
                      <input
                        value={form.pincode}
                        onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="text-neutral-700">Country</span>
                      <input
                        value={form.country}
                        onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs text-neutral-600">Delivery details saved</p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {form.fullName} - {form.mobile}
                </p>
                <p className="mt-1 text-xs text-neutral-700">
                  {[form.addressLine1, form.addressLine2, form.city, form.state, form.pincode, form.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Edit address
                </button>
              </div>

              <h2 className="text-sm font-semibold text-neutral-900 pt-2">Payment method</h2>
              <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <p className="font-medium text-neutral-900">Online Payment</p>
                <p className="mt-1 text-xs text-neutral-600">
                  After you place the order, Razorpay opens where you can pay with card, UPI, netbanking, or wallets.
                </p>
              </div>
            </>
          )}

          {status?.message && (
            <p
              className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}
              role="status"
            >
              {status.message}
            </p>
          )}

          {pendingOnlineOrder && (
            <button
              type="button"
              onClick={onRetryPayment}
              disabled={isPlacingOrder}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPlacingOrder ? 'Opening payment...' : 'Retry Online Payment'}
            </button>
          )}

          {currentStep === 1 ? (
            <button
              type="button"
              onClick={onSaveAndContinue}
              disabled={!isGuestCheckout && !isLoggedIn}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Save and Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmitGuestOrder}
              disabled={isPlacingOrder}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPlacingOrder ? 'Placing order...' : 'Place order'}
            </button>
          )}
        </section>

        <aside className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          {currentStep === 1 && !isLoggedIn && (
            <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <h2 className="text-sm font-semibold text-neutral-900">Login or Register</h2>
              <p className="mt-1 text-xs text-neutral-600">
                Already have an account? Login for saved addresses and faster checkout.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/login"
                  state={{ from: '/checkout' }}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  state={{ from: '/checkout' }}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-center text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {currentStep === 1 && isLoggedIn && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <h2 className="text-sm font-semibold text-neutral-900">Signed in</h2>
              <p className="mt-1 text-sm font-medium text-neutral-900">{user?.name || 'Customer'}</p>
              {user?.email ? <p className="mt-0.5 text-xs text-neutral-600">{user.email}</p> : null}
              <p className="mt-2 text-xs text-emerald-800">
                Use your saved addresses on the left to continue checkout.
              </p>
            </div>
          )}

          <h2 className="text-sm font-semibold text-neutral-900">Order summary</h2>
          {discountCode && (
            <p className="mt-2 text-xs text-neutral-600">
              Coupon: <span className="font-semibold text-neutral-900">{discountCode}</span>
              <Link to="/cart" className="ml-2 font-medium text-blue-600 hover:underline">
                Edit in cart
              </Link>
            </p>
          )}
          {!discountCode && discountPreview?.appliedDiscountDetails?.couponCode && (
            <p className="mt-2 text-xs text-emerald-800">
              Auto-applied: <span className="font-semibold">{discountPreview.appliedDiscountDetails.couponCode}</span>
            </p>
          )}
          {!discountCode &&
            !discountPreview?.appliedDiscountDetails?.couponCode &&
            Number(discountPreview?.discountAmount) > 0 && (
              <p className="mt-2 text-xs text-neutral-600">Promotional pricing applied (no coupon needed).</p>
            )}
          {discountPreviewLoading && <p className="mt-2 text-xs text-neutral-500">Syncing prices…</p>}
          {discountPreviewError && (
            <p className="mt-2 text-xs font-medium text-red-600" role="alert">
              {discountPreviewError}
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {checkoutItems.map((i) => {
              const adj = checkoutLineById.get(stringifyEntityId(i.id))
              const unitAfter = adj ? lineUnitFinalAfterDiscount(adj, i.qty) : null
              const unitOrig = adj ? lineUnitOriginal(adj) : null
              const unitDisplay =
                unitAfter != null && Number.isFinite(unitAfter) && unitAfter >= 0 ? unitAfter : Number(i.price) || 0
              const lineTotal =
                adj?.lineFinalTotal != null && Number.isFinite(Number(adj.lineFinalTotal))
                  ? Number(adj.lineFinalTotal)
                  : unitDisplay * i.qty
              const showStrike = unitOrig != null && Number.isFinite(unitOrig) && unitOrig > unitDisplay
              return (
                <li key={i.id} className="rounded-lg bg-neutral-50 p-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate pr-3">{i.name}</span>
                    <span>
                      {showStrike ? (
                        <>
                          <span className="text-xs text-neutral-400 line-through">₹{unitOrig.toLocaleString('en-IN')}</span>{' '}
                          <span className="font-medium text-emerald-900">₹{unitDisplay.toLocaleString('en-IN')}</span>
                        </>
                      ) : (
                        <>₹{unitDisplay.toLocaleString('en-IN')}</>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-600">
                    <span>Qty: {i.qty}</span>
                    <span>Subtotal: ₹{lineTotal.toLocaleString('en-IN')}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 rounded-lg bg-neutral-50 p-4 space-y-2">
            {discountPreview && !discountPreviewError && discountPreview.originalPrice != null && (
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Subtotal</span>
                <span>₹{Number(discountPreview.originalPrice).toLocaleString('en-IN')}</span>
              </div>
            )}
            {discountPreview && !discountPreviewError && Number(discountPreview.discountAmount) > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Discount</span>
                <span>-₹{Number(discountPreview.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
              <p className="text-sm text-neutral-700">Total (server)</p>
              <p className="text-sm font-semibold text-neutral-900">₹{Number(total).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CheckoutPage

