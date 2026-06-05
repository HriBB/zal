import { CogIcon, DocumentIcon, TagIcon } from '@sanity/icons'

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
      S.divider(),
      S.listItem()
        .id('post')
        .title('Novice')
        .icon(DocumentIcon)
        .child(S.documentTypeList('post').title('Novice')),
      S.listItem()
        .id('category')
        .title('Kategorije')
        .icon(TagIcon)
        .child(S.documentTypeList('category').title('Kategorije')),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S) => S.document()
