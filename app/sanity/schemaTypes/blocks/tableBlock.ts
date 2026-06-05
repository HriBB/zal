import { defineArrayMember, defineField, defineType } from 'sanity'

export const tableCellType = defineType({
  name: 'tableCell',
  title: 'Celica',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Besedilo',
      type: 'string',
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare({ text }) {
      return { title: (text as string) ?? '(prazno)' }
    },
  },
})

export const tableRowType = defineType({
  name: 'tableRow',
  title: 'Vrstica',
  type: 'object',
  fields: [
    defineField({
      name: 'isHeader',
      title: 'Glava tabele',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'cells',
      title: 'Celice',
      type: 'array',
      of: [defineArrayMember({ type: 'tableCell' })],
    }),
  ],
  preview: {
    select: { cells: 'cells', isHeader: 'isHeader' },
    prepare({ cells, isHeader }) {
      const text = Array.isArray(cells)
        ? (cells as { text?: string }[]).map((c) => c.text ?? '').join(' | ')
        : ''
      return {
        title: `${isHeader ? '[GLAVA] ' : ''}${text.slice(0, 60)}`,
      }
    },
  },
})

export const tableBlockType = defineType({
  name: 'tableBlock',
  title: 'Tabela',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      title: 'Vrstice',
      type: 'array',
      of: [defineArrayMember({ type: 'tableRow' })],
    }),
  ],
  preview: {
    select: { rows: 'rows' },
    prepare({ rows }) {
      const count = Array.isArray(rows) ? rows.length : 0
      return {
        title: `Tabela (${count} ${count === 1 ? 'vrstica' : 'vrstic'})`,
      }
    },
  },
})
