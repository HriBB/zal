import type { MetaFunction } from 'react-router'

import { SanityStudio } from '~/components/SanityStudio'

export const meta: MetaFunction = () => [
  { title: 'ZAL — Studio' },
  { name: 'robots', content: 'noindex' },
]

export default function StudioPage() {
  return <SanityStudio />
}
