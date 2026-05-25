function valueOrDash(value) {
  return value || '-'
}

function fieldValue(address, key) {
  if (key === 'mobileNumber') return address.mobileNumber || address.mobile || address.phone
  if (key === 'postalCode') return address.postalCode || address.pincode
  return address[key]
}

const fields = [
  ['fullName', 'Full name'],
  ['mobileNumber', 'Mobile number'],
  ['alternateMobileNumber', 'Alternate mobile'],
  ['addressLine1', 'Address line 1'],
  ['addressLine2', 'Address line 2'],
  ['landmark', 'Landmark'],
  ['city', 'City'],
  ['state', 'State'],
  ['country', 'Country'],
  ['postalCode', 'Postal code'],
  ['addressType', 'Address type'],
]

const AddressDetailsModal = ({ address, onClose }) => {
  if (!address) return null

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">Address details</h2>
            <p className="mt-1 text-sm text-neutral-600">Latest details fetched from the address API.</p>
          </div>
          {address.isDefault && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Default
            </span>
          )}
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <div key={key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-neutral-900">
                {valueOrDash(fieldValue(address, key))}
              </dd>
            </div>
          ))}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Default address</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">{address.isDefault ? 'Yes' : 'No'}</dd>
          </div>
        </dl>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddressDetailsModal
