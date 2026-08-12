const OrderListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3" aria-label="Loading orders">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="h-14 w-14 shrink-0 rounded-lg bg-neutral-200" />
            <div className="min-w-0 space-y-2">
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="h-3 w-24 rounded bg-neutral-200" />
              <div className="h-4 w-full max-w-xs rounded bg-neutral-200" />
            </div>
          </div>
          <div className="space-y-2 sm:text-right">
            <div className="h-3 w-10 rounded bg-neutral-200 sm:ml-auto" />
            <div className="h-6 w-20 rounded bg-neutral-200 sm:ml-auto" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="h-4 w-40 rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-200" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-24 rounded-lg bg-neutral-200" />
          <div className="h-8 w-28 rounded-lg bg-neutral-200" />
        </div>
      </div>
    ))}
  </div>
)

export default OrderListSkeleton
