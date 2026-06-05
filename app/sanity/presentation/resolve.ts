import { defineLocations } from 'sanity/presentation'

import type { PresentationPluginOptions } from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    siteSettings: defineLocations({
      message: 'Ta dokument vpliva na navigacijo in nogo vseh strani',
      locations: [{ title: 'Domov', href: '/' }],
    }),
  },
}
