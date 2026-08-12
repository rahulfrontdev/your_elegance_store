import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { fetchRootCategories } from '../../api/categoriesApi'
import ActiveFilterChips from '../../components/products/ActiveFilterChips'
import PageLoader from '../../components/common/PageLoader'
import { useAuth } from '../../context/AuthContext.jsx'
import { loadProducts } from '../../features/products/productsSlice'
import {
  buildProductsPath,
  clearCategoryFilters,
  filterProducts,
  getActiveFilterChips,
  parseProductFilters,
  removeFilterChip,
  setSearchQuery,
  toggleCategoryFilter,
} from '../../utils/productFilters'
import { sortLabels } from '../../utils/sortAlpha'
import ProductCard from './ProductCard'
import ProductFilter from './ProductFilter'

const SEARCH_DEBOUNCE_MS = 300

const ProductsPage = () => {
  const dispatch = useDispatch()
  const { isAuthenticated } = useAuth()
  const { list: products, status, error } = useSelector((state) => state.products)
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseProductFilters(searchParams), [searchParams])
  const [searchDraft, setSearchDraft] = useState(filters.q)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [filterCategories, setFilterCategories] = useState([])

  useEffect(() => {
    setSearchDraft(filters.q)
  }, [filters.q])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchDraft === filters.q) return
      setSearchParams((prev) => setSearchQuery(prev, searchDraft), { replace: true })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchDraft, filters.q, setSearchParams])

  useEffect(() => {
    const categoryQuery = filters.categories.length === 1 ? filters.categories[0] : undefined
    const params = {}
    if (categoryQuery) params.category = categoryQuery
    if (filters.q) params.q = filters.q
    dispatch(loadProducts(params))
  }, [dispatch, filters.categories.join('|'), filters.q, isAuthenticated])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadFilterCategories = async () => {
      try {
        const response = await fetchRootCategories()
        const roots = response?.data?.data || response?.data || []
        const names = roots.map((cat) => cat?.name).filter(Boolean)
        if (!cancelled && names.length) {
          setFilterCategories(sortLabels(names))
        }
      } catch {
        /* keep fallback from products below */
      }
    }

    loadFilterCategories()
    return () => {
      cancelled = true
    }
  }, [])

  const categoryOptions = useMemo(() => {
    const names = new Set(filterCategories)
    products.forEach((product) => {
      const categoryName =
        typeof product?.category === 'string' ? product.category : product?.category?.name
      if (categoryName) names.add(categoryName)
    })
    filters.categories.forEach((name) => names.add(name))
    return sortLabels(Array.from(names))
  }, [products, filterCategories, filters.categories])

  const filteredProducts = useMemo(() => filterProducts(products, filters), [products, filters])
  const activeChips = useMemo(() => getActiveFilterChips(filters), [filters])
  const returnPath = buildProductsPath(searchParams)

  const handleCategoryToggle = (categoryName) => {
    setSearchParams((prev) => toggleCategoryFilter(prev, categoryName), { replace: true })
  }

  const handleClearCategories = () => {
    setSearchParams((prev) => clearCategoryFilters(prev), { replace: true })
  }

  const handleRemoveChip = (chip) => {
    setSearchParams((prev) => removeFilterChip(prev, chip), { replace: true })
  }

  const handleClearAll = () => {
    setSearchDraft('')
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-neutral-50 to-white p-3 sm:p-4 overflow-x-clip">
      <header className="mb-3 sm:mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Products</h1>
        {/* <p className="mt-1 text-xs sm:text-sm text-neutral-600">
          Combine search and categories — filters stay when you open a product and come back.
        </p> */}
      </header>

      <ActiveFilterChips
        chips={activeChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAll}
        className="mb-4 lg:hidden"
      />

      <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800"
          >
            {isMobileFilterOpen ? 'Hide Filters' : 'Filter & Search'}
          </button>
          <p className="text-xs text-neutral-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {isMobileFilterOpen && (
          <div className="mt-1">
            <ProductFilter
              categories={categoryOptions}
              selectedCategories={filters.categories}
              onCategoryToggle={handleCategoryToggle}
              onClearCategories={handleClearCategories}
              search={searchDraft}
              onSearchChange={setSearchDraft}
              activeChips={activeChips}
              onRemoveChip={handleRemoveChip}
              onClearAll={handleClearAll}
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
          selectedCategories={filters.categories}
          onCategoryToggle={handleCategoryToggle}
          onClearCategories={handleClearCategories}
          search={searchDraft}
          onSearchChange={setSearchDraft}
          activeChips={activeChips}
          onRemoveChip={handleRemoveChip}
          onClearAll={handleClearAll}
          resultCount={filteredProducts.length}
          className="hidden lg:block lg:sticky lg:top-4 lg:z-10 lg:max-h-[calc(100vh-2rem)] lg:w-64 lg:overflow-y-auto lg:scrollbar-hidden"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ActiveFilterChips
            chips={activeChips}
            onRemove={handleRemoveChip}
            onClearAll={handleClearAll}
            className="hidden lg:flex"
          />

          {status === 'loading' ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white py-20">
              <PageLoader label="Loading products…" compact />
            </div>
          ) : status === 'failed' ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 py-20 text-center">
              <p className="text-sm font-medium text-red-700">Failed to load products.</p>
              {error && <p className="mt-2 text-xs text-red-500">{String(error)}</p>}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
              <p className="text-sm font-medium text-neutral-700">No products match your filters.</p>
              {activeChips.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <li key={product._id || product.id || product.slug} className="h-full">
                  <ProductCard product={product} returnPath={returnPath} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductsPage
