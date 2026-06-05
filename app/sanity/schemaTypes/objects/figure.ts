import { ImageIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const figureType = defineType({
  name: 'figure',
  title: 'Slika',
  type: 'image',
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Opis slike (alt)',
      type: 'string',
      description: 'Obvezen za dostopnost in SEO.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Napis',
      type: 'string',
      description: 'Viden napis pod sliko (se razlikuje od alt opisa).',
    }),
  ],
})
