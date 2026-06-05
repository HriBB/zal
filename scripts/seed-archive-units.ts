/**
 * Seed Sanity with the 5 ZAL archive units.
 *
 * Run: node --experimental-strip-types scripts/seed-archive-units.ts
 * Flags:
 *   SEED_FORCE=1   always createOrReplace (replaces any editor edits)
 *   SEED_DRY=1     print docs without writing to Sanity
 *
 * Idempotency:
 *   - stable _ids (archiveUnit.{slug})
 *   - default: createIfNotExists — preserves editor edits
 *   - SEED_FORCE=1: createOrReplace — overwrites all fields
 */

import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
void __dirname // used for path resolution pattern consistency

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const dry = process.env.SEED_DRY === '1'
const force = process.env.SEED_FORCE === '1'

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token && !dry) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token: token ?? '', apiVersion, useCdn: false })

// ── Archive unit data ─────────────────────────────────────────────────────────
// Extracted from WP REST dump:
//   - addresses: from unit page content
//   - contacts + hours: from Divi footer baked into every page (common footer for all units)
//   - map URLs: from /kako-do-nas page iframes (in document order: Ljubljana, Kranj, NM, SL, Idrija)
//
// Old paths are the canonical WP URLs under /domaca-stran-1/o-arhivu-2/predstavitev/
// for the 301 redirect map (issue #15).

type HourSlot = { _type: 'hourSlot'; _key: string; days: string; hours: string }
type PhoneEntry = { _type: 'object'; _key: string; label: string | null; number: string }

type ArchiveUnitDoc = {
  _id: string
  _type: 'archiveUnit'
  name: string
  slug: { _type: 'slug'; current: string }
  address: string
  phones: PhoneEntry[]
  emails: string[]
  officeHours: HourSlot[]
  readingRoomHours: HourSlot[]
  mapUrl: string
  _oldPath: string
}

function makeSlot(key: string, days: string, hours: string): HourSlot {
  return { _type: 'hourSlot', _key: key, days, hours }
}

function makePhone(key: string, label: string | null, number: string): PhoneEntry {
  return { _type: 'object', _key: key, label, number }
}

const units: ArchiveUnitDoc[] = [
  {
    _id: 'archiveUnit.ljubljana',
    _type: 'archiveUnit',
    name: 'Enota v Ljubljani',
    slug: { _type: 'slug', current: 'ljubljana' },
    address: 'Trdinova ulica 4, p. p. 1614\n1001 Ljubljana',
    phones: [
      makePhone('ph-lj-1', 'Čitalnica', '+386 (0)1 306 13 20'),
      makePhone('ph-lj-2', 'Sprejemna pisarna', '+386 (0)1 306 13 03'),
      makePhone('ph-lj-3', 'Fax', '+386 (0)1 426 43 03'),
    ],
    emails: ['sprejemna@zal-lj.si'],
    officeHours: [
      makeSlot('oh-lj-1', 'ponedeljek', '8.00–14.00'),
      makeSlot('oh-lj-2', 'sreda', '8.00–16.00'),
      makeSlot('oh-lj-3', 'petek', '8.00–12.00'),
    ],
    readingRoomHours: [
      makeSlot('rr-lj-1', 'ponedeljek, torek, četrtek in petek', '8.00–14.00'),
      makeSlot('rr-lj-2', 'sreda', '8.00–16.00'),
    ],
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2768.7698851612217!2d14.503458115764428!3d46.05568800180079!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4765329e79eae6ad%3A0x805eb0ad2000717!2sTrdinova%20ulica%204%2C%201000%20Ljubljana!5e0!3m2!1sen!2ssi!4v1659525719601!5m2!1sen!2ssi',
    _oldPath: '/domaca-stran-1/o-arhivu-2/predstavitev/enota-v-ljubljani/',
  },
  {
    _id: 'archiveUnit.kranj',
    _type: 'archiveUnit',
    name: 'Enota za Gorenjsko Kranj',
    slug: { _type: 'slug', current: 'kranj' },
    address: 'Savska cesta 8\n4000 Kranj',
    phones: [
      makePhone('ph-kr-1', null, '+386 (0)4 280 59 00'),
      makePhone('ph-kr-2', 'Fax', '+386 (0)4 202 44 48'),
    ],
    emails: ['zal.kra@zal-lj.si'],
    officeHours: [
      makeSlot('oh-kr-1', 'ponedeljek, sreda', '8.00–14.00'),
      makeSlot('oh-kr-2', 'petek', '8.00–12.00'),
    ],
    readingRoomHours: [
      makeSlot('rr-kr-1', 'ponedeljek, sreda', '8.00–14.00'),
      makeSlot('rr-kr-2', 'torek, petek', '8.00–12.00'),
    ],
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d5519.284207515226!2d14.355833988134378!3d46.23746154798559!3m2!1i1024!2i768!4f13.1!2m1!1sZgodovinski+arhiv+Ljubljana+Savska+cesta+8%2C+4000+Kranj!5e0!3m2!1ssl!2ssi!4v1425628306050',
    _oldPath: '/domaca-stran-1/o-arhivu-2/predstavitev/enota-za-gorenjsko-kranj/',
  },
  {
    _id: 'archiveUnit.novo-mesto',
    _type: 'archiveUnit',
    name: 'Enota za Dolenjsko in Belo krajino Novo mesto',
    slug: { _type: 'slug', current: 'novo-mesto' },
    address: 'Skalickega ulica 1 (grad Grm)\n8000 Novo mesto',
    phones: [
      makePhone('ph-nm-1', null, '+386 (0)7 394 22 40'),
      makePhone('ph-nm-2', 'Fax', '+386 (0)7 394 22 48'),
    ],
    emails: ['zal.nme@zal-lj.si'],
    officeHours: [
      makeSlot('oh-nm-1', 'ponedeljek, sreda', '8.00–14.00'),
      makeSlot('oh-nm-2', 'petek', '8.00–12.00'),
    ],
    readingRoomHours: [
      makeSlot('rr-nm-1', 'ponedeljek, sreda', '8.00–14.00'),
      makeSlot('rr-nm-2', 'torek, petek', '8.00–12.00'),
    ],
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d2781.800169984101!2d15.171577!3d45.795230999999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1szgodovinski+arhiv+Novo+mesto+Skalickega+1%2C+8000+Novo+mesto!5e0!3m2!1ssl!2ssi!4v1425628114772',
    _oldPath:
      '/domaca-stran-1/o-arhivu-2/predstavitev/enota-za-dolenjsko-in-belo-krajino-novo-mesto/',
  },
  {
    _id: 'archiveUnit.skofja-loka',
    _type: 'archiveUnit',
    name: 'Enota v Škofji Loki',
    slug: { _type: 'slug', current: 'skofja-loka' },
    address: 'Partizanska cesta 1c\n4220 Škofja Loka',
    phones: [
      makePhone('ph-sl-1', null, '+386 (0)4 506 07 00'),
      makePhone('ph-sl-2', 'Fax', '+386 (0)4 506 07 08'),
    ],
    emails: ['zal.skl@zal-lj.si'],
    // Škofja Loka has combined reading room + office
    officeHours: [makeSlot('oh-sl-1', 'ponedeljek, sreda, četrtek', '8.00–13.00')],
    readingRoomHours: [makeSlot('rr-sl-1', 'ponedeljek, sreda, četrtek', '8.00–13.00')],
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2763.0659295125597!2d14.308007448166842!3d46.16934329281031!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x477ac61a65c445dd%3A0xf642feadebf5eca0!2sPartizanska+cesta+1c%2C+4220+%C5%A0kofja+Loka!5e0!3m2!1ssl!2ssi!4v1463990045384',
    _oldPath: '/domaca-stran-1/o-arhivu-2/predstavitev/enota-v-skofji-loki/',
  },
  {
    _id: 'archiveUnit.idrija',
    _type: 'archiveUnit',
    name: 'Enota v Idriji',
    slug: { _type: 'slug', current: 'idrija' },
    address: 'Prelovčeva ulica 2\n5280 Idrija',
    phones: [
      makePhone('ph-id-1', null, '+386 (0)5 372 22 70'),
      makePhone('ph-id-2', 'Fax', '+386 (0)5 372 22 71'),
    ],
    emails: ['zal.idr@zal-lj.si'],
    // Idrija has combined reading room + office
    officeHours: [makeSlot('oh-id-1', 'ponedeljek, sreda, četrtek', '8.00–13.00')],
    readingRoomHours: [makeSlot('rr-id-1', 'ponedeljek, sreda, četrtek', '8.00–13.00')],
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d2771.528984533109!2d14.020846763360703!3d46.00063300350919!3m2!1i1024!2i768!4f13.1!2m1!1sZgodovinski+arhiv+Ljubljana+Prelov%C4%8Deva+ulica+2%2C+5280+Idrija!5e0!3m2!1ssl!2ssi!4v1425628470278',
    _oldPath: '/domaca-stran-1/o-arhivu-2/predstavitev/enota-v-idriji/',
  },
]

