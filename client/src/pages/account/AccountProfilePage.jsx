import { useAuth } from '../../context/AuthContext.jsx'

const AccountProfilePage = () => {
  const { user } = useAuth()

  const fullName = user?.name || user?.fullName || 'N/A'
  const email = user?.email || 'N/A'
  const phone = user?.mobile || user?.mobile || 'N/A'
  const role = user?.role || 'customer'
  const accountId = user?._id || user?.id || 'N/A'

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        <p className="mt-0.5 text-sm text-neutral-600">Your account details.</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <p className="text-xs text-neutral-500">Full Name</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-900">{fullName}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <p className="text-xs text-neutral-500">Email</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-900 break-all">{email}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <p className="text-xs text-neutral-500">Phone</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-900">{phone}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <p className="text-xs text-neutral-500">Role</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-neutral-900">{role}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 sm:col-span-2">
            <p className="text-xs text-neutral-500">Account ID</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-900 break-all">{accountId}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountProfilePage

