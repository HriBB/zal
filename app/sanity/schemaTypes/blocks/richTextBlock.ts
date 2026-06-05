import { defineArrayMember, defineField, defineType } from 'sanity'

export const richTextBlockType = defineType({
  name: 'richTextBlock',
  title: 'Besedilo',
  type: 'object',
  fields: [
    defineField({
      name: 'body',
      title: 'Vsebina',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normalno', value: 'normal' },
            { title: 'Naslov 2', value: 'h2' },
            { title: 'Naslov 3', value: 'h3' },
            { title: 'Citat', value: 'blockquote' },
          ],
          lists: [
            { title: 'Točkovan seznam', value: 'bullet' },
            { title: 'Številčen seznam', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Krepko', value: 'strong' },
              { title: 'Ležeče', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Povezava',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                    validation: (r) => r.required(),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({ type: 'figure' }),
      ],
    }),
  ],
  preview: {
    select: { body: 'body' },
    prepare({ body }) {
      const first = Array.isArray(body) ? body[0] : null
      const text =
        first?._type === 'block'
          ? (first.children ?? []).map((c: { text?: string }) => c.text ?? '').join('')
          : 'Blok besedila'
      return { title: text.slice(0, 60) || 'Besedilo' }
    },
  },
})
