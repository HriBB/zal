/**
 * Seed siteSettings singleton with the real ZAL navigation and footer links.
 *
 * Run: node --experimental-strip-types scripts/seed-site-settings.ts
 * Flags:
 *   SEED_FORCE=1   overwrite an existing authored singleton
 *
 * The document uses _id = "siteSettings" (matches the Studio singleton).
 * Default: createIfNotExists — leaves an existing document intact.
 * With SEED_FORCE=1: createOrReplace — overwrites any existing content.
 */

import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const force = process.env.SEED_FORCE === '1'

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token, apiVersion, useCdn: false })

// ── Navigation derived from the old site IA → new clean URL tree ───────────
// Primary nav: O arhivu, Za uporabnike, Za ustvarjalce, Aktualno, Digiteka
// External links (VAC, SIRAnet) go to externalArchiveLinks, not primary nav.
const doc = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  nav: [
    {
      _key: 'nav-o-arhivu',
      _type: 'navItem',
      label: 'O arhivu',
      linkType: 'internal',
      href: '/o-arhivu',
      children: [
        { _key: 'nav-predstavitev', _type: 'navChild', label: 'Predstavitev', linkType: 'internal', href: '/o-arhivu/predstavitev' },
        { _key: 'nav-zgodovina', _type: 'navChild', label: 'Zgodovina arhiva', linkType: 'internal', href: '/o-arhivu/zgodovina-arhiva' },
        { _key: 'nav-vizitka', _type: 'navChild', label: 'Vizitka', linkType: 'internal', href: '/o-arhivu/vizitka' },
        { _key: 'nav-kontakti', _type: 'navChild', label: 'Kontakti', linkType: 'internal', href: '/o-arhivu/kontakti' },
        { _key: 'nav-uradne-ure', _type: 'navChild', label: 'Uradne ure', linkType: 'internal', href: '/o-arhivu/uradne-ure' },
        { _key: 'nav-kako-do-nas', _type: 'navChild', label: 'Kako do nas', linkType: 'internal', href: '/o-arhivu/kako-do-nas' },
        { _key: 'nav-katalog', _type: 'navChild', label: 'Katalog informacij javnega značaja', linkType: 'internal', href: '/o-arhivu/katalog-informacij-javnega-znacaja' },
      ],
    },
    {
      _key: 'nav-za-uporabnike',
      _type: 'navItem',
      label: 'Za uporabnike',
      linkType: 'internal',
      href: '/za-uporabnike',
      children: [
        { _key: 'nav-prvic', _type: 'navChild', label: 'Prvič v arhivu', linkType: 'internal', href: '/za-uporabnike/prvic-v-arhivu' },
        { _key: 'nav-citalnica', _type: 'navChild', label: 'Čitalnica', linkType: 'internal', href: '/za-uporabnike/citalnica' },
        { _key: 'nav-iskanje', _type: 'navChild', label: 'Iskanje gradiva', linkType: 'internal', href: '/za-uporabnike/iskanje-gradiva' },
        { _key: 'nav-digiteka-nav', _type: 'navChild', label: 'Digiteka', linkType: 'internal', href: '/digiteka' },
        { _key: 'nav-izdajanje', _type: 'navChild', label: 'Izdajanje dokumentov', linkType: 'internal', href: '/za-uporabnike/izdajanje-dokumentov' },
        { _key: 'nav-cenik', _type: 'navChild', label: 'Cenik', linkType: 'internal', href: '/za-uporabnike/cenik-storitev' },
        { _key: 'nav-knjiznica', _type: 'navChild', label: 'Knjižnica', linkType: 'internal', href: '/za-uporabnike/knjiznica' },
        { _key: 'nav-ucne-ure', _type: 'navChild', label: 'Učne ure', linkType: 'internal', href: '/za-uporabnike/ucne-ure' },
        { _key: 'nav-programi', _type: 'navChild', label: 'Programi za vrtce in šole', linkType: 'internal', href: '/za-uporabnike/programi-za-vrtce-in-sole' },
      ],
    },
    {
      _key: 'nav-za-ustvarjalce',
      _type: 'navItem',
      label: 'Za ustvarjalce',
      linkType: 'internal',
      href: '/za-ustvarjalce',
      children: [
        { _key: 'nav-obveznosti', _type: 'navChild', label: 'Obveznosti in priporočila', linkType: 'internal', href: '/za-ustvarjalce/obveznosti-in-priporocila' },
        { _key: 'nav-imetniki', _type: 'navChild', label: 'Imetniki zasebnega gradiva', linkType: 'internal', href: '/za-ustvarjalce/imetniki-zasebnega-gradiva' },
        { _key: 'nav-register', _type: 'navChild', label: 'Register ustvarjalcev', linkType: 'internal', href: '/za-ustvarjalce/register-ustvarjalcev' },
        { _key: 'nav-usposabljanja', _type: 'navChild', label: 'Strokovna usposabljanja', linkType: 'internal', href: '/za-ustvarjalce/strokovna-usposabljanja' },
      ],
    },
    {
      _key: 'nav-publikacije',
      _type: 'navItem',
      label: 'Publikacije',
      linkType: 'internal',
      href: '/publikacije',
      children: [
        { _key: 'nav-zalozniska', _type: 'navChild', label: 'Založniška dejavnost', linkType: 'internal', href: '/publikacije/zalozniska-dejavnost' },
        { _key: 'nav-na-spletu', _type: 'navChild', label: 'Publikacije na spletu', linkType: 'internal', href: '/publikacije/publikacije-na-spletu' },
        { _key: 'nav-knjigarna', _type: 'navChild', label: 'Knjigarna', linkType: 'internal', href: '/publikacije/knjigarna' },
      ],
    },
    {
      _key: 'nav-aktualno',
      _type: 'navItem',
      label: 'Aktualno',
      linkType: 'internal',
      href: '/novice',
      children: [
        { _key: 'nav-novice', _type: 'navChild', label: 'Novice', linkType: 'internal', href: '/novice' },
        { _key: 'nav-arhivalija', _type: 'navChild', label: 'Arhivalija meseca', linkType: 'internal', href: '/novice/arhivalija-meseca' },
        { _key: 'nav-razstave', _type: 'navChild', label: 'Razstave', linkType: 'internal', href: '/novice/razstave' },
      ],
    },
    {
      _key: 'nav-digiteka',
      _type: 'navItem',
      label: 'Digiteka',
      linkType: 'internal',
      href: '/digiteka',
    },
    {
      _key: 'nav-enote',
      _type: 'navItem',
      label: 'Enote',
      linkType: 'internal',
      href: '/enote',
    },
  ],

  footerLinks: [
    { _key: 'fl-iskanje', _type: 'footerLink', label: 'Iskanje', linkType: 'internal', href: '/iskanje' },
    { _key: 'fl-enote', _type: 'footerLink', label: 'Enote', linkType: 'internal', href: '/enote' },
    { _key: 'fl-digiteka', _type: 'footerLink', label: 'Digiteka', linkType: 'internal', href: '/digiteka' },
    { _key: 'fl-kontakti', _type: 'footerLink', label: 'Kontakti', linkType: 'internal', href: '/o-arhivu/kontakti' },
    { _key: 'fl-dostopnost', _type: 'footerLink', label: 'Izjava o dostopnosti', linkType: 'internal', href: '/izjava-o-dostopnosti' },
    { _key: 'fl-dopisna', _type: 'footerLink', label: 'Dopisna lista', linkType: 'internal', href: '/za-uporabnike/dopisna-lista' },
  ],

  socialLinks: [] as { _key: string; _type: string; label: string; url: string }[],

  externalArchiveLinks: [
    { _key: 'ext-vac', _type: 'extLink', label: 'VAC — Virtualni arhivski center', url: 'http://www.archivportal.si/' },
    { _key: 'ext-siranet', _type: 'extLink', label: 'SIRAnet', url: 'http://www.siranet.si/' },
    { _key: 'ext-ars', _type: 'extLink', label: 'Arhiv RS', url: 'http://www.arhiv.gov.si/' },
    { _key: 'ext-pokrajinski', _type: 'extLink', label: 'Pokrajinski arhiv Maribor', url: 'http://www.pokarh-mb.si/' },
  ],
}

async function run() {
  if (force) {
    console.log('[seed] SEED_FORCE=1 — overwriting siteSettings')
    await client.createOrReplace(doc)
  } else {
    console.log('[seed] createIfNotExists — keeping existing siteSettings if present')
    await client.createIfNotExists(doc)
  }
  console.log('[seed] siteSettings done')
}

run().catch((err) => {
  console.error('[seed] failed:', err)
  process.exit(1)
})
