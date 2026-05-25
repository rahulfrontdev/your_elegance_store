import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { loadCategoryById } from '../../features/categories/categoriesSlice'
import { loadProductsByCategory } from '../../features/products/productsSlice'
import ProductCard from '../products/ProductCard'

const CategoryPage = () => {
  const { categoryId } = useParams()
  const dispatch = useAppDispatch()
  const { current: category, status: catStatus } = useAppSelector((s) => s.categories)
  const { list: products, status: prodStatus, error } = useAppSelector((s) => s.products)

  useEffect(() => {
    if (!categoryId) return
    dispatch(loadCategoryById(categoryId))
  }, [dispatch, categoryId])

  useEffect(() => {
    if (!categoryId) return
    const categoryQuery = category?.name || category?.slug || categoryId
    dispatch(loadProductsByCategory(categoryQuery))
  }, [dispatch, categoryId, category?.name, category?.slug])

  return (
    <section>
      <h1>Category</h1>
      {catStatus === 'loading' && <p>Loading category…</p>}
      {category && (
        <p>
          <strong>{category.name ?? category.title ?? categoryId}</strong>
        </p>
      )}
      <h2>Products in this category</h2>
      {prodStatus === 'loading' && <p>Loading products…</p>}
      {prodStatus === 'failed' && <p role="alert">{String(error)}</p>}
      {prodStatus === 'succeeded' && products.length === 0 && <p>No products found.</p>}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p._id ?? p.id ?? p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default CategoryPage
