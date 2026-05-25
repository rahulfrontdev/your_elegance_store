import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../services/api'

const STORED_AUTH_KEY = 'checkout_auth_user'

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORED_AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialAuth = loadStoredAuth()

export const loginUser = createAsyncThunk('auth/loginUser', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload)
    const token = data?.token || data?.data?.token
    const user = data?.user || data?.data?.user
    if (token) localStorage.setItem('token', token)
    if (user) localStorage.setItem(STORED_AUTH_KEY, JSON.stringify(user))
    return { user, token }
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', payload)
      const token = data?.token || data?.data?.token
      const user = data?.user || data?.data?.user
      if (token) localStorage.setItem('token', token)
      if (user) localStorage.setItem(STORED_AUTH_KEY, JSON.stringify(user))
      return { user, token }
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Registration failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialAuth,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem(STORED_AUTH_KEY)
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user || null
        state.token = action.payload.token || null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Login failed'
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user || null
        state.token = action.payload.token || null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Registration failed'
      })
  },
})

export const { logout, clearAuthError } = authSlice.actions
export default authSlice.reducer

