import React, { useCallback, useEffect, useState } from 'react'
import {
  adminCreateCarouselSlide,
  adminDeleteCarouselSlide,
  adminFetchAllCarouselSlides,
  adminFetchCarouselSlideById,
  adminUpdateCarouselSlide,
} from '../../api/carouselApi'
import { normalizeCarouselSlideList, resolveCarouselImageUrl } from '../../utils/carouselMedia'

const apiErrorText = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data === 'string' ? err.response.data : null) ||
  fallback

const AdminCarousel = () => {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const [createFile, setCreateFile] = useState(null)
  const [createAlt, setCreateAlt] = useState('')
  const [createOrder, setCreateOrder] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editOrder, setEditOrder] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editFile, setEditFile] = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    if (text) window.setTimeout(() => setMessage({ type: '', text: '' }), 6000)
  }

  const loadSlides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetchAllCarouselSlides()
      setSlides(normalizeCarouselSlideList(res.data))
    } catch (err) {
      console.error(err)
      setSlides([])
      showMessage('error', apiErrorText(err, 'Could not load carousel slides.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSlides()
  }, [loadSlides])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createFile) {
      showMessage('error', 'Choose an image file.')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('image', createFile)
      if (createAlt.trim()) fd.append('alt', createAlt.trim())
      if (createOrder.trim() !== '' && !Number.isNaN(Number(createOrder))) {
        fd.append('order', String(Number(createOrder)))
      }
      fd.append('isActive', 'true')
      await adminCreateCarouselSlide(fd)
      setCreateFile(null)
      setCreateAlt('')
      setCreateOrder('')
      e.target.reset?.()
      showMessage('success', 'Slide created.')
      await loadSlides()
    } catch (err) {
      console.error(err)
      showMessage('error', apiErrorText(err, 'Create failed.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return
    setDeletingId(String(id))
    try {
      await adminDeleteCarouselSlide(id)
      showMessage('success', 'Slide deleted.')
      await loadSlides()
    } catch (err) {
      console.error(err)
      showMessage('error', apiErrorText(err, 'Delete failed.'))
    } finally {
      setDeletingId('')
    }
  }

  const openEdit = async (slide) => {
    const id = slide.raw?._id ?? slide.raw?.id ?? slide.id
    setEditId(String(id))
    setEditOpen(true)
    setEditFile(null)
    setEditLoading(true)
    try {
      const res = await adminFetchCarouselSlideById(id)
      const list = normalizeCarouselSlideList(res.data)
      const one = list[0] || slide
      setEditAlt(one.alt || '')
      setEditOrder(one.order != null && one.order !== '' ? String(one.order) : '')
      setEditActive(one.isActive !== false)
    } catch {
      setEditAlt(slide.alt || '')
      setEditOrder(slide.order != null ? String(slide.order) : '')
      setEditActive(slide.isActive !== false)
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    if (!editId) return
    setSaving(true)
    try {
      const fd = new FormData()
      if (editAlt.trim()) fd.append('alt', editAlt.trim())
      if (editOrder.trim() !== '' && !Number.isNaN(Number(editOrder))) {
        fd.append('order', String(Number(editOrder)))
      }
      fd.append('isActive', editActive ? 'true' : 'false')
      if (editFile) fd.append('image', editFile)
      await adminUpdateCarouselSlide(editId, fd)
      setEditOpen(false)
      showMessage('success', 'Slide updated.')
      await loadSlides()
    } catch (err) {
      console.error(err)
      showMessage('error', apiErrorText(err, 'Update failed.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home carousel</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage hero slides via the API. Active slides are shown on the store home page

          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSlides()}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {message.text && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Add slide</h2>

        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className="font-medium text-gray-700">Image</span>
            <input
              type="file"
              accept="image/*"
              required
              className="mt-1 block w-full text-sm text-gray-600"
              onChange={(ev) => setCreateFile(ev.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block min-w-[160px] flex-1 text-sm">
            <span className="font-medium text-gray-700">Alt text (optional)</span>
            <input
              type="text"
              value={createAlt}
              onChange={(ev) => setCreateAlt(ev.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Banner description"
            />
          </label>
          <label className="block w-24 text-sm">
            <span className="font-medium text-gray-700">Order</span>
            <input
              type="number"
              value={createOrder}
              onChange={(ev) => setCreateOrder(ev.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="0"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !createFile}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create slide'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          All slides ({loading ? '…' : slides.length})
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Includes inactive. Home page uses public list (typically active only).
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">Loading…</p>
        ) : slides.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">No slides yet. Create one above.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((slide) => {
              const rawId = slide.raw?._id ?? slide.raw?.id ?? slide.id
              const imgSrc = slide.image || resolveCarouselImageUrl(slide.raw?.imageUrl)
              return (
                <li
                  key={String(rawId)}
                  className={`overflow-hidden rounded-lg border bg-gray-50 ${slide.isActive === false ? 'border-dashed border-gray-300 opacity-80' : 'border-gray-200'
                    }`}
                >
                  <div className="aspect-[16/9] bg-gray-200">
                    {imgSrc ? (
                      <img src={imgSrc} alt={slide.alt} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-500">No image URL</div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {slide.isActive === false ? (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                          Inactive
                        </span>
                      ) : (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Active
                        </span>
                      )}
                      {slide.order != null && (
                        <span className="text-xs text-gray-500">Order: {slide.order}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-700" title={slide.alt}>
                      {slide.alt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(slide)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rawId)}
                        disabled={deletingId === String(rawId)}
                        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === String(rawId) ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="carousel-edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <h2 id="carousel-edit-title" className="text-lg font-semibold text-gray-900">
              Edit slide
            </h2>
            {editLoading ? (
              <p className="mt-4 text-sm text-gray-500">Loading…</p>
            ) : (
              <form onSubmit={handleEditSave} className="mt-4 space-y-4">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Alt text</span>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(ev) => setEditAlt(ev.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Order</span>
                  <input
                    type="number"
                    value={editOrder}
                    onChange={(ev) => setEditOrder(ev.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(ev) => setEditActive(ev.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-700">Active</span>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Replace image (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-600"
                    onChange={(ev) => setEditFile(ev.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCarousel
