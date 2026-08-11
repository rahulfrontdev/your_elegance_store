export function parseCategories(raw) {
  if (!raw || raw === 'All') return []
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

export function parseProductFilters(searchParams) {
  return {
    q: searchParams.get('q')?.trim() ?? '',
    categories: parseCategories(searchParams.get('category')),
    categoryId: searchParams.get('categoryId')?.trim() ?? '',
    subcategory: searchParams.get('subcategory')?.trim() ?? '',
    subcategoryName: searchParams.get('subcategoryName')?.trim() ?? '',
  }
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.q ||
      filters.categories.length ||
      filters.categoryId ||
      filters.subcategory ||
      filters.subcategoryName
  )
}

export function buildProductsPath(searchParams) {
  const query = searchParams?.toString?.() ?? String(searchParams ?? '')
  return query ? `/products?${query}` : '/products'
}

export function getActiveFilterChips(filters) {
  const chips = []

  if (filters.q) {
    chips.push({ key: 'q', label: `Search: "${filters.q}"` })
  }

  filters.categories.forEach((category) => {
    chips.push({ key: 'category', value: category, label: category })
  })

  if (filters.subcategoryName) {
    chips.push({ key: 'subcategory', label: filters.subcategoryName })
  } else if (filters.subcategory) {
    chips.push({ key: 'subcategory', label: filters.subcategory })
  }

  return chips
}

export function setSearchQuery(searchParams, value) {
  const next = new URLSearchParams(searchParams)
  const trimmed = value.trim()
  if (trimmed) next.set('q', trimmed)
  else next.delete('q')
  return next
}

export function toggleCategoryFilter(searchParams, categoryName) {
  const next = new URLSearchParams(searchParams)
  const current = parseCategories(next.get('category'))

  if (current.includes(categoryName)) {
    const updated = current.filter((name) => name !== categoryName)
    if (updated.length) next.set('category', updated.join(','))
    else {
      next.delete('category')
      next.delete('categoryId')
    }
  } else {
    next.set('category', [...current, categoryName].join(','))
    next.delete('categoryId')
  }

  next.delete('subcategory')
  next.delete('subcategoryName')
  return next
}

export function clearCategoryFilters(searchParams) {
  const next = new URLSearchParams(searchParams)
  next.delete('category')
  next.delete('categoryId')
  next.delete('subcategory')
  next.delete('subcategoryName')
  return next
}

export function removeFilterChip(searchParams, chip) {
  const next = new URLSearchParams(searchParams)

  if (chip.key === 'q') {
    next.delete('q')
    return next
  }

  if (chip.key === 'category') {
    const updated = parseCategories(next.get('category')).filter((name) => name !== chip.value)
    if (updated.length) next.set('category', updated.join(','))
    else {
      next.delete('category')
      next.delete('categoryId')
    }
    return next
  }

  if (chip.key === 'subcategory') {
    next.delete('subcategory')
    next.delete('subcategoryName')
  }

  return next
}

export function filterProducts(products, filters) {
  const normalizedCategories = filters.categories.map((name) => name.toLowerCase())
  const normalizedCategoryId = filters.categoryId.toLowerCase()
  const normalizedSubcategory = filters.subcategory.toLowerCase()
  const normalizedSubcategoryName = filters.subcategoryName.toLowerCase()

  return products.filter((product) => {
    const productCategoryRaw =
      typeof product?.category === 'string' ? product.category : product?.category?.name || product?.category?.slug
    const productCategory = String(productCategoryRaw || '')
      .trim()
      .toLowerCase()
    const productCategorySlug = String(typeof product?.category === 'string' ? '' : product?.category?.slug || '')
      .trim()
      .toLowerCase()
    const productCategoryId = String(product?.category?._id || product?.category?.id || '')
      .trim()
      .toLowerCase()
    const productSubcategoryRaw =
      typeof product?.subcategory === 'string'
        ? product.subcategory
        : product?.subcategory?.name ||
          product?.subcategory?.slug ||
          product?.subCategory?.name ||
          product?.subCategory?.slug
    const productSubcategory = String(productSubcategoryRaw || '')
      .trim()
      .toLowerCase()
    const productSubcategoryId = String(
      product?.subcategory?._id ||
        product?.subcategory?.id ||
        product?.subCategory?._id ||
        product?.subCategory?.id ||
        ''
    )
      .trim()
      .toLowerCase()
    const productName = String(product?.name || product?.title || '')
      .trim()
      .toLowerCase()
    const productSlug = String(product?.slug || '')
      .trim()
      .toLowerCase()
    const hasProductSubcategory = Boolean(productSubcategory || productSubcategoryId)

    const categoryMatches =
      normalizedCategories.length === 0 ||
      normalizedCategories.some((selectedCategory) =>
        [productCategory, productCategorySlug, productCategoryId].includes(selectedCategory)
      ) ||
      (normalizedCategoryId && productCategoryId === normalizedCategoryId)

    if (!categoryMatches) return false

    if (
      normalizedSubcategory &&
      ![productSubcategory, productSubcategoryId].includes(normalizedSubcategory) &&
      (!normalizedSubcategoryName || productSubcategory !== normalizedSubcategoryName) &&
      (hasProductSubcategory ||
        (![productName, productSlug].includes(normalizedSubcategory) &&
          (!normalizedSubcategoryName || ![productName, productSlug].includes(normalizedSubcategoryName))))
    ) {
      return false
    }

    return true
  })
}
