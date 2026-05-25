import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as categoriesApi from '../../api/categoriesApi'

export const loadCategories = createAsyncThunk(
  'categories/loadAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await categoriesApi.fetchCategories()
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data ?? err.message)
    }
  }
)

export const loadCategoryById = createAsyncThunk(
  'categories/loadById',
  async (categoryId, { rejectWithValue }) => {
    try {
      const { data } = await categoriesApi.fetchCategoryById(categoryId)
      return data
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

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCurrentCategory(state) {
      state.current = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadCategories.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = Array.isArray(action.payload) ? action.payload : action.payload?.data ?? []
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
      })
      .addCase(loadCategoryById.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadCategoryById.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.current = action.payload
      })
      .addCase(loadCategoryById.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
      })
  },
})

export const { clearCurrentCategory } = categoriesSlice.actions
export default categoriesSlice.reducer
