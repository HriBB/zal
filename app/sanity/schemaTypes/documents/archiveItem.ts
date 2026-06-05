import { defineField, defineType } from 'sanity'

export const archiveItemType = defineType({
  name: 'archiveItem',
  type: 'document',
  title: 'Arhivalija (Digiteka)',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Naslov', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({
      name: 'collection',
      type: 'reference',
      title: 'Zbirka',
      to: [{ type: 'collection' }],
    }),
    defineField({
      name: 'metadata',
      type: 'array',
      title: 'Metapodatki',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Polje' }),
            defineField({ name: 'value', type: 'string', title: 'Vrednost' }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        },
      ],
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      title: 'Posnetki (slike)',
      of: [{ type: 'figure' }],
    }),
    defineField({ name: 'externalUrl', type: 'url', title: 'Zunanja povezava (SIstory)' }),
    defineField({ name: 'date', type: 'string', title: 'Datum (arhivski)' }),
    defineField({ name: '_oldPath', type: 'string', title: 'Stara pot (za preusmeritve)' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'collection.name' },
  },
})
