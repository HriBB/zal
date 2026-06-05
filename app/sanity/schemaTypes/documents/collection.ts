import { defineField, defineType } from 'sanity'

export const collectionType = defineType({
  name: 'collection',
  type: 'document',
  title: 'Zbirka (Digiteka)',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Ime zbirke', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'description', type: 'text', title: 'Opis', rows: 4 }),
    defineField({ name: 'externalUrl', type: 'url', title: 'Zunanja povezava (npr. SIstory)' }),
    defineField({ name: '_oldPath', type: 'string', title: 'Stara pot (za preusmeritve)' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'slug.current' },
  },
})
