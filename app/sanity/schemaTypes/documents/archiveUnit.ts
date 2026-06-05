import { defineField, defineType } from 'sanity'

export const archiveUnitType = defineType({
  name: 'archiveUnit',
  type: 'document',
  title: 'Enota',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Ime enote', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'address', type: 'text', title: 'Naslov', rows: 3, validation: (r) => r.required() }),
    defineField({
      name: 'phones',
      type: 'array',
      title: 'Telefoni',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Oznaka' }),
            defineField({ name: 'number', type: 'string', title: 'Številka' }),
          ],
          preview: { select: { title: 'label', subtitle: 'number' } },
        },
      ],
    }),
    defineField({
      name: 'emails',
      type: 'array',
      title: 'E-poštni naslovi',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'officeHours',
      type: 'array',
      title: 'Uradne ure (sprejemna pisarna)',
      of: [{ type: 'hourSlot' }],
    }),
    defineField({
      name: 'readingRoomHours',
      type: 'array',
      title: 'Ure čitalnice',
      of: [{ type: 'hourSlot' }],
    }),
    defineField({ name: 'photo', type: 'image', title: 'Fotografija', options: { hotspot: true } }),
    defineField({ name: 'description', type: 'text', title: 'Opis', rows: 4 }),
    defineField({ name: 'mapUrl', type: 'url', title: 'Google Maps embed URL' }),
    defineField({ name: '_oldPath', type: 'string', title: 'Stara pot (za preusmeritve)' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'address' },
  },
})
