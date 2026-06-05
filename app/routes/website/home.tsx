import { Form, Link } from 'react-router'

import type { Route } from './+types/home'

import { sanityImageUrl } from '~/lib/image-url'
import { buildMeta, ZAL_NAME, ZAL_ORIGIN } from '~/lib/meta'
import { buildOrganizationJsonLd } from '~/lib/jsonld'
import { loadSanity } from '~/sanity/data.server'
import {
  homeArhavalijaQuery,
  homeLatestPostsQuery,
  homePageQuery,
  archiveUnitsQuery,
  type PostSummary,
  type ServiceCard,
  type ArchiveUnitSummary,
  type HomePageData,
} from '~/sanity/queries'

const HOME_DESCRIPTION =
  'Zgodovinski arhiv Ljubljana hrani arhivsko gradivo osrednje Slovenije ' +
  'v petih območnih enotah.'

export function meta({ data, location }: Route.MetaArgs) {
  const units = data?.units?.initial?.data ?? []
  const ogImageUrl = data?.homePage?.initial?.data?.hero?.image?.asset?.url ?? null
  return [
    ...buildMeta({
      title: ZAL_NAME,
      description: HOME_DESCRIPTION,
      pathname: location.pathname,
      ogImageUrl,
      noSuffix: true,
    }),
    { 'script:ld+json': buildOrganizationJsonLd(units, ZAL_ORIGIN) },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const [homePage, latestPosts, units, arhivalija] = await Promise.all([
    loadSanity(request, homePageQuery),
    loadSanity(request, homeLatestPostsQuery),
    loadSanity(request, archiveUnitsQuery),
    loadSanity(request, homeArhavalijaQuery),
  ])
  return { homePage, latestPosts, units, arhivalija }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UtilityBar() {
  return (
    <div className="bg-zal text-white text-xs" role="complementary" aria-label="Kontaktni podatki">
      <div className="container-page py-1.5 flex justify-between items-center">
        <span>Uradne ure čitalnic: pon, tor, čet 8.00–14.00 · sre 8.00–16.00</span>
        <span className="hidden sm:flex gap-4">
          <a href="mailto:sprejemna@zal-lj.si" className="hover:underline">
            sprejemna@zal-lj.si
          </a>
          <a href="tel:+38613061306" className="hover:underline">
            +386 1 306 13 06
          </a>
        </span>
      </div>
    </div>
  )
}

function HeroSection({ homePage }: { homePage: HomePageData | null }) {
  const heading = homePage?.hero?.heading ?? 'Čuvamo preteklost za prihodnost'
  const lead =
    homePage?.hero?.lead ??
    'Pet enot, več kot 11.000 tekočih metrov gradiva, od listine iz leta 1320 do digitalnih zapisov.'
  const imgUrl = sanityImageUrl(homePage?.hero?.image?.asset?.url, { w: 1920, auto: 'format', q: 80 })

  return (
    <section aria-label="Hero" className="relative">
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={homePage?.hero?.image?.alt ?? ''}
          className="w-full h-[420px] object-cover"
          fetchPriority="high"
        />
      ) : (
        <div className="w-full h-[420px] bg-stone-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#171412]/80 via-[#171412]/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 pb-10">
        <div className="container-page">
          <h1 className="text-white text-3xl md:text-5xl font-bold max-w-2xl drop-shadow">
            {heading}
          </h1>
          <p className="text-white/80 mt-2 max-w-xl">{lead}</p>
          <Form method="get" action="/iskanje" className="mt-5 flex max-w-xl bg-white rounded-lg shadow-lg overflow-hidden">
            <input
              name="q"
              placeholder="Išči po fondih, zbirkah in objavah …"
              className="flex-1 px-4 py-3 text-sm outline-none text-stone-900"
              aria-label="Iskanje"
            />
            <button
              type="submit"
              className="bg-zal text-white px-6 text-sm font-semibold hover:bg-zal-light transition-colors"
            >
              Išči
            </button>
          </Form>
        </div>
      </div>
    </section>
  )
}

function ServiceCards({ cards }: { cards: ServiceCard[] }) {
  if (cards.length === 0) return null
  return (
    <section aria-label="Storitve" className="container-page py-12">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card._key}
            to={card.href}
            className="group border border-stone-200 rounded-lg p-5 hover:border-zal hover:shadow-md transition-shadow"
          >
            <div className="font-semibold group-hover:text-zal transition-colors">{card.title}</div>
            {card.description && (
              <p className="text-sm text-stone-500 mt-1">{card.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

function CategoryChip({ title }: { title: string }) {
  return (
    <span className="bg-zal/10 text-zal font-semibold px-2 py-0.5 rounded text-xs">
      {title}
    </span>
  )
}

function NewsGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <section aria-label="Aktualno" className="bg-stone-50 py-12">
      <div className="container-page">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold">Aktualno</h2>
          <Link to="/novice" className="text-sm text-zal font-semibold hover:underline">
            Vse objave →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-stone-500">Ni objav.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-lg border border-stone-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-xs mb-3">
                  {post.categories.map((cat) => (
                    <CategoryChip key={cat._id} title={cat.title} />
                  ))}
                  <span className="text-stone-400">
                    {new Date(post.date).toLocaleDateString('sl-SI')}
                  </span>
                </div>
                <h3 className="font-semibold leading-snug">
                  <Link to={`/novice/${post.slug}`} className="hover:text-zal transition-colors">
                    {post.title}
                  </Link>
                </h3>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function UnitStrip({ units }: { units: ArchiveUnitSummary[] }) {
  return (
    <section aria-label="Območne enote" className="container-page py-12">
      <h2 className="text-2xl font-bold mb-6">Naše enote</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {units.map((unit) => (
          <Link
            key={unit._id}
            to={`/enote/${unit.slug}`}
            className="group relative rounded-lg overflow-hidden aspect-[3/4] bg-stone-200"
          >
            {unit.photo?.asset?.url ? (
              <img
                src={sanityImageUrl(unit.photo.asset.url, { w: 400, auto: 'format', q: 75 }) ?? unit.photo.asset.url}
                alt={unit.photo.alt ?? unit.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-stone-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#171412]/90 to-transparent" />
            <div className="absolute bottom-0 p-3 text-white">
              <div className="font-bold text-sm">{unit.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ArhavalijaBand({ post }: { post: PostSummary | null }) {
  if (!post) return null
  return (
    <section aria-label="Arhivalija meseca" className="bg-zal text-white">
      <div className="container-page py-12 grid md:grid-cols-2 gap-8 items-center">
        {post.mainImage?.asset?.url && (
          <img
            src={sanityImageUrl(post.mainImage.asset.url, { w: 900, auto: 'format', q: 80 }) ?? post.mainImage.asset.url}
            alt={post.mainImage.alt}
            className="rounded-lg shadow-2xl max-h-80 object-cover w-full"
            loading="lazy"
          />
        )}
        <div>
          <div className="text-amber-300 text-sm font-semibold uppercase tracking-wider mb-2">
            Arhivalija meseca
          </div>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">{post.title}</h2>
          <div className="mt-5">
            <Link
              to={`/novice/${post.slug}`}
              className="bg-white text-zal font-semibold px-5 py-2.5 rounded hover:bg-amber-50 transition-colors inline-block"
            >
              Preberi zgodbo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const homePage = loaderData.homePage.initial.data
  const latestPosts = loaderData.latestPosts.initial.data ?? []
  const units = loaderData.units.initial.data ?? []
  const arhivalija = loaderData.arhivalija.initial.data ?? null

  const cards = homePage?.serviceCards ?? []

  return (
    <>
      <UtilityBar />
      <HeroSection homePage={homePage} />
      <ServiceCards cards={cards} />
      <NewsGrid posts={latestPosts} />
      <UnitStrip units={units} />
      <ArhavalijaBand post={arhivalija} />
    </>
  )
}
