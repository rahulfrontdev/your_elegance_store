import { getReelEmbedProps } from '../../utils/reelUrls'

/**
 * Instagram often blanks in-site reel iframes (especially on HTTP / IP hosts).
 * Prefer videoUrl (direct .mp4) in admin for reliable on-site playback.
 * Always show an "Open on Instagram" control so reels stay usable.
 */
const InstagramReelEmbed = ({ reel, title }) => {
  const videoUrl = String(reel?.videoUrl || '').trim()
  const thumbnail = String(reel?.thumbnail || '').trim()
  const { embedSrc, permalink, isValid } = getReelEmbedProps(reel)
  const label = title || reel?.title || 'Instagram reel'

  if (videoUrl) {
    return (
      <div className="relative">
        <video
          controls
          playsInline
          preload="metadata"
          poster={thumbnail || undefined}
          className="aspect-[9/16] max-h-[min(42rem,85vh)] w-full max-w-full bg-black object-contain"
          src={videoUrl}
        />
        {permalink ? (
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow"
          >
            Open on Instagram
          </a>
        ) : null}
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="flex aspect-[9/16] max-h-[min(38rem,80vh)] flex-col items-center justify-center gap-3 bg-neutral-100 p-4 text-center">
        <p className="text-sm text-neutral-600">
          Invalid reel link. In admin, paste a reel URL like{' '}
          <span className="font-mono text-xs">instagram.com/reel/ABC123/</span>
        </p>
      </div>
    )
  }

  return (
    <div className="instagram-reel-embed">
      {thumbnail ? (
        <img src={thumbnail} alt="" className="instagram-reel-embed__thumb" />
      ) : (
        <div className="instagram-reel-embed__fallback" aria-hidden>
          <div className="instagram-reel-embed__placeholder">
            <span>Reels</span>
          </div>
        </div>
      )}
      <iframe
        src={embedSrc}
        title={label}
        className="instagram-reel-embed__iframe"
        loading="lazy"
        scrolling="no"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <a
        href={permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-reel-embed__open"
      >
        Watch on Instagram
      </a>
    </div>
  )
}

export default InstagramReelEmbed
