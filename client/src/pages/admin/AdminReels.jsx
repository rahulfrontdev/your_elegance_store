import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminCreateReel,
  adminDeleteReel,
  adminFetchReelById,
  adminFetchReels,
  adminUpdateReel,
} from '../../api/reelsApi'
import { normalizeInstagramEmbedInput } from '../../utils/reelUrls'

const emptyForm = {
  title: '',
  reelUrl: '',
  embedUrl: '',
  thumbnail: '',
  videoUrl: '',
  isActive: true,
  displayOrder: '',
}

function apiErrorText(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === 'string' ? err.response.data : null) ||
    err?.message ||
    fallback
  )
}

function normalizeReelList(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.reels)) return root.reels
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.items)) return root.items
  return []
}

function normalizeReel(payload) {
  const root = payload?.data ?? payload
  return root?.reel || root?.data || root || null
}

function pickId(reel) {
  return reel?._id || reel?.id || ''
}

function formFromReel(reel) {
  return {
    title: reel?.title || '',
    reelUrl: reel?.reelUrl || '',
    embedUrl: reel?.embedUrl || '',
    thumbnail: reel?.thumbnail || '',
    videoUrl: reel?.videoUrl || '',
    isActive: reel?.isActive !== false,
    displayOrder:
      reel?.displayOrder === 0 || reel?.displayOrder
        ? String(reel.displayOrder)
        : '',
  }
}

function buildPayload(form) {
  const embedUrl = normalizeInstagramEmbedInput(form.embedUrl)
  const payload = {
    title: form.title.trim(),
    embedUrl,
    isActive: Boolean(form.isActive),
  }

  if (form.reelUrl.trim()) payload.reelUrl = form.reelUrl.trim()
  if (form.thumbnail.trim()) payload.thumbnail = form.thumbnail.trim()
  if (form.videoUrl.trim()) payload.videoUrl = form.videoUrl.trim()

  if (form.displayOrder !== '' && !Number.isNaN(Number(form.displayOrder))) {
    payload.displayOrder = Number(form.displayOrder)
  }

  return payload
}