// ── Unit photos ───────────────────────────────────────────────────────────────
// Historical photos from the variant-A prototype assets (approved as the
// intended unit imagery). Uploads are content-hash deduplicated by Sanity, so
// re-runs are idempotent. If the files are gone (prototype/ deleted after
// issue #19 sign-off), existing photos on the documents are left untouched.

const PHOTOS_DIR = join(__dirname, '..', 'prototype', 'assets')

const unitPhotos: Record<string, { file: string; alt: string }> = {
  'archiveUnit.ljubljana': { file: 'ljubljana-1903.jpg', alt: 'Ljubljana okoli leta 1903' },
  'archiveUnit.kranj': { file: 'kranj-1909.jpg', alt: 'Kranj okoli leta 1909' },
  'archiveUnit.novo-mesto': { file: 'novo-mesto-1920.jpg', alt: 'Novo mesto okoli leta 1920' },
  'archiveUnit.skofja-loka': { file: 'skofja-loka-1910.jpg', alt: 'Škofja Loka okoli leta 1910' },
  'archiveUnit.idrija': { file: 'idrija-1919.jpg', alt: 'Idrija okoli leta 1919' },
}

async function ensurePhoto(unitId: string): Promise<void> {
  const photo = unitPhotos[unitId]
  if (!photo) return
  const absPath = join(PHOTOS_DIR, photo.file)
  if (!existsSync(absPath)) {
    console.warn(`  [photo] file missing, skipping: ${photo.file}`)
    return
  }
  const asset = await client.assets.upload('image', readFileSync(absPath), {
    filename: photo.file,
    label: photo.alt,
  })
  // Additive: never overwrite a photo an editor has set.
  await client
    .patch(unitId)
    .setIfMissing({ photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
    .commit()
  console.log(`  photo ensured: ${unitId} ← ${photo.file}`)
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${units.length} archive units (force=${force}, dry=${dry})…`)

  for (const unit of units) {
    if (dry) {
      console.log('DRY:', JSON.stringify(unit, null, 2))
      continue
    }

    if (force) {
      await client.createOrReplace(unit)
      console.log(`createOrReplace: ${unit._id}`)
    } else {
      await client.createIfNotExists(unit)
      console.log(`createIfNotExists: ${unit._id}`)
    }

    await ensurePhoto(unit._id)
  }

  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
