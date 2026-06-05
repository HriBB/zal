import { CogIcon, DocumentIcon, HomeIcon, ImageIcon, PinIcon, TagIcon } from '@sanity/icons'

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
      singleton(S, 'homePage', 'Domača stran', HomeIcon),
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
      S.divider(),
      S.listItem()
        .id('archiveUnit')
        .title('Enote')
        .icon(PinIcon)
        .child(S.documentTypeList('archiveUnit').title('Enote')),
      S.divider(),
      S.listItem()
        .id('collection')
        .title('Digiteka – Zbirke')
        .icon(ImageIcon)
        .child(S.documentTypeList('collection').title('Zbirke')),
      S.listItem()
        .id('archiveItem')
        .title('Digiteka – Arhivalije')
        .icon(ImageIcon)
        .child(S.documentTypeList('archiveItem').title('Arhivalije')),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S) => S.document()
