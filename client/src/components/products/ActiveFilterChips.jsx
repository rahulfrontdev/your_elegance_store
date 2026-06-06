const ActiveFilterChips = ({ chips = [], onRemove, onClearAll, className = '' }) => {
  if (!chips.length) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-neutral-500">Active:</span>
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value ?? chip.label}`}
          type="button"
          onClick={() => onRemove(chip)}
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
          aria-label={`Remove filter ${chip.label}`}
        >
          <span>{chip.label}</span>
          <span aria-hidden className="text-sm leading-none text-blue-600">
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}

export default ActiveFilterChips
