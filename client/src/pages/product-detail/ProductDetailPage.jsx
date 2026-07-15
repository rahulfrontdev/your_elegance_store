import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { clearCurrentProduct, loadProductById } from '../../features/products/productsSlice'
import { fetchWishlistStatus, toggleWishlistItem } from '../../api/wishlistApi'
import { stringifyEntityId } from '../../utils/discountPreview'
import { colourToHex, isLightColour } from '../../utils/colourSwatch'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const isActiveDiscount = (value) => value === true || value === 'true' || value === 1 || value === '1'

function ProductGallery({ images, alt, activeImage, onSelectImage }) {
  const gallery = images?.length ? images : []
  const current = activeImage || gallery[0] || ''

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-gradient-to-b from-neutral-50 to-white aspect-square max-h-[min(72vw,340px)] lg:max-h-[380px] flex items-center justify-center p-3">
        {current ? (
          <img
            key={current}
            src={current}
            alt={alt}
            className="max-h-full max-w-full object-contain drop-shadow-sm"
          />
        ) : (
          <span className="text-xs text-neutral-400">No image</span>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => onSelectImage?.(src)}
              className={`h-10 w-10 shrink-0 overflow-hidden rounded-lg border transition ${current === src ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400'
                }`}
            >
              <img src={src} alt={alt} className="h-full w-full object-contain object-center" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function buildColourOptions(productRaw, mappedVariations) {
  const options = []
  const seen = new Set()

  const pushOption = (option) => {
    const key = String(option.colour || '').trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    options.push(option)
  }

  const parentColour = String(productRaw?.colour || '').trim()
  if (parentColour) {
    pushOption({
      id: 'base',
      sku: productRaw?.sku || '',
      name: '',
      description: '',
      colour: parentColour,
      imageUrl: productRaw?.imageUrl || productRaw?.image || '',
      price: null,
      isBase: true,
    })
  }

  mappedVariations.forEach((v) => {
    if (v.colour?.trim()) {
      pushOption({ ...v, isBase: false })
    }
  })

  return options
}

function resolveVariationImageUrl(variation, index, extraImages, hasVariations) {
  const saved = String(variation?.imageUrl || '').trim()
  if (saved) return resolveMediaUrl(saved)
  if (hasVariations && Array.isArray(extraImages) && extraImages[index]) {
    return resolveMediaUrl(String(extraImages[index]).trim())
  }
  return ''
}

function getImagesForColourOption(option, product) {
  if (!product) return []

  const allGallery = Array.isArray(product.images)
    ? product.images.map((img) => String(img || '').trim()).filter(Boolean)
    : []

  if (!option) return allGallery

  const primary = String(option.imageUrl || '').trim()
  if (primary) {
    const rest = allGallery.filter((img) => img !== primary)
    return [primary, ...rest]
  }

  if (allGallery.length > 0) return allGallery

  const fallback = String(product.image || '').trim()
  return fallback ? [fallback] : []
}

function ColourSwatches({ options, selectedIndex, onSelect }) {
  if (!options?.length) return null

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
        Colour
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option, index) => {
          const hex = colourToHex(option.colour)
          const isSelected = selectedIndex === index
          const light = isLightColour(hex)
          return (
            <button
              key={option.id || `${option.colour}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              title={option.colour}
              className={`flex items-center gap-1.5 rounded-full   px-2 py-1 text-[11px] transition ${isSelected
                ? ' cursor-pointer text-white'
                : 'border-neutral-200 cursor-pointer bg-white text-neutral-700 hover:border-neutral-400'
                }`}
            >
              <span
                className="inline-block h-3.5 w-3.5 shrink-0 rounded-full  "
                style={{
                  backgroundColor: hex,
                  borderColor: light ? '#d1d5db' : hex,
                }}
              />
              {/* <span className="font-medium capitalize">{option.colour}</span> */}
            </button>
          )
        })}
      </div>
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
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0)
  const [activeGalleryImage, setActiveGalleryImage] = useState('')

  useEffect(() => {
    if (!productId) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSelectedVariationIndex(0)
    setActiveGalleryImage('')
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
    const image = resolveMediaUrl(productRaw?.imageUrl || productRaw?.image || '')
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
          if (typeof img === 'string') return resolveMediaUrl(img)
          if (img && typeof img === 'object') return resolveMediaUrl(img.url || img.imageUrl || '')
          return ''
        })
        .filter(Boolean)
      : []
    const hasVariationsFlag = Boolean(productRaw?.hasVariations)

    const variationsRaw = Array.isArray(productRaw?.variations) ? productRaw.variations : []
    const variations = variationsRaw.map((v, index) => ({
      id: v?._id || `${id}-var-${index}`,
      sku: v?.sku || '',
      name: v?.name || '',
      description: v?.description || '',
      colour: v?.colour || '',
      imageUrl: resolveVariationImageUrl(v, index, normalizedExtraImages, hasVariationsFlag),
      price: v?.price != null ? Number(v.price) : null,
      isBase: false,
    }))

    const assignedVariationImages = new Set(
      variations.map((v) => v.imageUrl).filter(Boolean)
    )
    const galleryExtras = normalizedExtraImages.filter((img) => !assignedVariationImages.has(img))
    const gallery = Array.from(new Set([image, ...galleryExtras].filter(Boolean)))
    const reviewsRaw =
      (Array.isArray(productRaw?.reviews) && productRaw.reviews) ||
      (Array.isArray(productRaw?.ratings) && productRaw.ratings) ||
      []
    const reviews = reviewsRaw
      .filter((review) => {
        const status = String(review?.status || 'approved').toLowerCase()
        return status === 'approved'
      })
      .map((review, index) => ({
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

    const colourOptions = buildColourOptions(productRaw, variations)

    return {
      ...productRaw,
      id,
      category: categoryLabel,
      image,
      images: gallery,
      variations,
      colourOptions,
      hasVariations: Boolean(
        productRaw?.hasVariations ||
        variations.length > 0 ||
        colourOptions.length > 1
      ),
      showColourSelector: colourOptions.length >= 2,
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

  const selectedOption = useMemo(() => {
    if (!product?.colourOptions?.length) return null
    const idx = Math.min(selectedVariationIndex, product.colourOptions.length - 1)
    return product.colourOptions[idx] || null
  }, [product, selectedVariationIndex])

  const displayName = selectedOption?.name?.trim() || product?.name || ''
  const displayDescription =
    selectedOption?.description?.trim() || product?.description || ''

  const displayGallery = useMemo(() => {
    return getImagesForColourOption(selectedOption, product)
  }, [product, selectedOption])

  useEffect(() => {
    const nextImage = displayGallery[0] || ''
    if (nextImage) {
      setActiveGalleryImage(nextImage)
    }
  }, [displayGallery, selectedVariationIndex])

  const handleVariationSelect = (index) => {
    setSelectedVariationIndex(index)
    setCartMessage('')
    const option = product?.colourOptions?.[index]
    const nextImage = getImagesForColourOption(option, product)[0] || ''
    if (nextImage) {
      setActiveGalleryImage(nextImage)
    }
  }

  const basePrice = useMemo(() => {
    if (selectedOption?.price != null && selectedOption.price >= 0) {
      return selectedOption.price
    }
    return product?.price ?? 0
  }, [product?.price, selectedOption])

  const displayPrice = useMemo(
    () => basePrice,
    [basePrice]
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
      <div className="px-4 py-10 text-center">
        <p className="text-xs text-neutral-500">Loading product...</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="text-base font-semibold text-neutral-900">Unable to load product</h1>
        <p className="mt-1 text-xs text-neutral-500">{String(error || 'Please try again.')}</p>
        <Link to={backToProductsPath} className="mt-4 inline-block text-xs font-medium text-neutral-700 hover:underline">
          ← Back to products
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="text-base font-semibold text-neutral-900">Product not found</h1>
        <p className="mt-1 text-xs text-neutral-500">This item may have been removed.</p>
        <Link to={backToProductsPath} className="mt-4 inline-block text-xs font-medium text-neutral-700 hover:underline">
          ← Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4 sm:py-4">
      <nav className="mb-3 text-[11px] text-neutral-500">
        <Link to={backToProductsPath} className="hover:text-neutral-900 transition-colors">
          ← Products
        </Link>
        <span className="mx-1.5 text-neutral-300">/</span>
        <span className="text-neutral-700 line-clamp-1">{displayName || product.name}</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_1.05fr]">
          {/* Image column */}
          <div className="border-b lg:border-b-0 lg:border-r border-neutral-100 p-3 sm:p-4">
            <ProductGallery
              key={`${product.id}-${selectedVariationIndex}`}
              images={displayGallery}
              alt={displayName}
              activeImage={activeGalleryImage}
              onSelectImage={setActiveGalleryImage}
            />
          </div>

          {/* Info column */}
          <div className="flex flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  {product.brand || product.category}
                </p>
                <h1 className="mt-1 text-lg font-bold leading-snug text-neutral-900 sm:text-xl">
                  {displayName}
                </h1>
                {(selectedOption?.sku || product.sku) && (
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    SKU: {selectedOption?.sku || product.sku}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 border border-amber-100">
                  <span aria-hidden>
                    {'★'.repeat(Math.max(0, Math.min(5, roundedAverageRating)))}
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-neutral-500">({product.reviewCount || 0})</span>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                {product.category}
              </span>
              {selectedOption?.colour && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 capitalize">
                  {selectedOption.colour}
                </span>
              )}
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                In Stock
              </span>
            </div>

            {product.showColourSelector && (
              <ColourSwatches
                options={product.colourOptions}
                selectedIndex={selectedVariationIndex}
                onSelect={handleVariationSelect}
              />
            )}

            <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-neutral-100 pt-3">
              <div>
                <p className="text-xl font-bold text-neutral-900 sm:text-2xl">
                  ₹{displayPrice.toLocaleString('en-IN')}
                </p>
                {strikePrice != null && strikePrice > displayPrice && (
                  <p className="text-xs text-neutral-400 line-through">
                    ₹{strikePrice.toLocaleString('en-IN')}
                  </p>
                )}
                {savingAmount > 0 && (
                  <p className="text-[11px] font-medium text-emerald-600">
                    Save ₹{savingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-neutral-400">Inclusive of all taxes</p>
              </div>
              {product.hasActiveDiscount && product.campaignLabel && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-100">
                  {product.campaignLabel}
                </span>
              )}
            </div>

            {displayDescription && (
              <p className="mt-3 text-xs leading-relaxed text-neutral-600 line-clamp-4 sm:line-clamp-5">
                {displayDescription}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={isInCart ? () => navigate('/cart') : handleCartSubmit}
                className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                {isInCart ? 'Go to Cart' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-base transition hover:bg-neutral-50 disabled:opacity-60"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isWishlisted ? '❤️' : '🤍'}
              </button>
            </div>
            {cartMessage && (
              <p className="mt-2 text-xs text-emerald-600 font-medium">{cartMessage}</p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">Reviews</h2>
          <span className="text-[11px] text-neutral-500">
            {product.reviewCount || product.reviews.length} total
          </span>
        </div>

        {product.reviews.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-500">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {product.reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-neutral-900">{review.userName}</p>
                  <p className="text-[10px] text-neutral-400">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN') : ''}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-amber-600">
                  {'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}
                  {'☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(review.rating))))}
                </p>
                {review.comment && (
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ProductDetailPage
