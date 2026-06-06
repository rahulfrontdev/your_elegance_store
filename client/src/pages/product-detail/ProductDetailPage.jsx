import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { clearCurrentProduct, loadProductById } from '../../features/products/productsSlice'
import { fetchWishlistStatus, toggleWishlistItem } from '../../api/wishlistApi'
import { stringifyEntityId } from '../../utils/discountPreview'

const isActiveDiscount = (value) => value === true || value === 'true' || value === 1 || value === '1'

/** Isolated so `key={productId}` on the parent remount resets the selected image without an effect. */
function ProductGallery({ product }) {
  const gallery = product.images?.length ? product.images : [product.image]
  const [activeImage, setActiveImage] = useState(gallery[0])

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 h-[260px] sm:h-[320px] lg:h-[390px]">
        <img src={activeImage || product.image} alt={product.name} className="h-full w-full object-contain" />
      </div>
      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActiveImage(src)}
              className={`h-12 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === src ? 'border-blue-600' : 'border-transparent'
                }`}
            >
              <img src={src} alt={product.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const ProductDetailPage = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backToProductsPath =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/products')
      ? location.state.from
      : '/products'
  const dispatch = useAppDispatch()
  const { current: productRaw, status, error } = useAppSelector((s) => s.products)
  const { isAuthenticated } = useAuth()
  const { addItem, getItem } = useCart()
  const [cartMessage, setCartMessage] = useState('')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (!productId) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    dispatch(loadProductById(productId))
    return () => {
      dispatch(clearCurrentProduct())
    }
  }, [dispatch, productId])

  useEffect(() => {
    if (!isAuthenticated || !productId) {
      setIsWishlisted(false)
      return
    }

    const loadWishlistStatus = async () => {
      try {
        const { data } = await fetchWishlistStatus(productId)
        const payload = data?.data || data
        const statusValue = Boolean(
          payload?.isWishlisted ?? payload?.wishlisted ?? payload?.inWishlist ?? payload?.status
        )
        setIsWishlisted(statusValue)
      } catch {
        setIsWishlisted(false)
      }
    }

    loadWishlistStatus()
  }, [productId, isAuthenticated])

  const product = useMemo(() => {
    if (!productRaw) return null
    const id = stringifyEntityId(productRaw?._id || productRaw?.id || productId)
    const categoryLabel =
      typeof productRaw?.category === 'string'
        ? productRaw.category
        : productRaw?.category?.name || ''
    const image = productRaw?.imageUrl || productRaw?.image || ''
    const discountAmountRaw = Number(productRaw?.discountAmount ?? 0)
    const discountPercentRaw = Number(productRaw?.discountPercentage ?? 0)
    const hasActiveDiscount =
      isActiveDiscount(productRaw?.hasActiveDiscount) ||
      productRaw?.discountedPrice != null ||
      discountAmountRaw > 0 ||
      discountPercentRaw > 0
    const listPriceRaw = Number(productRaw?.originalPrice ?? productRaw?.price ?? 0)
    const offerFromProduct = hasActiveDiscount
      ? Number(productRaw?.discountedPrice ?? productRaw?.price ?? 0)
      : Number(productRaw?.price ?? 0)
    const normalizedExtraImages = Array.isArray(productRaw?.images)
      ? productRaw.images
        .map((img) => {
          if (typeof img === 'string') return img
          if (img && typeof img === 'object') return img.url || img.imageUrl || ''
          return ''
        })
        .filter(Boolean)
      : []
    const gallery = Array.from(new Set([image, ...normalizedExtraImages].filter(Boolean)))
    const reviewsRaw =
      (Array.isArray(productRaw?.reviews) && productRaw.reviews) ||
      (Array.isArray(productRaw?.ratings) && productRaw.ratings) ||
      []
    const reviews = reviewsRaw.map((review, index) => ({
      id: review?._id || review?.id || `${id}-review-${index}`,
      userName:
        review?.user?.name ||
        review?.userName ||
        review?.name ||
        'Verified customer',
      rating: Number(review?.rating || review?.stars || 0),
      comment: String(review?.comment || review?.review || '').trim(),
      createdAt: review?.createdAt || review?.updatedAt || '',
    }))
    const averageRatingValue =
      Number(productRaw?.averageRating || productRaw?.rating || productRaw?.ratingsAverage || 0)
    const reviewCountValue =
      Number(productRaw?.reviewCount || productRaw?.ratingsCount || productRaw?.numReviews || reviews.length || 0)

    return {
      ...productRaw,
      id,
      category: categoryLabel,
      image,
      images: gallery,
      listPrice: listPriceRaw,
      price: offerFromProduct,
      hasActiveDiscount,
      discountAmount: discountAmountRaw,
      discountPercent: discountPercentRaw,
      campaignLabel: productRaw?.appliedDiscount?.discountName || productRaw?.appliedDiscount?.name || '',
      reviews,
      averageRating: averageRatingValue,
      reviewCount: reviewCountValue,
    }
  }, [productRaw, productId])

  const displayPrice = useMemo(
    () => product?.price ?? 0,
    [product?.price]
  )
  const strikePrice = useMemo(() => {
    if (product?.hasActiveDiscount && product.listPrice > displayPrice) return product.listPrice
    return null
  }, [displayPrice, product])
  const savingAmount = useMemo(
    () => (product?.hasActiveDiscount ? Number(product.discountAmount || 0) : 0),
    [product]
  )

  const averageRating = Number(product?.averageRating || 0)
  const roundedAverageRating = Math.round(averageRating)

  const handleCartSubmit = async () => {
    const res = await addItem(product, 1)
    if (res?.ok === false) {
      alert(res.message || 'Unable to add item to cart.')
      return
    }
    setCartMessage('Cart added successfully.')
  }

  const handleWishlistToggle = async () => {
    if (!productId || wishlistLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${productId}` } } })
      return
    }
    setWishlistLoading(true)
    try {
      const { data } = await toggleWishlistItem(productId)
      const payload = data?.data || data
      const actionValue = data?.action
      const nextValue = payload?.isWishlisted ?? payload?.wishlisted ?? payload?.inWishlist
      if (typeof nextValue === 'boolean') {
        setIsWishlisted(nextValue)
      } else if (actionValue === 'added') {
        setIsWishlisted(true)
      } else if (actionValue === 'removed') {
        setIsWishlisted(false)
      } else {
        setIsWishlisted((prev) => !prev)
      }
    } catch {
      alert('Unable to update wishlist. Please try again.')
    } finally {
      setWishlistLoading(false)
    }
  }

  const isInCart = Boolean(product?.id && getItem(product.id))

  if (status === 'loading') {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-neutral-600">Loading product details...</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">Unable to load product</h1>
        <p className="mt-2 text-sm text-neutral-600">{String(error || 'Please try again.')}</p>
        <Link to={backToProductsPath} className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Back to products
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className=" px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">Product not found</h1>
        <p className="mt-2 text-sm text-neutral-600">This item may have been removed or the link is incorrect.</p>
        <Link to={backToProductsPath} className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-2 sm:px-4 sm:py-4 lg:px-6">
      <nav className="mb-2 text-xs text-neutral-500 sm:mb-3 sm:text-sm">
        <Link to={backToProductsPath} className="hover:text-blue-600">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{product.name}</span>
      </nav>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
          <ProductGallery key={product.id} product={product} />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {product.brand || product.category}
            </p>

            <h1 className="mt-2 text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {product.category}
              </span>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                In Stock
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-blue-700">
                    {product.hasActiveDiscount ? 'Price after active offer' : 'Special price'}
                  </p>
                  <p className="text-2xl font-extrabold text-blue-700 sm:text-3xl">
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </p>
                  {strikePrice != null && strikePrice > displayPrice && (
                    <p className="mt-0.5 text-sm text-neutral-500 line-through">
                      ₹{strikePrice.toLocaleString('en-IN')}
                    </p>
                  )}
                  {savingAmount > 0 && (
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      Save ₹{savingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  )}
                  {product.hasActiveDiscount && product.campaignLabel && (
                    <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      {product.campaignLabel}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    Inclusive of all taxes. Shown price includes any automatic offers from the server.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs">
                  <span className="text-amber-600" aria-hidden>
                    {'★'.repeat(Math.max(0, Math.min(5, roundedAverageRating)))}
                    {'☆'.repeat(5 - Math.max(0, Math.min(5, roundedAverageRating)))}
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-neutral-600">
                    ({product.reviewCount || product.reviews.length})
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700 break-words">
              {product.description}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={isInCart ? () => navigate('/cart') : handleCartSubmit}
              className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 cursor-pointer"
            >
              {isInCart ? 'Go to Cart' : '🛒 Add to Cart'}
            </button>

            <button
              type="button"
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white text-lg hover:bg-neutral-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 sm:w-12"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>
          {cartMessage && (
            <p className="mt-3 text-sm text-green-700 font-medium">{cartMessage}</p>
          )}

        </div>
      </div>
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">Customer Reviews</h2>
          <p className="text-sm text-neutral-600">
            {product.reviewCount || product.reviews.length} review(s)
          </p>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
          <span className="text-base text-amber-500" aria-hidden>
            {'★'.repeat(Math.max(0, Math.min(5, roundedAverageRating)))}
            {'☆'.repeat(5 - Math.max(0, Math.min(5, roundedAverageRating)))}
          </span>
          <span>{averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}</span>
        </div>

        {product.reviews.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">No reviews yet. Be the first to review this product.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {product.reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{review.userName}</p>
                  <p className="text-xs text-neutral-500">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN') : ''}
                  </p>
                </div>
                <p className="mt-1 text-sm text-amber-600">
                  {'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}
                  {'☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(review.rating))))}
                </p>
                {review.comment && <p className="mt-1 text-sm leading-6 text-neutral-700">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ProductDetailPage
