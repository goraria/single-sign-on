"use client"

/* eslint-disable react-hooks/rules-of-hooks -- These functions create caller service definitions. */

import {
  createMutationService,
  createQueryService,
  useMutation,
  useQuery,
} from "@/lib/utils/caller"
import type { User } from "@/schemas/users"

export interface SsoApplication {
  id: string
  clientId: string
  name: string
  description: string | null
  homepageUrl: string | null
  icon: string | null
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  scopes: string[]
  grantTypes: string[]
  responseTypes: string[]
  public: boolean
  requirePKCE: boolean
  tokenEndpointAuthMethod: string
  skipConsent: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SsoApplicationPayload {
  clientId: string
  name: string
  description?: string | null
  homepageUrl?: string | null
  icon?: string | null
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  scopes: string[]
  grantTypes: string[]
  responseTypes: string[]
  public: boolean
  requirePKCE: boolean
  tokenEndpointAuthMethod: string
  skipConsent: boolean
  disabled: boolean
}

export interface UpdateSsoApplicationRequest {
  id: string
  payload: SsoApplicationPayload
}

export const ssoApplicationsQueryKey = ["admin", "sso-applications"] as const
export const usersQueryKey = ["admin", "users"] as const

const applicationsService = useQuery<SsoApplication[], undefined>({
  queryKey: ssoApplicationsQueryKey,
  query: {
    url: "/admin/gateway/sso-applications",
    method: "GET",
    baseURL: null,
    credentials: "include",
  },
})

const usersService = useQuery<User[], undefined>({
  queryKey: usersQueryKey,
  query: {
    url: "/admin/gateway/users",
    method: "GET",
    baseURL: null,
    credentials: "include",
  },
})

const createApplicationService = useMutation<
  SsoApplication,
  SsoApplicationPayload
>({
  query: (body) => ({
    url: "/admin/gateway/sso-applications",
    method: "POST",
    baseURL: null,
    credentials: "include",
    body,
  }),
  invalidates: [ssoApplicationsQueryKey],
})

const updateApplicationService = useMutation<
  SsoApplication,
  UpdateSsoApplicationRequest
>({
  query: ({ id, payload }) => ({
    url: `/admin/gateway/sso-applications/${encodeURIComponent(id)}`,
    method: "PATCH",
    baseURL: null,
    credentials: "include",
    body: payload,
  }),
  invalidates: [ssoApplicationsQueryKey],
})

const deleteApplicationService = useMutation<{ id: string }, string>({
  query: (id) => ({
    url: `/admin/gateway/sso-applications/${encodeURIComponent(id)}`,
    method: "DELETE",
    baseURL: null,
    credentials: "include",
  }),
  invalidates: [ssoApplicationsQueryKey],
})

export const useSsoApplicationsQuery = createQueryService(
  applicationsService
)
export const useUsersQuery = createQueryService(
  usersService
)
export const useCreateSsoApplicationMutation = createMutationService(
  createApplicationService
)
export const useUpdateSsoApplicationMutation = createMutationService(
  updateApplicationService
)
export const useDeleteSsoApplicationMutation = createMutationService(
  deleteApplicationService
)
