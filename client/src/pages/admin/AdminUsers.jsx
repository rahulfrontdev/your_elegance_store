import { useCallback, useEffect, useState } from 'react'
import { adminFetchUsers, adminUpdateUser } from '../../api/adminApi'
import { Loader2 } from 'lucide-react'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.users && Array.isArray(payload.users)) return payload.users
  return []
}

const AdminUsers = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      setLoading(true)
      const { data } = await adminFetchUsers()
      setList(normalizeList(data))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateRole = async (id, role) => {
    setSavingId(id)
    setError('')
    try {
      await adminUpdateUser(id, { role })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="mt-1 text-sm text-slate-600">View accounts and assign customer or admin role.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No users loaded. Ensure <code className="rounded bg-slate-100 px-1">GET /users</code> exists and returns an array.
                  </td>
                </tr>
              ) : (
                list.map((u) => {
                  const id = u._id ?? u.id
                  return (
                    <tr key={id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{u.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role ?? 'customer'}
                          disabled={savingId === id}
                          onChange={(e) => updateRole(id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="customer">customer</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
        {error && <p className="border-t border-slate-200 px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

export default AdminUsers
