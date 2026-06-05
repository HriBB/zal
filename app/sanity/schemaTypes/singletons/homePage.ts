import { HomeIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const homePageType = defineType({
  name: 'homePage',
  title: 'Domača stran',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'heading',
          title: 'Naslov',
          type: 'string',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'lead',
          title: 'Podnaslov',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'image',
          title: 'Fotografija',
          type: 'figure',
        }),
      ],
    }),

    defineField({
      name: 'serviceCards',
      title: 'Storitvene kartice',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'serviceCard',
          fields: [
            defineField({
              name: 'title',
              title: 'Naslov',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'description',
              title: 'Opis',
              type: 'text',
              rows: 2,
            }),
            defineField({
              name: 'href',
              title: 'Povezava (interna pot)',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'image',
              title: 'Slika (neobvezno)',
              type: 'figure',
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'href' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Domača stran' }),
  },
})
