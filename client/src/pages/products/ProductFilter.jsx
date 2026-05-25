const ProductFilter = ({
  categories = ['All'],
  category,
  onCategoryChange,
  search,
  onSearchChange,
  onClear,
  resultCount,
  className = '',
  onApply,
}) => {
  return (
    <aside className={`w-full shrink-0 self-start rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Reset
        </button>
      </div>

      <p className="mb-4 text-xs text-neutral-500">
        {resultCount} {resultCount === 1 ? 'product' : 'products'}
      </p>

      <div className="mb-5">
        <label htmlFor="product-search" className="mb-1 block text-xs font-medium text-neutral-700">
          Search
        </label>
        <input
          id="product-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Name or brand"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mb-5">
        <h3 className="mb-2 text-xs font-medium text-neutral-700">Category</h3>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
              <input
                type="radio"
                name="product-category"
                checked={category === cat}
                onChange={() => onCategoryChange(cat)}
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
          Apply Filters
        </button>
      )}
    </aside>
  )
}

export default ProductFilter
