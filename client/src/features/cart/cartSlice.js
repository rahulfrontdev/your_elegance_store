import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const existing = state.items.find((i) => i.id === action.payload.id)
      if (existing) {
        existing.qty += action.payload.qty ?? 1
      } else {
        state.items.push({ ...action.payload, qty: action.payload.qty ?? 1 })
      }
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    updateQty(state, action) {
      const item = state.items.find((i) => i.id === action.payload.id)
      if (item) item.qty = Math.max(1, action.payload.qty)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addItem, removeItem, updateQty, clearCart } = cartSlice.actions
export default cartSlice.reducer
