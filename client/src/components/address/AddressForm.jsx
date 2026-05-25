import { useEffect, useMemo } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

const ADDRESS_TYPES = ['Home', 'Office', 'Other']

const schema = yup.object({
  fullName: yup.string().trim().required('Full name is required').max(80, 'Maximum 80 characters allowed'),
  mobileNumber: yup
    .string()
    .trim()
    .required('Mobile number is required')
    .matches(/^\d{10}$/, 'Enter a valid 10 digit mobile number'),
  alternateMobileNumber: yup
    .string()
    .trim()
    .test('alternate-mobile', 'Enter a valid 10 digit alternate number', (value) => {
      if (!value) return true
      return /^\d{10}$/.test(value)
    }),
  addressLine1: yup.string().trim().required('Address line 1 is required').max(120, 'Maximum 120 characters allowed'),
  addressLine2: yup.string().trim().max(120, 'Maximum 120 characters allowed'),
  landmark: yup.string().trim().max(80, 'Maximum 80 characters allowed'),
  city: yup.string().trim().required('City is required').max(60, 'Maximum 60 characters allowed'),
  state: yup.string().trim().required('State is required').max(60, 'Maximum 60 characters allowed'),
  country: yup.string().trim().required('Country is required').max(60, 'Maximum 60 characters allowed'),
  postalCode: yup
    .string()
    .trim()
    .required('Postal code is required')
    .matches(/^\d{6}$/, 'Enter a valid 6 digit postal code'),
  addressType: yup.string().oneOf(ADDRESS_TYPES).required('Address type is required'),
  isDefault: yup.boolean(),
})

const inputClass =
  'mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-neutral-100'

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-neutral-500'
const errorClass = 'mt-1 text-xs font-medium text-red-600'

function toFormValues(address) {
  return {
    fullName: address?.fullName || '',
    mobileNumber: address?.mobileNumber || address?.mobile || address?.phone || '',
    alternateMobileNumber: address?.alternateMobileNumber || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    landmark: address?.landmark || '',
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || 'India',
    postalCode: address?.postalCode || address?.pincode || '',
    addressType: address?.addressType || 'Home',
    isDefault: Boolean(address?.isDefault),
  }
}

function buildPayload(values) {
  const payload = {
    fullName: values.fullName.trim(),
    mobileNumber: values.mobileNumber.trim(),
    addressLine1: values.addressLine1.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postalCode: values.postalCode.trim(),
    addressType: values.addressType,
    isDefault: Boolean(values.isDefault),
  }

  if (values.alternateMobileNumber?.trim()) {
    payload.alternateMobileNumber = values.alternateMobileNumber.trim()
  }
  if (values.addressLine2?.trim()) payload.addressLine2 = values.addressLine2.trim()
  if (values.landmark?.trim()) payload.landmark = values.landmark.trim()

  return payload
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const AddressForm = ({
  initialAddress,
  serverErrors = {},
  submitting = false,
  mode = 'create',
  onCancel,
  onSubmit,
}) => {
  const defaultValues = useMemo(() => toFormValues(initialAddress), [initialAddress])
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    reset,
    setError,
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  useEffect(() => {
    Object.entries(serverErrors).forEach(([field, message]) => {
      if (message) setError(field, { type: 'server', message })
    })
  }, [serverErrors, setError])

  const submitLabel = mode === 'edit' ? 'Update address' : 'Save address'

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(buildPayload(values)))} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fullName" label="Full name" error={errors.fullName?.message}>
          <input
            id="fullName"
            autoComplete="name"
            className={inputClass}
            placeholder="Enter full name"
            {...register('fullName')}
          />
        </Field>

        <Field id="mobileNumber" label="Mobile number" error={errors.mobileNumber?.message}>
          <input
            id="mobileNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={inputClass}
            placeholder="9876543210"
            {...register('mobileNumber')}
          />
        </Field>
      </div>

      <Field id="alternateMobileNumber" label="Alternate mobile number" error={errors.alternateMobileNumber?.message}>
        <input
          id="alternateMobileNumber"
          type="tel"
          inputMode="numeric"
          className={inputClass}
          placeholder="Optional"
          {...register('alternateMobileNumber')}
        />
      </Field>

      <Field id="addressLine1" label="Address line 1" error={errors.addressLine1?.message}>
        <input
          id="addressLine1"
          autoComplete="address-line1"
          className={inputClass}
          placeholder="House no, building, street"
          {...register('addressLine1')}
        />
      </Field>

      <Field id="addressLine2" label="Address line 2" error={errors.addressLine2?.message}>
        <input
          id="addressLine2"
          autoComplete="address-line2"
          className={inputClass}
          placeholder="Area, apartment, floor"
          {...register('addressLine2')}
        />
      </Field>

      <Field id="landmark" label="Landmark" error={errors.landmark?.message}>
        <input
          id="landmark"
          className={inputClass}
          placeholder="Nearby landmark"
          {...register('landmark')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="City" error={errors.city?.message}>
          <input id="city" autoComplete="address-level2" className={inputClass} placeholder="City" {...register('city')} />
        </Field>

        <Field id="state" label="State" error={errors.state?.message}>
          <input id="state" autoComplete="address-level1" className={inputClass} placeholder="State" {...register('state')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="country" label="Country" error={errors.country?.message}>
          <input id="country" autoComplete="country-name" className={inputClass} placeholder="India" {...register('country')} />
        </Field>

        <Field id="postalCode" label="Postal code" error={errors.postalCode?.message}>
          <input
            id="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            className={inputClass}
            placeholder="500001"
            {...register('postalCode')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <Field id="addressType" label="Address type" error={errors.addressType?.message}>
          <select id="addressType" className={inputClass} {...register('addressType')}>
            {ADDRESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Set as default
            </label>
          )}
        />
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        First address becomes default automatically. Only one saved address can be default.
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default AddressForm
