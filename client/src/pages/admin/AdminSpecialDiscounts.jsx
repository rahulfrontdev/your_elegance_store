import { useCallback, useEffect, useState } from 'react'
import {
  createSpecialDiscountCategory,
  deleteSpecialDiscountCategory,
  fetchSpecialDiscountCategories,
  updateSpecialDiscountCategory,
} from '../../api/specialDiscountApi'

function normalizeList(payload) {
  return payload?.data?.data || payload?.data || []
}

const emptyForm = () => ({ name: '', discountPercentage: '' })

const AdminSpecialDiscounts = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [editDraft, setEditDraft] = useState({ name: '', discountPercentage: '' })

  const loadCategories = useCallback(async () => {
    setError('')
    try {
      setLoading(true)
      const { data } = await fetchSpecialDiscountCategories()
      setCategories(normalizeList(data))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load categories.')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const discountPercentage = Number(form.discountPercentage)
    if (name.length < 2) {
      setError('Category name must be at least 2 characters.')
      return
    }
    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      setError('Discount percentage must be between 0 and 100.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createSpecialDiscountCategory({ name, discountPercentage })
      setForm(emptyForm())
      await loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not create category.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (row) => {
    setEditingId(row._id || row.id)
    setEditDraft({
      name: row.name || '',
      discountPercentage: String(row.discountPercentage ?? 0),
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditDraft({ name: '', discountPercentage: '' })
  }

  const saveEdit = async (id) => {
    const name = editDraft.name.trim()
    const discountPercentage = Number(editDraft.discountPercentage)
    if (name.length < 2) {
      setError('Category name must be at least 2 characters.')
      return
    }
    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      setError('Discount percentage must be between 0 and 100.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateSpecialDiscountCategory(id, { name, discountPercentage })
      cancelEdit()
      await loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (row.isDefault) return
    const confirmed = window.confirm(`Delete "${row.name}"? Assigned customers will move to Customer (default).`)
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSpecialDiscountCategory(row._id || row.id)
      await loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not delete category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Special Discount Categories</h1>
        <p className="mt-1 text-sm text-slate-600">
          Assign customers to a category (Friends, Family, VIP, etc.). Logged-in users see their
          category discount across the store. Campaign discounts still apply when they offer a better
          price.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_auto]"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Category name (e.g. Friends, VIP)"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.discountPercentage}
          onChange={(e) => setForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
          placeholder="Discount %"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          + Add category
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-4 py-8 text-sm text-slate-500">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500">No categories yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Discount %</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((row) => {
                const id = row._id || row.id
                const isEditing = editingId === id
                return (
                  <tr key={id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        <span className="font-medium text-slate-900">
                          {row.name}
                          {row.isDefault ? (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Default
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editDraft.discountPercentage}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, discountPercentage: e.target.value }))
                          }
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        <span>{Number(row.discountPercentage ?? 0)}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.isActive !== false
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(id)}
                              disabled={saving}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700"
                            >
                              Edit
                            </button>
                            {!row.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleDelete(row)}
                                disabled={saving}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminSpecialDiscounts
