"use client"

/* eslint-disable react-hooks/rules-of-hooks -- These functions build service definitions; they do not execute React hooks. */

import {
  createMutationService,
  createQueryService,
  useMutation,
  useQuery,
} from "@/lib/utils/caller"

export interface ParamRequest {
  id: string
}

export interface SearchRequest {
  q: string
}

const healthService = useQuery<unknown, undefined>({
  queryKey: ["demo", "health"] as const,
  query: {
    url: "/health",
    method: "GET",
    auth: false,
  },
  queryOptions: {
    retry: false,
  },
})

const paramService = useQuery<unknown, ParamRequest>({
  queryKey: ({ id }: ParamRequest) => ["demo", "param", id] as const,
  query: ({ id }: ParamRequest) => ({
    url: `/param/${encodeURIComponent(id)}`,
    method: "GET",
    auth: false,
  }),
  queryOptions: {
    retry: false,
  },
})

const searchService = useQuery<unknown, SearchRequest>({
  queryKey: ({ q }: SearchRequest) => ["demo", "query", q] as const,
  query: ({ q }: SearchRequest) => ({
    url: "/query",
    method: "GET",
    auth: false,
    params: { q },
  }),
  queryOptions: {
    retry: false,
  },
})

const graphqlService = useMutation<unknown, unknown>({
  query: (body: unknown) => ({
    url: "/graphql",
    method: "POST",
    auth: false,
    body,
  }),
})

export const useHealthQuery = createQueryService(healthService)
export const useParamQuery = createQueryService(paramService)
export const useSearchQuery = createQueryService(searchService)
export const useGraphqlMutation = createMutationService(graphqlService)
