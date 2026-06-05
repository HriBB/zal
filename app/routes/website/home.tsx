import type { Route } from './+types/home'

export const meta: Route.MetaFunction = () => [
  { title: 'Zgodovinski arhiv Ljubljana' },
  {
    name: 'description',
    content:
      'Zgodovinski arhiv Ljubljana hrani arhivsko gradivo osrednje Slovenije ' +
      'v petih območnih enotah.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="section">
        <div className="container-page max-w-3xl">
          <p className="text-zal text-sm font-semibold tracking-[0.08em] uppercase">
            Zgodovinski arhiv Ljubljana
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl">
            Arhivsko gradivo osrednje Slovenije
          </h1>
          <p className="text-muted-foreground mt-6 text-lg">
            Javni zavod s petimi območnimi enotami, ki hrani, ureja in
            posreduje arhivsko gradivo za Ljubljano in širšo regijo.
          </p>
        </div>
      </section>

      <section className="section bg-muted">
        <div className="container-page">
          <h2 className="text-2xl">Digiteka, novice in območne enote</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Spletišče je v izdelavi. Vsebine se postopoma selijo iz starega
            sistema.
          </p>
        </div>
      </section>
    </>
  )
}
