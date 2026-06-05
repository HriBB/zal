import { useQuery } from '@sanity/react-loader'

import type { QueryParams } from '@sanity/client'
import type { QueryResponseInitial } from '@sanity/react-loader'

/**
 * A GROQ query bound to its result type — and, when parameterised, its params type.
 * One descriptor binds query string + result type so server loader and client subscription
 * can never drift apart.
 */
export type SanityQuery<
  Result,
  Params extends QueryParams = QueryParams,
> = {
  readonly query: string
  /** phantom — carries Result/Params at the type level only, never read at runtime */
  readonly __types?: (params: Params) => Result
}

export function defineSanityQuery<Result, Params extends QueryParams = QueryParams>(
  query: string,
): SanityQuery<Result, Params> {
  return { query }
}

/** Wire shape from `loadSanity` to `useSanity`. */
export type SanityLoaderData<
  Result,
  Params extends QueryParams = QueryParams,
> = {
  initial: QueryResponseInitial<Result>
  params: Params
}

export function useSanity<Result, Params extends QueryParams>(
  descriptor: SanityQuery<Result, Params>,
  loaderData: SanityLoaderData<Result, Params>,
): Result | null {
  const { data } = useQuery<Result | null>(descriptor.query, loaderData.params, {
    initial: loaderData.initial as QueryResponseInitial<Result | null>,
  })
  return data ?? null
}
