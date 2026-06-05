import { CogIcon } from '@sanity/icons'

import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolver,
} from 'sanity/structure'

function singleton(
  S: StructureBuilder,
  id: string,
  title: string,
  icon: Parameters<ReturnType<StructureBuilder['listItem']>['icon']>[0],
) {
  return S.listItem()
    .id(id)
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(id).documentId(id).title(title))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Vsebina')
    .items([
      singleton(S, 'siteSettings', 'Nastavitve strani', CogIcon),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S) => S.document()
