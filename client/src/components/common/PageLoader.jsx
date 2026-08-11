const PageLoader = ({ label = 'Loading…' }) => (
  <div className="flex min-h-[40vh] items-center justify-center px-4">
    <p className="text-sm text-neutral-600">{label}</p>
  </div>
)

export default PageLoader
