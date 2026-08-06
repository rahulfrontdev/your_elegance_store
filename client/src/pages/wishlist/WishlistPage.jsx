import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import OptimizedImage from '../../components/common/OptimizedImage'
import { clearWishlist, deleteWishlistItem, fetchWishlist } from '../../api/wishlistApi'
import { useAuth } from '../../context/AuthContext.jsx'

function isAuthError(err) {
  const status = err?.response?.status
  const msg = String(err?.response?.data?.message || err?.response?.data?.error || '').toLowerCase()
  return status === 401 || msg.includes('not authorized') || msg.includes('no token')
}

const WishlistPage = ({ showTitle = true }) => {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [busyItemId, setBusyItemId] = useState('')
  const [clearingAll, setClearingAll] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('failed')
      setError('')
      return
    }

    const loadWishlist = async () => {
      setStatus('loading')
      setError('')
      try {
        const { data } = await fetchWishlist()
        const list = Array.isArray(data)
          ? data
          : data?.data || data?.wishlist || data?.items || data?.products || []
        setItems(Array.isArray(list) ? list : [])
        setStatus('succeeded')
      } catch (err) {
        setStatus('failed')
        if (isAuthError(err)) {
          setError('')
        } else {
          setError(err?.response?.data?.message || 'Unable to load wishlist.')
        }
      }
    }

    loadWishlist()
  }, [isAuthenticated])

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const product = item?.product || item
        const id = product?._id || product?.id || item?._id || item?.id
        return {
          id,
          name: product?.name || 'Untitled product',
          image: product?.imageUrl || product?.image || '',
          price: Number(product?.specialOfferPrice || product?.price || 0),
        }
      }),
    [items]
  )

  const handleRemoveItem = async (event, productId) => {
    event.preventDefault()
    event.stopPropagation()
    if (!productId || busyItemId) return

    setBusyItemId(productId)
    setError('')
    try {
      await deleteWishlistItem(productId)
      setItems((prev) =>
        prev.filter((item) => {
          const product = item?.product || item
          const id = product?._id || product?.id || item?._id || item?.id
          return id !== productId
        })
      )
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to remove item from wishlist.')
    } finally {
      setBusyItemId('')
    }
  }

  const handleClearWishlist = async () => {
    if (clearingAll || normalizedItems.length === 0) return

    setClearingAll(true)
    setError('')
    try {
      await clearWishlist()
      setItems([])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to clear wishlist.')
    } finally {
      setClearingAll(false)
    }
  }

  return (
    <section className="space-y-4">
      {showTitle && <h1 className="text-2xl font-semibold text-neutral-900">Wishlist</h1>}

      {normalizedItems.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClearWishlist}
            disabled={clearingAll}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearingAll ? 'Clearing...' : 'Clear Wishlist'}
          </button>
        </div>
      )}

      {status === 'loading' && <p className="text-sm text-neutral-600">Loading wishlist...</p>}

      {status === 'failed' && !isAuthenticated && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-neutral-700">Sign in to view and save items in your wishlist.</p>
          <Link
            to="/login"
            state={{ from: { pathname: '/wishlist' } }}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </Link>
        </div>
      )}

      {status === 'failed' && isAuthenticated && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {status === 'succeeded' && normalizedItems.length === 0 && (
        <p className="text-sm text-neutral-600">Saved items will appear here.</p>
      )}

      {normalizedItems.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {normalizedItems.map((item) => (
            <Link
              key={item.id}
              to={`/products/${item.id}`}
              className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                {item.image ? (
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    preset="thumb"
                    variant="thumb"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                    No Image
                  </div>
                )}
              </div>
              <h2 className="mt-2 line-clamp-2 text-sm font-medium text-neutral-900">{item.name}</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-800">
                ₹{item.price.toLocaleString('en-IN')}
              </p>
              <button
                type="button"
                onClick={(event) => handleRemoveItem(event, item.id)}
                disabled={busyItemId === item.id}
                className="mt-3 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyItemId === item.id ? 'Removing...' : 'Remove'}
              </button>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default WishlistPage
