import { map } from 'rxjs'
import { defineDocuments } from 'sanity/presentation'

import type {
  DocumentLocationResolver,
  DocumentLocationsState,
  PresentationPluginOptions,
} from 'sanity/presentation'

import {
  buildArchiveItemPreviewUrl,
  buildCollectionPreviewUrl,
  buildPagePreviewUrl,
  buildPostPreviewUrl,
  type PageAncestor,
} from './url-builders'

const locate: DocumentLocationResolver = (params, { documentStore }) => {
  if (params.type === 'homePage') {
    return {
      message: 'Domača stran',
      locations: [{ title: 'Domov', href: '/' }],
    } satisfies DocumentLocationsState
  }

  if (params.type === 'siteSettings') {
    return {
      message: 'Ta dokument vpliva na navigacijo in nogo vseh strani',
      locations: [{ title: 'Domov', href: '/' }],
    } satisfies DocumentLocationsState
  }

  if (params.type === 'post') {
    return documentStore
      .listenQuery(
        `*[_id == $id][0]{ title, "slug": slug.current }`,
        { id: params.id },
        { perspective: 'previewDrafts' },
      )
      .pipe(
        map((doc: { title?: string; slug?: string } | null) => {
          if (!doc?.slug) return null
          return {
            locations: [{ title: doc.title ?? 'Novica', href: buildPostPreviewUrl(doc.slug) }],
          }
        }),
      )
  }

  if (params.type === 'page') {
    return documentStore
      .listenQuery(
        `*[_id == $id][0]{
          title,
          "slug": slug.current,
          "parent": parent->{ "slug": slug.current, "parent": parent->{ "slug": slug.current } }
        }`,
        { id: params.id },
        { perspective: 'previewDrafts' },
      )
      .pipe(
        map(
          (doc: { title?: string; slug?: string; parent?: PageAncestor | null } | null) => {
            if (!doc?.slug) return null
            return {
              locations: [
                {
                  title: doc.title ?? 'Stran',
                  href: buildPagePreviewUrl(doc.slug, doc.parent),
                },
              ],
            }
          },
        ),
      )
  }

  if (params.type === 'archiveItem') {
    return documentStore
      .listenQuery(
        `*[_id == $id][0]{
          title,
          "slug": slug.current,
          "collection": collection->{ "slug": slug.current }
        }`,
        { id: params.id },
        { perspective: 'previewDrafts' },
      )
      .pipe(
        map(
          (
            doc: {
              title?: string
              slug?: string
              collection?: { slug?: string } | null
            } | null,
          ) => {
            if (!doc?.slug || !doc.collection?.slug) return null
            return {
              locations: [
                {
                  title: doc.title ?? 'Arhivalija',
                  href: buildArchiveItemPreviewUrl(doc.collection.slug, doc.slug),
                },
              ],
            }
          },
        ),
      )
  }

  if (params.type === 'collection') {
    return documentStore
      .listenQuery(
        `*[_id == $id][0]{ name, "slug": slug.current }`,
        { id: params.id },
        { perspective: 'previewDrafts' },
      )
      .pipe(
        map((doc: { name?: string; slug?: string } | null) => {
          if (!doc?.slug) return null
          return {
            locations: [
              {
                title: doc.name ?? 'Zbirka',
                href: buildCollectionPreviewUrl(doc.slug),
              },
            ],
          }
        }),
      )
  }

  if (params.type === 'archiveUnit') {
    return documentStore
      .listenQuery(
        `*[_id == $id][0]{ name, "slug": slug.current }`,
        { id: params.id },
        { perspective: 'previewDrafts' },
      )
      .pipe(
        map((doc: { name?: string; slug?: string } | null) => {
          if (!doc?.slug) return null
          return {
            locations: [{ title: doc.name ?? 'Enota', href: `/enote/${doc.slug}` }],
          }
        }),
      )
  }

  return null
}

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/', filter: `_type == "homePage"` },
    { route: '/novice/:slug', filter: `_type == "post" && slug.current == $slug` },
    {
      route: '/digiteka/:collection/:item',
      filter: `_type == "archiveItem" && slug.current == $item`,
    },
    {
      route: '/digiteka/:collection',
      filter: `_type == "collection" && slug.current == $collection`,
    },
    { route: '/enote/:slug', filter: `_type == "archiveUnit" && slug.current == $slug` },
    // Pages: last segment as slug — covers both top-level and nested.
    { route: '/:slug', filter: `_type == "page" && slug.current == $slug` },
  ]),
  locations: locate,
}
