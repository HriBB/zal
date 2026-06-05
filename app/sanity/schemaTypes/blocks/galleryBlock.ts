import { defineField, defineType } from 'sanity'

export const galleryBlockType = defineType({
  name: 'galleryBlock',
  title: 'Galerija',
  type: 'object',
  fields: [
    defineField({
      name: 'figures',
      title: 'Slike',
      type: 'array',
      of: [{ type: 'figure' }],
    }),
  ],
  preview: {
    select: { figures: 'figures' },
    prepare({ figures }) {
      const count = Array.isArray(figures) ? figures.length : 0
      return { title: `Galerija (${count} ${count === 1 ? 'slika' : 'slik'})` }
    },
  },
})