const AdminReels = () => {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [form, setForm] = useState(emptyForm)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    if (text) window.setTimeout(() => setMessage({ type: '', text: '' }), 6000)
  }

  const loadReels = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminFetchReels({ all: true })
      setReels(normalizeReelList(data))
    } catch (err) {
      setReels([])
      showMessage('error', apiErrorText(err, 'Could not load reels.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReels()
  }, [loadReels])

  const sortedReels = useMemo(
    () =>
      [...reels].sort((a, b) => {
        const orderA = Number.isFinite(Number(a?.displayOrder)) ? Number(a.displayOrder) : 9999
        const orderB = Number.isFinite(Number(b?.displayOrder)) ? Number(b.displayOrder) : 9999
        if (orderA !== orderB) return orderA - orderB
        return String(a?.title || '').localeCompare(String(b?.title || ''))
      }),
    [reels]
  )

  const resetForm = () => {
    setEditingId('')
    setEditLoading(false)
    setForm(emptyForm)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      showMessage('error', 'Title is required.')
      return
    }
    if (!form.embedUrl.trim()) {
      showMessage('error', 'Instagram embed URL is required.')
      return
    }
    if (!normalizeInstagramEmbedInput(form.embedUrl)) {
      showMessage('error', 'Please provide a valid Instagram reel embed URL or iframe code.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(form)
      if (editingId) {
        await adminUpdateReel(editingId, payload)
        showMessage('success', 'Reel updated.')
      } else {
        await adminCreateReel(payload)
        showMessage('success', 'Reel created.')
      }
      resetForm()
      await loadReels()
    } catch (err) {
      showMessage('error', apiErrorText(err, editingId ? 'Update failed.' : 'Create failed.'))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = async (reel) => {
    const id = pickId(reel)
    if (!id) return
    setEditingId(id)
    setForm(formFromReel(reel))
    setEditLoading(true)
    try {
      const { data } = await adminFetchReelById(id)
      const fresh = normalizeReel(data)
      if (fresh) setForm(formFromReel(fresh))
    } catch {
      // The list row already has enough fields to edit if detail fetch is unavailable.
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (reel) => {
    const id = pickId(reel)
    if (!id) return
    if (!window.confirm('Delete this reel?')) return

    setBusyId(id)
    try {
      await adminDeleteReel(id)
      showMessage('success', 'Reel deleted.')
      await loadReels()
      if (editingId === id) resetForm()
    } catch (err) {
      showMessage('error', apiErrorText(err, 'Delete failed.'))
    } finally {
      setBusyId('')
    }
  }

  const toggleActive = async (reel) => {
    const id = pickId(reel)
    if (!id) return

    setBusyId(id)
    try {
      await adminUpdateReel(id, {
        title: reel?.title || '',
        reelUrl: reel?.reelUrl || '',
        embedUrl: reel?.embedUrl || '',
        thumbnail: reel?.thumbnail || '',
        videoUrl: reel?.videoUrl || '',
        isActive: reel?.isActive === false,
        displayOrder: reel?.displayOrder,
      })
      showMessage('success', 'Reel status updated.')
      await loadReels()
    } catch (err) {
      showMessage('error', apiErrorText(err, 'Status update failed.'))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="space-y-6 p-2 text-neutral-900 lg:p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Reel Master</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage Instagram reels. Add the embedUrl that the website should render in an iframe.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadReels()}
          disabled={loading}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {message.text && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              {editingId ? 'Edit reel' : 'New reel'}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Instagram embeds often open Instagram when tapped. Add a direct video URL (.mp4) to
              play fully on your website.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
            >
              Cancel edit
            </button>
          )}
        </div>

        {editLoading ? (
          <p className="text-sm text-neutral-500">Loading reel...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium text-neutral-700">Title</span>
              <input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder="My Reel"
                required
              />
            </label>

            <label className="text-sm">
              <span className="font-medium text-neutral-700">Embed URL or iframe code</span>
              <textarea
                value={form.embedUrl}
                onChange={(e) => updateField('embedUrl', e.target.value)}
                className="mt-1 min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder='https://www.instagram.com/reel/ABC123/embed/ or <iframe src="https://www.instagram.com/reel/ABC123/embed/"></iframe>'
                required
              />
              <span className="mt-1 block text-xs text-neutral-500">
                You can paste the full Instagram iframe code; only the src URL will be saved.
              </span>
            </label>

            <label className="text-sm">
              <span className="font-medium text-neutral-700">Reel URL</span>
              <input
                value={form.reelUrl}
                onChange={(e) => updateField('reelUrl', e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder="Optional original reel URL"
              />
            </label>

            <label className="text-sm">
              <span className="font-medium text-neutral-700">Thumbnail URL</span>
              <input
                value={form.thumbnail}
                onChange={(e) => updateField('thumbnail', e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder="Optional poster image"
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="font-medium text-neutral-700">Direct video URL (recommended)</span>
              <input
                value={form.videoUrl}
                onChange={(e) => updateField('videoUrl', e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder="https://yoursite.com/videos/reel.mp4"
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Upload the reel as MP4 to your server or CDN. This plays on your site without
                sending users to Instagram.
              </span>
            </label>

            <label className="text-sm">
              <span className="font-medium text-neutral-700">Display order</span>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => updateField('displayOrder', e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder="1"
              />
            </label>

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded border-neutral-300"
              />
              <span className="font-medium text-neutral-700">Active on website</span>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update reel' : 'Create reel'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-semibold">All reels ({loading ? '...' : sortedReels.length})</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Admin list uses GET /api/reels?all=true and includes inactive reels.
          </p>
        </div>

        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">Loading...</p>
        ) : sortedReels.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">No reels found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reel</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Embed URL</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedReels.map((reel) => {
                  const id = pickId(reel)
                  const isBusy = busyId === id
                  return (
                    <tr key={id || reel?.reelUrl} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{reel?.title || 'Untitled reel'}</p>
                        <a
                          href={reel?.reelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block max-w-xs truncate text-xs text-blue-600 hover:underline"
                        >
                          {reel?.reelUrl || 'No reel URL'}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            reel?.isActive === false
                              ? 'bg-neutral-100 text-neutral-700'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {reel?.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {reel?.displayOrder === 0 || reel?.displayOrder ? reel.displayOrder : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-xs text-neutral-500" title={reel?.embedUrl || ''}>
                          {reel?.embedUrl || 'No embed URL'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(reel)}
                            className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-semibold hover:bg-neutral-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(reel)}
                            disabled={isBusy}
                            className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                          >
                            {reel?.isActive === false ? 'Activate' : 'Deactivate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(reel)}
                            disabled={isBusy}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                          >
                            {isBusy ? 'Working...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminReels
