import { TagIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Kategorija',
  type: 'document',
  icon: TagIcon,
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
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }) {
      return { title, subtitle: slug }
    },
  },
})
