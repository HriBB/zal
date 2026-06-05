/**
 * Pure helpers for embed block URL classification.
 * No network, no DOM — fully unit-testable.
 */

export type EmbedType = 'youtube' | 'googleMaps' | 'googleForms' | 'mapbox' | 'unknown'

/** Classify an iframe src URL into a known embed provider or 'unknown'. */
export function classifyEmbedUrl(src: string): EmbedType {
  if (!src) return 'unknown'
  if (src.includes('youtube.com/embed') || src.includes('youtu.be/')) return 'youtube'
  if (src.includes('google.com/maps/embed')) return 'googleMaps'
  if (src.includes('docs.google.com/forms')) return 'googleForms'
  if (src.includes('api.mapbox.com') || src.includes('mapbox.com/styles')) return 'mapbox'
  return 'unknown'
}
