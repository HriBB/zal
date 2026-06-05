/**
 * Seed the /izjava-o-dostopnosti (accessibility statement) page as a Sanity DRAFT.
 *
 * This page is mandated by the EU Web Accessibility Directive (2016/2102) and
 * Slovenian law (ZDSZ). The content below is based on the standard Slovenian
 * template but REQUIRES HUMAN REVIEW before publishing. An editor should review
 * the legal wording, update the conformance status, and publish via Studio.
 *
 * Run: pnpm seed:izjava
 * To publish: open /studio → Pages → "Izjava o dostopnosti" → Publish
 */

import 'dotenv/config'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? '',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: process.env.SANITY_API_VERSION ?? '2024-10-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const SLUG = 'izjava-o-dostopnosti'
// Use drafts. prefix so the page appears in Studio for review but is NOT published
const DOC_ID = `drafts.page.${SLUG}`

const body = `
Zgodovinski arhiv Ljubljana (v nadaljevanju: ZAL) si prizadeva za dostopnost svojega spletnega mesta za osebe s posebnimi potrebami v skladu z Zakonom o dostopnosti spletišč in mobilnih aplikacij (ZDSZA) in Direktivo EU 2016/2102.

## Stanje skladnosti

To spletno mesto je delno skladno z zahtevami WCAG 2.1, ravni AA.

Spletno mesto je bilo nazadnje pregledano dne: [DATUM PREGLEDA — dopolniti pred objavo].

## Nedostopna vsebina

Spodaj so navedene vsebine, ki niso dostopne, in razlogi za to:

- Nekateri starejši dokumenti v formatu PDF morda niso popolnoma dostopni za bralnike zaslona.
- Nekatere arhivske slike morda nimajo zadostnega opisnega alternativnega besedila.

Navedene pomanjkljivosti odpravljamo postopoma.

## Kontakt in povratna informacija

Če ugotovite, da vsebina ali funkcionalnost tega spletnega mesta ni dostopna, nas kontaktirajte:

- E-naslov: sprejemna@zal-lj.si
- Telefon: +386 1 306 13 06
- Naslov: Mestni trg 27, 1000 Ljubljana

Odgovorili vam bomo v roku 14 delovnih dni.

## Izvršilni postopek

Če na naše obvestilo o nedostopnosti ne odgovorimo v ustreznem roku ali vam odgovor ne zadosti, se lahko obrnete na Informacijskega pooblaščenca RS (www.ip-rs.si).

## Datum priprave

Ta izjava je bila pripravljena [DATUM — dopolniti pred objavo] na podlagi samoocenjevanja.
`.trim()

const richTextBody = [
  {
    _type: 'block',
    _key: 'intro',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'intro-span',
        text: body,
        marks: [],
      },
    ],
  },
]

const doc = {
  _id: DOC_ID,
  _type: 'page',
  title: 'Izjava o dostopnosti',
  slug: { _type: 'slug', current: SLUG },
  blocks: [
    {
      _type: 'richTextBlock',
      _key: 'main-block',
      body: richTextBody,
    },
  ],
  _oldPath: null,
}

async function run() {
  console.log(`Seeding ${DOC_ID} …`)
  await client.createOrReplace(doc)
  console.log('Done. Open Studio → Pages → "Izjava o dostopnosti" to review and publish.')
  console.log(
    'IMPORTANT: Review all [DATUM] placeholders and legal wording before publishing.',
  )
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
