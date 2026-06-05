import { useCallback, useEffect, useRef, useState } from 'react'

export type FigureData = {
  _key: string
  alt?: string | null
  caption?: string | null
  asset?: {
    _id: string
    url: string
    metadata?: { lqip?: string | null; dimensions?: { width: number; height: number } | null }
  } | null
}

function Lightbox({
  figures,
  index,
  onClose,
}: {
  figures: FigureData[]
  index: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(index)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + figures.length) % figures.length),
    [figures.length],
  )
  const next = useCallback(() => setCurrent((i) => (i + 1) % figures.length), [figures.length])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const fig = figures[current]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galerija slik"
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-screen max-w-[90vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          aria-label="Zapri"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 rounded bg-black/50 px-3 py-1 text-white hover:bg-black/80"
        >
          ✕
        </button>

        {fig?.asset?.url && (
          <img
            src={fig.asset.url}
            alt={fig.alt ?? ''}
            className="max-h-[80vh] max-w-full object-contain"
          />
        )}

        {fig?.caption && <p className="mt-2 text-sm text-white/80">{fig.caption}</p>}

        {figures.length > 1 && (
          <div className="mt-3 flex items-center gap-4">
            <button
              aria-label="Prejšnja slika"
              onClick={prev}
              className="rounded bg-white/20 px-4 py-2 text-white hover:bg-white/40"
            >
              ←
            </button>
            <span className="text-sm text-white/60">
              {current + 1} / {figures.length}
            </span>
            <button
              aria-label="Naslednja slika"
              onClick={next}
              className="rounded bg-white/20 px-4 py-2 text-white hover:bg-white/40"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ImageGallery({ figures }: { figures: FigureData[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (figures.length === 0) return null

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setLightboxIndex(i)
    }
  }

  return (
    <>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
        role="list"
        aria-label="Galerija"
      >
        {figures.map((fig, i) => (
          <div key={fig._key} role="listitem">
            <button
              className="group w-full overflow-hidden rounded focus:outline-2 focus:outline-offset-2 focus:outline-[var(--zal)]"
              aria-label={fig.alt || `Slika ${i + 1}`}
              onClick={() => setLightboxIndex(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              {fig.asset?.url ? (
                <img
                  src={fig.asset.url}
                  alt={fig.alt ?? ''}
                  className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-square w-full bg-stone-200" aria-hidden="true" />
              )}
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          figures={figures}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
