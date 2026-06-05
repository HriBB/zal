import { DocumentIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

import { blockRegistry } from '~/components/blocks/blockRegistry'

export const pageType = defineType({
  name: 'page',
  title: 'Stran',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Naslov',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Segment URL',
      type: 'slug',
      description: 'Lastni segment URL te strani (brez poševnic).',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Nadrejena stran',
      type: 'reference',
      to: [{ type: 'page' }],
      description: 'Pusti prazno za strani prvega nivoja.',
    }),
    defineField({
      name: 'blocks',
      title: 'Vsebina',
      type: 'array',
      of: Object.keys(blockRegistry).map((type) =>
        defineArrayMember({ type }),
      ),
    }),
    defineField({
      name: '_oldPath',
      title: 'Stara WP pot (samo za preusmeritev)',
      type: 'string',
      hidden: true,
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }) {
      return { title, subtitle: `/${slug}` }
    },
  },
})
