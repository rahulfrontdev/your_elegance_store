import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, MapPin, Plus, Search, X } from 'lucide-react'
import AddressCard from '../../components/address/AddressCard'
import AddressDetailsModal from '../../components/address/AddressDetailsModal'
import AddressForm from '../../components/address/AddressForm'
import AddressSkeleton from '../../components/address/AddressSkeleton'
import AddressToast from '../../components/address/AddressToast'
import ConfirmModal from '../../components/address/ConfirmModal'
import { useAuth } from '../../context/AuthContext.jsx'
import useAddresses from '../../hooks/useAddresses'

const emptyFilters = { city: '', state: '', search: '' }

function addressId(address) {
  return address?._id || address?.id
}

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  )
}

const AccountMyAddressPage = () => {
  const { isAuthenticated } = useAuth()
  const {
    actionLoading,
    addresses,
    createAddress,
    deleteAddress,
    error,
    fetchAddresses,
    loading,
    meta,
    refreshAddressCount,
    setDefaultAddress,
    totalAddressCount,
    updateAddress,
    viewAddress,
  } = useAddresses()
  const [filters, setFilters] = useState(emptyFilters)
  const [activeFilters, setActiveFilters] = useState({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [detailAddress, setDetailAddress] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [serverErrors, setServerErrors] = useState({})
  const [toast, setToast] = useState(null)

  const canAddAddress = totalAddressCount < 3
  const isEditing = Boolean(editingAddress)
  const formMode = isEditing ? 'edit' : 'create'
  const submittingForm = actionLoading === 'create' || actionLoading.startsWith('update:')
  const hasActiveFilters = Object.keys(activeFilters).length > 0

  const countLabel = useMemo(() => {
    const total = meta?.total ?? addresses.length
    if (hasActiveFilters) return `${addresses.length} matched of ${totalAddressCount || total} saved`
    return `${totalAddressCount || total} of 3 saved`
  }, [addresses.length, hasActiveFilters, meta?.total, totalAddressCount])

  const loadAddresses = useCallback(async () => {
    await fetchAddresses({ page: 1, limit: 10, ...activeFilters })
    await refreshAddressCount().catch(() => undefined)
  }, [activeFilters, fetchAddresses, refreshAddressCount])

  useEffect(() => {
    if (!isAuthenticated) return
    loadAddresses()
  }, [isAuthenticated, loadAddresses])

  const closeToast = useCallback(() => setToast(null), [])

  const openCreateForm = () => {
    if (!canAddAddress) return
    setEditingAddress(null)
    setServerErrors({})
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setEditingAddress(null)
    setServerErrors({})
    setIsFormOpen(false)
  }

  const handleFilterSubmit = (event) => {
    event.preventDefault()
    setActiveFilters(cleanFilters(filters))
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setActiveFilters({})
  }

  const handleView = async (address) => {
    const result = await viewAddress(addressId(address))
    if (!result.ok) {
      setToast({ type: 'error', message: result.message })
      return
    }
    setDetailAddress(result.address)
  }

  const handleEdit = async (address) => {
    setServerErrors({})
    const result = await viewAddress(addressId(address))
    if (!result.ok) {
      setToast({ type: 'error', message: result.message })
      return
    }
    setEditingAddress(result.address)
    setIsFormOpen(true)
  }

  const handleSubmitAddress = async (payload) => {
    setServerErrors({})
    const result = isEditing
      ? await updateAddress(addressId(editingAddress), payload)
      : await createAddress(payload)

    if (!result.ok) {
      setServerErrors(result.fieldErrors || {})
      setToast({ type: 'error', message: result.message })
      return
    }

    setToast({
      type: 'success',
      message: isEditing ? 'Address updated successfully.' : 'Address added successfully.',
    })
    closeForm()
  }

  const handleSetDefault = async (address) => {
    const result = await setDefaultAddress(addressId(address))
    setToast({
      type: result.ok ? 'success' : 'error',
      message: result.ok ? 'Default address updated.' : result.message,
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteAddress(addressId(deleteTarget))
    setToast({
      type: result.ok ? 'success' : 'error',
      message: result.ok ? 'Address deleted successfully.' : result.message,
    })
    if (result.ok) setDeleteTarget(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <MapPin className="mx-auto mb-3 text-neutral-400" size={32} />
        <h2 className="text-lg font-semibold text-neutral-900">Sign in to manage addresses</h2>
        <p className="mt-2 text-sm text-neutral-600">Your saved delivery addresses are available after login.</p>
        <Link
          to="/login"
          state={{ from: '/account/my-address' }}
          className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Login to continue
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AddressToast toast={toast} onClose={closeToast} />

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">My Address</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage delivery locations and choose your default checkout address.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{countLabel}</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          disabled={!canAddAddress}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          <Plus size={16} />
          {canAddAddress ? 'Add New Address' : 'Maximum 3 addresses saved'}
        </button>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Filter size={16} className="text-neutral-500" />
          Search and filter
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Search</span>
            <input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              placeholder="Search Hyderabad"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">City</span>
            <input
              value={filters.city}
              onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              placeholder="Hyderabad"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">State</span>
            <input
              value={filters.state}
              onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              placeholder="Telangana"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 md:flex-none"
            >
              <Search size={15} />
              Apply
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-[42px] items-center justify-center rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                aria-label="Clear filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_440px] lg:items-start">
        <section className="min-w-0 space-y-3">
          {loading ? (
            <AddressSkeleton />
          ) : addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
              <MapPin className="mx-auto mb-3 text-neutral-400" size={32} />
              <h3 className="text-base font-semibold text-neutral-900">
                {hasActiveFilters ? 'No addresses match your filters.' : 'No addresses saved yet.'}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                {hasActiveFilters
                  ? 'Try another city, state, or search term.'
                  : 'Add your first address to make checkout faster.'}
              </p>
              {!hasActiveFilters && canAddAddress && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add address
                </button>
              )}
            </div>
          ) : (
            addresses.map((address) => (
              <AddressCard
                key={addressId(address)}
                address={address}
                busyAction={actionLoading}
                onDelete={setDeleteTarget}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onView={handleView}
              />
            ))
          )}
        </section>

        <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          {isFormOpen ? (
            <>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-neutral-950">
                  {isEditing ? 'Edit address' : 'Add new address'}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Fill all required fields. Backend validation messages appear below each field.
                </p>
              </div>
              <AddressForm
                initialAddress={editingAddress}
                mode={formMode}
                serverErrors={serverErrors}
                submitting={submittingForm}
                onCancel={closeForm}
                onSubmit={handleSubmitAddress}
              />
            </>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <h3 className="text-base font-semibold text-neutral-950">Address rules</h3>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                <li>Users can save up to 3 addresses.</li>
                <li>The first address becomes default automatically.</li>
                <li>Only one address can be marked as default.</li>
                <li>Use search, city, or state filters to find saved addresses.</li>
              </ul>
              <button
                type="button"
                onClick={openCreateForm}
                disabled={!canAddAddress}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {canAddAddress ? 'Add New Address' : 'Address limit reached'}
              </button>
            </div>
          )}
        </aside>
      </div>

      {detailAddress && (
        <AddressDetailsModal address={detailAddress} onClose={() => setDetailAddress(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete address?"
          description={`This will remove ${deleteTarget.fullName || 'this address'} from your saved addresses.`}
          confirmLabel="Delete address"
          isSubmitting={actionLoading === `delete:${addressId(deleteTarget)}`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

export default AccountMyAddressPage

