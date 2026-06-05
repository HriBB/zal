import { defineField, defineType } from 'sanity'

export const embedBlockType = defineType({
  name: 'embedBlock',
  title: 'Vgradnja (embed)',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { url: 'url' },
    prepare({ url }) {
      return { title: (url as string) ?? '(brez URL)' }
    },
  },
})
