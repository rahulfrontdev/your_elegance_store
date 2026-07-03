import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminCreateCatalog,
  adminDeleteCatalog,
  adminListCatalogs,
} from '../../api/catalogsAdminApi'

function normalizeCatalogList(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.catalogs)) return root.catalogs
  if (Array.isArray(root?.data)) return root.data
  return []
}

function pickId(row) {
  return row?._id || row?.id || ''
}

const AdminCatalogs = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await adminListCatalogs()
      setRows(normalizeCatalogList(data))
    } catch (e) {
      setRows([])
      setError(e?.response?.data?.message || e?.message || 'Failed to load catalogs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sorted = useMemo(
    () => [...rows].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))),
    [rows]
  )

  const onCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await adminCreateCatalog({
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      setName('')
      setSlug('')
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Create failed.')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (row) => {
    const id = pickId(row)
    if (!id) return
    if (!window.confirm('Delete this catalog?')) return
    setBusyId(id)
    try {
      await adminDeleteCatalog(id)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="space-y-6 p-2 text-neutral-900 lg:p-4">
      <div>
        <h1 className="text-xl font-bold">Catalogs</h1>
        {/* <p className="mt-1 text-sm text-neutral-600">
          Catalog-wide discount targets via <code className="rounded bg-neutral-100 px-1 text-xs">/catalogs</code>.
          Adjust fields to match your API.
        </p> */}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">New catalog</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
          <label className="text-sm">
            <span className="text-neutral-600">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Summer Sale"
            />
          </label>
          <label className="text-sm">
            <span className="text-neutral-600">Slug (optional)</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="summer-sale"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'POST /catalogs'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <p className="text-sm font-semibold">Catalogs</p>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
        <ul className="divide-y divide-neutral-100">
          {loading && sorted.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-neutral-500">Loading…</li>
          ) : sorted.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-neutral-500">No catalogs.</li>
          ) : (
            sorted.map((row) => {
              const id = pickId(row)
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{row?.name || '—'}</p>
                    <p className="text-xs font-mono text-neutral-500">{id}</p>
                    {row?.slug && <p className="text-xs text-neutral-600">/{row.slug}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={!id || busyId === id}
                    onClick={() => onDelete(row)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </section>
    </div>
  )
}

export default AdminCatalogs
