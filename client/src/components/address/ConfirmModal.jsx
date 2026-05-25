const ConfirmModal = ({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  description,
  isSubmitting = false,
  onCancel,
  onConfirm,
  title,
}) => {
  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
