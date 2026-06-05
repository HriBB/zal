import { PortableText } from '@portabletext/react'

import type { PortableTextComponents } from '@portabletext/react'

import type { BlockComponentProps } from './blockRegistry'

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="leading-relaxed">{children}</p>,
    // h1 migrated from WP content is demoted to h2 (page already has its own h1)
    h1: ({ children }) => (
      <h2 className="mt-8 text-2xl font-semibold text-[var(--color-zal)]">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 text-2xl font-semibold text-[var(--color-zal)]">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-xl font-semibold">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[var(--color-zal)] pl-4 italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="text-[var(--color-zal)] underline underline-offset-2"
        {...(value?.href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc space-y-1 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-6">{children}</ol>
    ),
  },
}

export function RichTextBlock({ data }: BlockComponentProps) {
  if (!data?.body?.length) return null
  return (
    <div className="prose-zal space-y-4">
      <PortableText value={data.body} components={components} />
    </div>
  )
}
