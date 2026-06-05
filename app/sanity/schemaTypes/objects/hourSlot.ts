import { defineField, defineType } from 'sanity'

export const hourSlotType = defineType({
  name: 'hourSlot',
  type: 'object',
  fields: [
    defineField({ name: 'days', type: 'string', title: 'Dnevi', validation: (r) => r.required() }),
    defineField({ name: 'hours', type: 'string', title: 'Ure', validation: (r) => r.required() }),
  ],
  preview: {
    select: { title: 'days', subtitle: 'hours' },
  },
})
