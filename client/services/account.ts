"use client"

/* eslint-disable react-hooks/rules-of-hooks -- These functions create caller service definitions. */

import {
  createMutationService,
  createQueryService,
  useMutation,
  useQuery,
} from "@/lib/utils/caller"

export interface AccountSession {
  id: string
  token: string
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export const accountSessionsQueryKey = ["account", "sessions"] as const

const accountSessionsService = useQuery<AccountSession[], undefined>({
  queryKey: accountSessionsQueryKey,
  query: {
    url: "/auth/list-sessions",
    method: "GET",
    baseURL: null,
    credentials: "include",
    auth: false,
  },
})

const revokeSessionService = useMutation<null, string>({
  query: (token) => ({
    url: "/auth/revoke-session",
    method: "POST",
    baseURL: null,
    credentials: "include",
    auth: false,
    body: { token },
  }),
  invalidates: [accountSessionsQueryKey],
})

export const useAccountSessionsQuery = createQueryService(
  accountSessionsService
)
export const useRevokeSessionMutation = createMutationService(
  revokeSessionService
)
