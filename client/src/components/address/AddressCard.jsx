import { Edit3, Eye, MapPin, Star, Trash2 } from 'lucide-react'

function addressId(address) {
  return address?._id || address?.id
}

function addressPostalCode(address) {
  return address?.postalCode || address?.pincode || ''
}

const buttonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'

const AddressCard = ({
  address,
  busyAction = '',
  onDelete,
  onEdit,
  onSetDefault,
  onView,
}) => {
  const id = addressId(address)
  const isDefault = Boolean(address?.isDefault)
  const isBusy = busyAction.endsWith(`:${id}`)
  const setDefaultBusy = busyAction === `default:${id}`
  const deleteBusy = busyAction === `delete:${id}`
  const viewBusy = busyAction === `view:${id}`
  const editBusy = busyAction === `update:${id}`

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
              {address?.addressType || 'Home'}
            </span>
            {isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Star size={12} fill="currentColor" />
                Default
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-semibold text-neutral-950">{address?.fullName || 'Saved address'}</h3>
          <p className="mt-1 text-sm font-medium text-neutral-700">{address?.mobileNumber || address?.mobile || address?.phone}</p>

          <div className="mt-3 flex gap-2 text-sm text-neutral-600">
            <MapPin className="mt-0.5 shrink-0 text-neutral-400" size={16} />
            <p className="leading-6">
              {[
                address?.addressLine1,
                address?.addressLine2,
                address?.landmark,
                address?.city,
                address?.state,
                addressPostalCode(address),
                address?.country,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:max-w-[220px] sm:justify-end">
          <button
            type="button"
            onClick={() => onView(address)}
            disabled={isBusy}
            className={`${buttonBase} border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50`}
          >
            <Eye size={14} />
            {viewBusy ? 'Opening...' : 'View'}
          </button>

          <button
            type="button"
            onClick={() => onEdit(address)}
            disabled={isBusy}
            className={`${buttonBase} border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50`}
          >
            <Edit3 size={14} />
            {editBusy ? 'Saving...' : 'Edit'}
          </button>

          {!isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(address)}
              disabled={isBusy}
              className={`${buttonBase} border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`}
            >
              <Star size={14} />
              {setDefaultBusy ? 'Setting...' : 'Set Default'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(address)}
            disabled={isBusy}
            className={`${buttonBase} border border-red-100 bg-red-50 text-red-700 hover:bg-red-100`}
          >
            <Trash2 size={14} />
            {deleteBusy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default AddressCard
