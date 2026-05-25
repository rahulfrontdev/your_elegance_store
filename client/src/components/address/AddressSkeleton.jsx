const AddressSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3" aria-label="Loading addresses">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full space-y-3">
              <div className="h-5 w-24 rounded-full bg-neutral-200" />
              <div className="h-5 w-44 rounded bg-neutral-200" />
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="h-4 w-full max-w-xl rounded bg-neutral-200" />
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
            </div>
            <div className="hidden w-32 space-y-2 sm:block">
              <div className="h-9 rounded-xl bg-neutral-200" />
              <div className="h-9 rounded-xl bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AddressSkeleton
