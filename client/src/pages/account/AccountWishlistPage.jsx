import WishlistPage from '../wishlist/WishlistPage'

const AccountWishlistPage = () => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">Wishlist</h2>
        <p className="mt-1 text-sm text-neutral-600">Your saved items across the store.</p>
      </div>
      <WishlistPage showTitle={false} />
    </div>
  )
}

export default AccountWishlistPage

