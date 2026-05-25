import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../services/api'
import { clearCheckoutCart } from './checkoutCartSlice'

function pickOrderApiError(error) {
  const d = error?.response?.data
  if (typeof d?.message === 'string' && d.message.trim()) return d.message.trim()
  if (Array.isArray(d?.errors)) {
    const parts = d.errors.map((e) => e?.msg || e?.message).filter(Boolean)
    if (parts.length) return parts.join(', ')
  }
  if (typeof d?.error === 'string' && d.error.trim()) return d.error.trim()
  return error?.message || 'Order creation failed'
}

function pickAddressList(data) {
  const payload = data?.data ?? data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.addresses)) return payload.addresses
  if (Array.isArray(payload?.docs)) return payload.docs
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(data?.addresses)) return data.addresses
  return []
}

export const createGuestOrder = createAsyncThunk(
  'order/createGuestOrder',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/orders', payload)
      dispatch(clearCheckoutCart())
      return data?.data?.order || data?.order || data?.data
    } catch (error) {
      return rejectWithValue(pickOrderApiError(error))
    }
  }
)

export const createUserOrder = createAsyncThunk(
  'order/createUserOrder',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/orders', payload)
      dispatch(clearCheckoutCart())
      return data?.data?.order || data?.order || data?.data
    } catch (error) {
      return rejectWithValue(pickOrderApiError(error))
    }
  }
)

export const fetchSavedAddresses = createAsyncThunk(
  'order/fetchSavedAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/address', { params: { page: 1, limit: 10 } })
      return pickAddressList(data)
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to load addresses')
    }
  }
)

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    savedAddresses: [],
    selectedAddressId: '',
    loading: false,
    error: null,
    latestOrder: null,
  },
  reducers: {
    setSelectedAddress(state, action) {
      state.selectedAddressId = action.payload
    },
    clearOrderError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSavedAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.savedAddresses = action.payload
      })
      .addCase(fetchSavedAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load addresses'
      })
      .addCase(createGuestOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createGuestOrder.fulfilled, (state, action) => {
        state.loading = false
        state.latestOrder = action.payload
      })
      .addCase(createGuestOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Guest order failed'
      })
      .addCase(createUserOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUserOrder.fulfilled, (state, action) => {
        state.loading = false
        state.latestOrder = action.payload
      })
      .addCase(createUserOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Order failed'
      })
  },
})

export const { setSelectedAddress, clearOrderError } = orderSlice.actions
export default orderSlice.reducer

