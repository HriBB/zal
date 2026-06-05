import { CogIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Nastavitve strani',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'header', title: 'Glava', default: true },
    { name: 'footer', title: 'Noga' },
  ],
  fields: [
    // ── Header navigation (two-level) ──────────────────────────────────────
    defineField({
      name: 'nav',
      title: 'Navigacija',
      type: 'array',
      group: 'header',
      of: [
        {
          type: 'object',
          name: 'navItem',
          fields: [
            defineField({ name: 'label', title: 'Oznaka', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'linkType',
              title: 'Tip povezave',
              type: 'string',
              options: { list: ['internal', 'external'], layout: 'radio' },
              initialValue: 'internal',
            }),
            defineField({ name: 'href', title: 'Pot (interna)', type: 'string' }),
            defineField({ name: 'url', title: 'URL (eksterna)', type: 'url' }),
            defineField({
              name: 'children',
              title: 'Podmeniji',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'navChild',
                  fields: [
                    defineField({ name: 'label', title: 'Oznaka', type: 'string', validation: (r) => r.required() }),
                    defineField({
                      name: 'linkType',
                      title: 'Tip povezave',
                      type: 'string',
                      options: { list: ['internal', 'external'], layout: 'radio' },
                      initialValue: 'internal',
                    }),
                    defineField({ name: 'href', title: 'Pot (interna)', type: 'string' }),
                    defineField({ name: 'url', title: 'URL (eksterna)', type: 'url' }),
                  ],
                  preview: {
                    select: { title: 'label', subtitle: 'href' },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'href' },
          },
        },
      ],
    }),

    // ── Footer ─────────────────────────────────────────────────────────────
    defineField({
      name: 'footerLinks',
      title: 'Koristne povezave (noga)',
      type: 'array',
      group: 'footer',
      of: [
        {
          type: 'object',
          name: 'footerLink',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'linkType',
              type: 'string',
              options: { list: ['internal', 'external'], layout: 'radio' },
              initialValue: 'internal',
            }),
            defineField({ name: 'href', type: 'string' }),
            defineField({ name: 'url', type: 'url' }),
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        },
      ],
    }),

    defineField({
      name: 'socialLinks',
      title: 'Socialna omrežja',
      type: 'array',
      group: 'footer',
      of: [
        {
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', type: 'url', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        },
      ],
    }),

    defineField({
      name: 'externalArchiveLinks',
      title: 'Zunanji arhivi',
      description: 'Povezave na VAC, SIRAnet in partnerske arhive.',
      type: 'array',
      group: 'footer',
      of: [
        {
          type: 'object',
          name: 'extLink',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', type: 'url', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Nastavitve strani' }),
  },
})
