import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AccountPage from '../pages/account/AccountPage'
import CategoryPage from '../pages/category/CategoryPage'
import HomePage from '../pages/home/HomePage'
import AboutPage from '../pages/about/AboutPage'
import TermsPage from '../pages/legal/TermsPage'
import ReturnPolicyPage from '../pages/legal/ReturnPolicyPage'
import ShippingPolicyPage from '../pages/legal/ShippingPolicyPage'
import PrivacyPolicyPage from '../pages/legal/PrivacyPolicyPage'
import ProductDetailPage from '../pages/product-detail/ProductDetailPage'
import ProductsPage from '../pages/products/ProductsPage'
import CartPage from '../pages/cart/CartPage'
import CheckoutPage from '../pages/checkout/CheckoutPage'
import OrderSuccessPage from '../pages/checkout/OrderSuccessPage'
import WishlistPage from '../pages/wishlist/WishlistPage'
import AccountOrdersPage from '../pages/account/AccountOrdersPage'
import AccountOrderDetailsPage from '../pages/account/AccountOrderDetailsPage'
import AccountWishlistPage from '../pages/account/AccountWishlistPage'
import AccountProfilePage from '../pages/account/AccountProfilePage'
import AccountMyAddressPage from '../pages/account/AccountMyAddressPage'
import Register from '../pages/Register'
import Login from '../pages/Login'
import RequireAdmin from '../components/admin/RequireAdmin'
import RequireAuth from '../components/auth/RequireAuth'
import RequireCustomer from '../components/auth/RequireCustomer'
import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminCategories from '../pages/admin/AdminCategories'
import AdminProducts from '../pages/admin/AdminProducts'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminCarousel from '../pages/admin/AdminCarousel'
import AdminDiscounts from '../pages/admin/AdminDiscounts'
import AdminCatalogs from '../pages/admin/AdminCatalogs'
import AdminReels from '../pages/admin/AdminReels'
import ModernCartPage from '../pages/modern/ModernCartPage'
import ModernCheckoutPage from '../pages/modern/ModernCheckoutPage'
import ModernAuthPage from '../pages/modern/ModernAuthPage'
import ModernOrderSuccessPage from '../pages/modern/ModernOrderSuccessPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login roleMode="customer" />} />
      <Route path="/admin/login" element={<Login roleMode="admin" />} />
      <Route path="/modern/cart" element={<ModernCartPage />} />
      <Route path="/modern/checkout" element={<ModernCheckoutPage />} />
      <Route path="/modern/login" element={<ModernAuthPage />} />
      <Route path="/modern/order-success" element={<ModernOrderSuccessPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="carousel" element={<AdminCarousel />} />
        <Route path="reels" element={<AdminReels />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="catalogs" element={<AdminCatalogs />} />
      </Route>
      <Route
        element={
          <RequireCustomer>
            <MainLayout />
          </RequireCustomer>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="return-policy" element={<ReturnPolicyPage />} />
        <Route path="shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<OrderSuccessPage />} />
        <Route element={<RequireAuth />}>
          <Route path="account" element={<AccountPage />}>
            <Route index element={<AccountOrdersPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:orderId" element={<AccountOrderDetailsPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="profile" element={<AccountProfilePage />} />
            <Route path="my-address" element={<AccountMyAddressPage />} />
          </Route>
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
