import { useEffect } from 'react'

const AddressToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast?.message) return undefined
    const timer = setTimeout(onClose, 2600)
    return () => clearTimeout(timer)
  }, [onClose, toast])

  if (!toast?.message) return null

  return (
    <div
      className={`fixed top-4 left-1/2 z-[8500] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl sm:left-auto sm:right-4 sm:translate-x-0 ${
        toast.type === 'success'
          ? 'border-emerald-500 bg-emerald-600 text-white'
          : 'border-red-500 bg-red-600 text-white'
      }`}
      role="status"
    >
      {toast.message}
    </div>
  )
}

export default AddressToast
