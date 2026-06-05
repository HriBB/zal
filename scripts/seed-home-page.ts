/**
 * Seed homePage singleton with variant-A hero and the eight service cards.
 *
 * Run: node --experimental-strip-types scripts/seed-home-page.ts
 * Flags:
 *   SEED_FORCE=1   overwrite an existing authored singleton
 *
 * The document uses _id = "homePage" (matches the Studio singleton).
 * Default: createIfNotExists — leaves an existing document intact.
 * With SEED_FORCE=1: createOrReplace — overwrites any existing content.
 */

import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

const __dirname = dirname(fileURLToPath(import.meta.url))

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const force = process.env.SEED_FORCE === '1'

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token, apiVersion, useCdn: false })

// Hero image: variant-A panorama from the prototype assets. Upload is
// content-hash deduplicated by Sanity, so re-runs are idempotent. If the file
// is gone (prototype/ deleted after issue #19 sign-off), keep whatever image
// the document already has.
const HERO_IMAGE = join(__dirname, '..', 'prototype', 'assets', 'ljubljana-panorama.jpg')

async function uploadHeroImage(): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } } | null> {
  if (!existsSync(HERO_IMAGE)) {
    console.warn('[seed-home] hero image file missing, skipping image')
    return null
  }
  const asset = await client.assets.upload('image', readFileSync(HERO_IMAGE), {
    filename: 'ljubljana-panorama.jpg',
    label: 'Panorama Ljubljane',
  })
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}

const doc = {
  _id: 'homePage',
  _type: 'homePage',
  hero: {
    heading: 'Čuvamo preteklost za prihodnost',
    lead: 'Pet enot, več kot 11.000 tekočih metrov gradiva, od listine iz leta 1320 do digitalnih zapisov.',
  },
  serviceCards: [
    {
      _key: 'card-prvic',
      _type: 'serviceCard',
      title: 'Prvič v arhivu',
      description: 'Kaj je arhiv, kaj hranimo in kako začeti z raziskovanjem.',
      href: '/za-uporabnike/prvic-v-arhivu',
    },
    {
      _key: 'card-iskanje',
      _type: 'serviceCard',
      title: 'Iskanje gradiva',
      description: 'Vodniki po fondih in zbirkah, SIRAnet in Digiteka.',
      href: '/za-uporabnike/iskanje-gradiva',
    },
    {
      _key: 'card-citalnica',
      _type: 'serviceCard',
      title: 'Čitalnica',
      description: 'Uradne ure, red v čitalnici in naročanje gradiva.',
      href: '/za-uporabnike/citalnica',
    },
    {
      _key: 'card-potrdila',
      _type: 'serviceCard',
      title: 'Izdajanje dokumentov',
      description: 'Potrdila, prepisi in kopije arhivskega gradiva.',
      href: '/za-uporabnike/izdajanje-dokumentov',
    },
    {
      _key: 'card-ucne-ure',
      _type: 'serviceCard',
      title: 'Učne ure',
      description: 'Arhivske delavnice in učne ure za šole in skupine.',
      href: '/za-uporabnike/ucne-ure',
    },
    {
      _key: 'card-izrocitev',
      _type: 'serviceCard',
      title: 'Izročitev gradiva',
      description: 'Postopek predaje arhivskega gradiva v ZAL.',
      href: '/za-ustvarjalce/odbiranje-in-izrocanje-javnega-arhivskega-gradiva',
    },
    {
      _key: 'card-digiteka',
      _type: 'serviceCard',
      title: 'Digiteka',
      description: 'Digitalizirano arhivsko gradivo — listine, popisi, zapisniki.',
      href: '/digiteka',
    },
    {
      _key: 'card-knjigarna',
      _type: 'serviceCard',
      title: 'Knjigarna',
      description: 'Publikacije arhiva — Gradivo in razprave, katalogi razstav.',
      href: '/publikacije/knjigarna',
    },
  ],
}

async function main() {
  const heroImage = await uploadHeroImage()
  if (heroImage) {
    ;(doc.hero as Record<string, unknown>).image = heroImage
  }

  if (force) {
    await client.createOrReplace(doc)
    console.log('homePage written (force)')
    return
  }

  await client.createIfNotExists(doc)
  // Existing document: add the hero image only if an editor has not set one.
  if (heroImage) {
    await client.patch('homePage').setIfMissing({ 'hero.image': heroImage }).commit()
  }
  console.log('homePage created (if-not-exists), hero image ensured')
}

main().catch((err: Error) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
