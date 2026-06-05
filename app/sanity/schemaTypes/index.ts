import type { SchemaTypeDefinition } from 'sanity'

import { siteSettingsType } from './singletons/siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettingsType,
]

export const SINGLETONS = ['siteSettings'] as const
