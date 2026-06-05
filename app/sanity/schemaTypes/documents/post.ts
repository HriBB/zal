import { DocumentIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

import { blockRegistry } from '~/components/blocks/blockRegistry'

export const postType = defineType({
  name: 'post',
  title: 'Novica',
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
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Kategorije',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
    defineField({
      name: 'mainImage',
      title: 'Naslovna slika',
      type: 'figure',
    }),
    defineField({
      name: 'blocks',
      title: 'Vsebina',
      type: 'array',
      of: Object.keys(blockRegistry).map((type) => defineArrayMember({ type })),
    }),
    defineField({
      name: '_oldPath',
      title: 'Stara WP pot',
      type: 'string',
      hidden: true,
    }),
  ],
  preview: {
    select: { title: 'title', date: 'date', media: 'mainImage' },
    prepare({ title, date, media }) {
      return { title, subtitle: date?.slice(0, 10), media }
    },
  },
})
