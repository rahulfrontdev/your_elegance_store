import { createSlice } from '@reduxjs/toolkit'

const checkoutCartSlice = createSlice({
  name: 'checkoutCart',
  initialState: {
    items: [],
  },
  reducers: {
    updateItemQty(state, action) {
      const { productId, quantity } = action.payload
      state.items = state.items
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    },
    clearCheckoutCart(state) {
      state.items = []
    },
  },
})

export const { updateItemQty, clearCheckoutCart } = checkoutCartSlice.actions
export default checkoutCartSlice.reducer

