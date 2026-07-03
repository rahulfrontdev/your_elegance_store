const UploadProgressBar = ({ progress = 0, label = 'Uploading…' }) => {
  const pct = Math.max(0, Math.min(100, Number(progress) || 0))
  if (pct <= 0) return null

  return (
    <div className="mt-3 space-y-1.5" role="status" aria-live="polite">
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default UploadProgressBar
