import { ImageGallery } from '~/components/ImageGallery'
import type { FigureData } from '~/components/ImageGallery'

import type { BlockComponentProps } from './blockRegistry'

export function GalleryBlock({ data }: BlockComponentProps) {
  const figures: FigureData[] = data?.figures ?? []
  return <ImageGallery figures={figures} />
}
