import { useEffect, useMemo, useState } from 'react'
import { fetchReels } from '../../api/reelsApi'

function normalizeReelList(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.reels)) return root.reels
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.items)) return root.items
  return []
}

function pickId(reel) {
  return reel?._id || reel?.id || reel?.reelUrl || reel?.embedUrl || reel?.title
}

const Insta = () => {
  const [reels, setReels] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    let cancelled = false

    const loadReels = async () => {
      setStatus('loading')
      try {
        const { data } = await fetchReels()
        if (!cancelled) {
          setReels(normalizeReelList(data))
          setStatus('succeeded')
        }
      } catch {
        if (!cancelled) {
          setReels([])
          setStatus('failed')
        }
      }
    }

    loadReels()
    return () => {
      cancelled = true
    }
  }, [])

  const activeReels = useMemo(
    () =>
      reels
        .filter((reel) => reel?.isActive !== false && reel?.embedUrl)
        .sort((a, b) => {
          const orderA = Number.isFinite(Number(a?.displayOrder)) ? Number(a.displayOrder) : 9999
          const orderB = Number.isFinite(Number(b?.displayOrder)) ? Number(b.displayOrder) : 9999
          if (orderA !== orderB) return orderA - orderB
          return String(a?.title || '').localeCompare(String(b?.title || ''))
        }),
    [reels]
  )

  if (status === 'failed' || (status === 'succeeded' && activeReels.length === 0)) {
    return null
  }

  return (
    <section className="px-3 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Instagram Reels
          </p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">
            Watch Our Latest Reels
          </h2>
        </div>

        {status === 'loading' ? (
          <p className="py-8 text-center text-sm text-neutral-500">Loading reels...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeReels.map((reel) => (
              <article
                key={pickId(reel)}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <iframe
                  key={reel.embedUrl}
                  src={reel.embedUrl}
                  title={reel.title || 'Instagram reel'}
                  className="h-[520px] w-full border-0"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
                {reel.title && (
                  <div className="border-t border-neutral-100 px-4 py-3">
                    <p className="text-sm font-semibold text-neutral-900">{reel.title}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Insta
