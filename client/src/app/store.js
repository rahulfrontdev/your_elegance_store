import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '../features/cart/cartSlice'
import categoriesReducer from '../features/categories/categoriesSlice'
import productsReducer from '../features/products/productsSlice'
import authReducer from '../redux/authSlice'
import checkoutCartReducer from '../redux/checkoutCartSlice'
import orderReducer from '../redux/orderSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    categories: categoriesReducer,
    products: productsReducer,
    auth: authReducer,
    checkoutCart: checkoutCartReducer,
    order: orderReducer,
  },
})

/** @typedef {ReturnType<typeof store.getState>} RootState */
/** @typedef {typeof store.dispatch} AppDispatch */
