import { useEffect, useMemo, useState } from 'react'
import { fetchCategoryChildren, fetchCategoryTree, fetchRootCategories } from '../api/categoriesApi'

function pickList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.categories)) return payload.categories
  return []
}

function pickId(category) {
  return category?._id || category?.id || ''
}

function pickName(category) {
  return category?.name || category?.title || category?.slug || ''
}

function pickChildren(category) {
  return category?.children || category?.subcategories || category?.subCategories || []
}

function isActiveCategory(category) {
  if (typeof category?.status === 'boolean') return category.status
  if (typeof category?.isActive === 'boolean') return category.isActive
  if (typeof category?.enabled === 'boolean') return category.enabled
  if (typeof category?.status === 'string') {
    return ['active', 'enabled', 'true'].includes(category.status.toLowerCase())
  }
  return true
}

const MAX_CHILD_DEPTH = 6

function productPath(categoryName, subcategory = null, categoryId = '') {
  const params = new URLSearchParams()
  if (categoryName) params.set('category', categoryName)
  if (categoryId) params.set('categoryId', categoryId)
  if (subcategory) {
    const subcategoryId = typeof subcategory === 'object' ? subcategory.id : ''
    const subcategoryName = typeof subcategory === 'object' ? subcategory.name : subcategory
    params.set('subcategory', subcategoryId || subcategoryName)
    if (subcategoryId && subcategoryName) params.set('subcategoryName', subcategoryName)
  }
  return `/products${params.toString() ? `?${params.toString()}` : ''}`
}

function normalizeNavNode(node, rootCategoryName, rootCategoryId) {
  const name = pickName(node)
  const id = pickId(node)
  const children = pickChildren(node)
    .filter((child) => pickName(child) && isActiveCategory(child))
    .map((child) => normalizeNavNode(child, rootCategoryName, rootCategoryId))

  return {
    id: id || name,
    name,
    to: productPath(rootCategoryName, { id, name }, rootCategoryId),
    children,
  }
}

function normalizeNavCategory(category) {
  const categoryName = pickName(category)
  const categoryId = pickId(category)
  const children = pickChildren(category)
    .filter((child) => pickName(child) && isActiveCategory(child))
    .map((child) => normalizeNavNode(child, categoryName, categoryId))

  return {
    id: categoryId || categoryName,
    name: categoryName,
    to: productPath(categoryName, null, categoryId),
    children,
  }
}

async function loadCategoryWithDescendants(category, depth = 0) {
  const categoryId = pickId(category)
  const existingChildren = pickChildren(category)
  const baseChildren = existingChildren.length || !categoryId
    ? existingChildren
    : pickList((await fetchCategoryChildren(categoryId))?.data)

  if (!baseChildren.length || depth >= MAX_CHILD_DEPTH) {
    return { ...category, children: baseChildren }
  }

  const children = await Promise.all(
    baseChildren.map(async (child) => {
      if (!pickId(child)) return child
      try {
        return await loadCategoryWithDescendants(child, depth + 1)
      } catch {
        return child
      }
    })
  )

  return { ...category, children }
}

let cachedCategories = null
let categoriesLoadPromise = null

export async function loadNavigationCategories() {
  if (cachedCategories) return cachedCategories
  if (categoriesLoadPromise) return categoriesLoadPromise

  categoriesLoadPromise = (async () => {
    try {
      try {
        const treeResponse = await fetchCategoryTree()
        const tree = pickList(treeResponse?.data).filter(
          (category) => pickName(category) && isActiveCategory(category)
        )
        if (tree.length) {
          cachedCategories = tree
          return tree
        }
      } catch {
        /* fall back below */
      }

      const rootResponse = await fetchRootCategories()
      const roots = pickList(rootResponse?.data).filter(
        (category) => pickName(category) && isActiveCategory(category)
      )
      const rootsWithChildren = await Promise.all(
        roots.map(async (root) => {
          try {
            return await loadCategoryWithDescendants(root)
          } catch {
            return root
          }
        })
      )
      cachedCategories = rootsWithChildren
      return rootsWithChildren
    } catch {
      cachedCategories = []
      return []
    } finally {
      categoriesLoadPromise = null
    }
  })()

  return categoriesLoadPromise
}

export function useCategoryNavigation() {
  const [categories, setCategories] = useState(() => cachedCategories || [])

  useEffect(() => {
    let cancelled = false

    loadNavigationCategories().then((list) => {
      if (!cancelled) setCategories(list)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(
    () =>
      categories
        .filter((category) => pickName(category) && isActiveCategory(category))
        .map(normalizeNavCategory),
    [categories]
  )
}

export default useCategoryNavigation
