import ActiveFilterChips from '../../components/products/ActiveFilterChips'

const ProductFilter = ({
  categories = [],
  selectedCategories = [],
  onCategoryToggle,
  onClearCategories,
  search,
  onSearchChange,
  activeChips = [],
  onRemoveChip,
  onClearAll,
  resultCount,
  className = '',
  onApply,
}) => {
  const hasActiveFilters = activeChips.length > 0

  return (
    <aside
      className={`w-full shrink-0 self-start rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Reset all
          </button>
        )}
      </div>

      <p className="mb-4 text-xs text-neutral-500">
        {resultCount} {resultCount === 1 ? 'product' : 'products'}
      </p>

      <ActiveFilterChips
        chips={activeChips}
        onRemove={onRemoveChip}
        onClearAll={onClearAll}
        className="mb-4"
      />

      <div className="mb-5">
        <label htmlFor="product-search" className="mb-1 block text-xs font-medium text-neutral-700">
          Search
        </label>
        <div className="relative">
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Name, brand, or keyword"
            className="w-full rounded-lg border border-neutral-200 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:text-neutral-700"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium text-neutral-700">Categories</h3>
          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={onClearCategories}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mb-2 text-[11px] text-neutral-500">Select one or more to combine filters.</p>
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => onCategoryToggle(cat)}
                className="accent-blue-600"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      {onApply && (
        <button
          type="button"
          onClick={onApply}
          className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          Show results
        </button>
      )}
    </aside>
  )
}

export default ProductFilter
