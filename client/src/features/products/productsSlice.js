import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as productsApi from '../../api/productsApi'

export const loadProducts = createAsyncThunk(
  'products/loadAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await productsApi.fetchProducts(params)
      const products = normalizeProductsPayload(data)
      const dealProducts = await fetchDiscountedProductsSafely()
      return mergeDiscountFields(products, dealProducts)
    } catch (err) {
      return rejectWithValue(err.response?.data ?? err.message)
    }
  }
)

export const loadProductById = createAsyncThunk(
  'products/loadById',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await productsApi.fetchProductById(productId)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data ?? err.message)
    }
  }
)

export const loadProductsByCategory = createAsyncThunk(
  'products/loadByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const { data } = await productsApi.fetchProductsByCategory(categoryId)
      const products = normalizeProductsPayload(data)
      const dealProducts = await fetchDiscountedProductsSafely()
      return mergeDiscountFields(products, dealProducts)
    } catch (err) {
      return rejectWithValue(err.response?.data ?? err.message)
    }
  }
)

const initialState = {
  list: [],
  current: null,
  status: 'idle',
  error: null,
}

function normalizeProductsPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.products)) return payload.data.products
  if (Array.isArray(payload?.products)) return payload.products
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function productKey(product) {
  const id = product?._id ?? product?.id
  return id == null ? '' : String(id)
}

async function fetchDiscountedProductsSafely() {
  try {
    const { data } = await productsApi.fetchBestDealProducts()
    return normalizeProductsPayload(data)
  } catch {
    return []
  }
}

function mergeDiscountFields(products, discountedProducts) {
  const saleById = new Map()
  discountedProducts.forEach((p) => {
    const id = productKey(p)
    if (id) saleById.set(id, p)
  })
  return products.map((p) => {
    const sale = saleById.get(productKey(p))
    return sale ? { ...p, ...sale } : p
  })
}

function normalizeProductPayload(payload) {
  return payload?.data?.product || payload?.product || payload?.data || payload || null
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct(state) {
      state.current = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = normalizeProductsPayload(action.payload)
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
      })
      .addCase(loadProductById.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadProductById.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.current = normalizeProductPayload(action.payload)
      })
      .addCase(loadProductById.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
      })
      .addCase(loadProductsByCategory.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadProductsByCategory.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = normalizeProductsPayload(action.payload)
      })
      .addCase(loadProductsByCategory.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
      })
  },
})

export const { clearCurrentProduct } = productsSlice.actions
export default productsSlice.reducer
