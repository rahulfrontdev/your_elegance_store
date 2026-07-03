import { getReelEmbedProps } from '../../utils/reelUrls'

/**
 * Instagram blocks full in-site reel playback — embeds are designed to open Instagram.
 * Use videoUrl (direct .mp4) in admin for playback that stays on your store.
 */
const InstagramReelEmbed = ({ reel, title }) => {
  const videoUrl = String(reel?.videoUrl || '').trim()
  const thumbnail = String(reel?.thumbnail || '').trim()
  const { embedSrc, isValid } = getReelEmbedProps(reel)

  if (videoUrl) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        poster={thumbnail || undefined}
        className="aspect-[9/16] max-h-[min(32rem,70vh)] w-full max-w-full bg-black object-contain"
        src={videoUrl}
      />
    )
  }

  if (!isValid) {
    return (
      <div className="flex aspect-[9/16] max-h-[min(28rem,65vh)] items-center justify-center bg-neutral-100 p-4 text-center">
        <p className="text-sm text-neutral-600">
          Invalid reel link. In admin, paste a reel URL like{' '}
          <span className="font-mono text-xs">instagram.com/reel/ABC123/</span>
        </p>
      </div>
    )
  }

  return (
    <div className="instagram-reel-embed">
      <iframe
        src={`${embedSrc}${embedSrc.includes('?') ? '&' : '?'}embed=captioned`}
        title={title || 'Instagram reel'}
        className="instagram-reel-embed__iframe"
        loading="lazy"
        scrolling="no"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}

export default InstagramReelEmbed
