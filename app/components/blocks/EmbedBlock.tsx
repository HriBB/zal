import { classifyEmbedUrl } from '~/lib/wp-embed'
import type { BlockComponentProps } from './blockRegistry'

function youtubeNoCookie(src: string): string {
  return src.replace('www.youtube.com', 'www.youtube-nocookie.com')
}

export function EmbedBlock({ data }: BlockComponentProps) {
  const url: string = data?.url ?? ''
  if (!url) return null

  const type = classifyEmbedUrl(url)

  if (type === 'unknown') {
    return (
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {url}
        </a>
      </p>
    )
  }

  const src = type === 'youtube' ? youtubeNoCookie(url) : url

  const title =
    type === 'youtube'
      ? 'Video'
      : type === 'googleMaps'
        ? 'Zemljevid'
        : type === 'googleForms'
          ? 'Obrazec'
          : 'Vgradnja'

  if (type === 'googleForms') {
    return (
      <div className="w-full overflow-hidden">
        <iframe
          src={src}
          title={title}
          className="w-full border-0"
          style={{ minHeight: '600px', height: '100%' }}
          loading="lazy"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ paddingTop: '56.25%' }}>
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allowFullScreen
      />
    </div>
  )
}
