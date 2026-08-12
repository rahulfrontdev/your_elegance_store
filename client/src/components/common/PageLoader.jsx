import { Loader2 } from 'lucide-react'

const PageLoader = ({ label = 'Loading…', compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 px-4 ${compact ? 'py-8' : 'min-h-[40vh]'}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
    <p className="text-sm font-medium text-neutral-600">{label}</p>
  </div>
)

export default PageLoader
