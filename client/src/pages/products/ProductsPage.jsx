import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { loadProducts } from '../../features/products/productsSlice'
import ProductCard from './ProductCard'
import ProductFilter from './ProductFilter'

const ProductsPage = () => {
  const dispatch = useDispatch()
  const { list: products, status, error } = useSelector((state) => state.products)
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category') || 'All'
  const categoryIdFromUrl = searchParams.get('categoryId') || ''
  const subcategoryFromUrl = searchParams.get('subcategory') || ''
  const subcategoryNameFromUrl = searchParams.get('subcategoryName') || ''
  const search = searchParams.get('q') ?? ''

  useEffect(() => {
    const categoryQuery = categoryFromUrl && categoryFromUrl !== 'All' ? categoryFromUrl : undefined
    dispatch(
      loadProducts({
        ...(categoryQuery ? { category: categoryQuery } : {}),
      })
    )
  }, [dispatch, categoryFromUrl])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const category = categoryFromUrl
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const categoryOptions = useMemo(() => {
    const names = new Set()
    products.forEach((p) => {
      const categoryName =
        typeof p?.category === 'string' ? p.category : p?.category?.name
      if (categoryName) names.add(categoryName)
    })
    return ['All', ...Array.from(names)]
  }, [products])

  const setSearch = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value.trim()) next.set('q', value.trim())
        else next.delete('q')
        if (category !== 'All') next.set('category', category)
        else next.delete('category')
        return next
      },
      { replace: true }
    )
  }

  const handleCategoryChange = (nextCategory) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (nextCategory !== 'All') next.set('category', nextCategory)
        else next.delete('category')
        next.delete('subcategory')
        next.delete('subcategoryName')
        return next
      },
      { replace: true }
    )
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const normalizedSelectedCategories =
      category === 'All'
        ? []
        : category
            .split(',')
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean)
      const normalizedSelectedCategoryId = categoryIdFromUrl.trim().toLowerCase()
    const normalizedSelectedSubcategory = subcategoryFromUrl.trim().toLowerCase()
    const normalizedSelectedSubcategoryName = subcategoryNameFromUrl.trim().toLowerCase()

    return products.filter((p) => {
      const productCategoryRaw =
        typeof p?.category === 'string' ? p.category : p?.category?.name || p?.category?.slug
      const productCategory = String(productCategoryRaw || '').trim().toLowerCase()
      const productCategorySlug = String(
        typeof p?.category === 'string' ? '' : p?.category?.slug || ''
      )
        .trim()
        .toLowerCase()
      const productCategoryId = String(
        p?.category?._id || p?.category?.id || ''
      )
        .trim()
        .toLowerCase()
      const productSubcategoryRaw =
        typeof p?.subcategory === 'string'
          ? p.subcategory
          : p?.subcategory?.name || p?.subcategory?.slug || p?.subCategory?.name || p?.subCategory?.slug
      const productSubcategory = String(productSubcategoryRaw || '').trim().toLowerCase()
      const productSubcategoryId = String(
        p?.subcategory?._id || p?.subcategory?.id || p?.subCategory?._id || p?.subCategory?.id || ''
      )
        .trim()
        .toLowerCase()
      const productName = String(p?.name || p?.title || '').trim().toLowerCase()
      const productSlug = String(p?.slug || '').trim().toLowerCase()
      const hasProductSubcategory = Boolean(productSubcategory || productSubcategoryId)

      const categoryMatches =
        normalizedSelectedCategories.length === 0 ||
        normalizedSelectedCategories.some((selectedCategory) =>
          [productCategory, productCategorySlug, productCategoryId].includes(selectedCategory)
        ) ||
        (normalizedSelectedCategoryId && productCategoryId === normalizedSelectedCategoryId)

      if (!categoryMatches) {
        // Backend already filters category, but keep a tolerant UI fallback.
        return false
      }
      if (
        normalizedSelectedSubcategory &&
        ![productSubcategory, productSubcategoryId].includes(normalizedSelectedSubcategory) &&
        (!normalizedSelectedSubcategoryName || productSubcategory !== normalizedSelectedSubcategoryName) &&
        (hasProductSubcategory ||
          ![productName, productSlug].includes(normalizedSelectedSubcategory) &&
            (!normalizedSelectedSubcategoryName ||
              ![productName, productSlug].includes(normalizedSelectedSubcategoryName)))
      ) {
        return false
      }

      if (q) {
        const hay = `${p.name} ${p.brand ?? ''} ${p.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [products, category, categoryIdFromUrl, search, subcategoryFromUrl, subcategoryNameFromUrl])

  const handleClear = () => {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-neutral-50 to-white p-3 sm:p-4">
      <header className="mb-3 sm:mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Products</h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-600">
          Discover curated picks for your daily style.
        </p>
      </header>

      <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800"
          >
            {isMobileFilterOpen ? 'Hide Filters' : 'Filter'}
          </button>
          <p className="text-xs text-neutral-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {isMobileFilterOpen && (
          <div className="mt-1">
            <ProductFilter
              categories={categoryOptions}
              category={category}
              onCategoryChange={handleCategoryChange}
              search={search}
              onSearchChange={setSearch}
              onClear={handleClear}
              resultCount={filteredProducts.length}
              className="border-0 p-0 shadow-none"
              onApply={() => setIsMobileFilterOpen(false)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <ProductFilter
          categories={categoryOptions}
          category={category}
          onCategoryChange={handleCategoryChange}
          search={search}
          onSearchChange={setSearch}
          onClear={handleClear}
          resultCount={filteredProducts.length}
          className="hidden lg:block lg:sticky lg:top-4 lg:z-10 lg:max-h-[calc(100vh-2rem)] lg:w-64 lg:overflow-y-auto"
        />

        {status === 'loading' ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white py-20">
            <p className="text-sm text-neutral-600">Loading products...</p>
          </div>
        ) : status === 'failed' ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 py-20 text-center">
            <p className="text-sm font-medium text-red-700">Failed to load products.</p>
            {error && <p className="mt-2 text-xs text-red-500">{String(error)}</p>}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
            <p className="text-sm font-medium text-neutral-700">No products match your filters.</p>
            <button
              type="button"
              onClick={handleClear}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <li key={product._id || product.id || product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ProductsPage
