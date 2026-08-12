import PageLoader from './PageLoader'

const LoadingOverlay = ({ label = 'Loading…', show = false }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-6 shadow-lg">
        <PageLoader label={label} compact />
      </div>
    </div>
  )
}

export default LoadingOverlay
