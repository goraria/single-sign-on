"use client"

/* eslint-disable react-hooks/rules-of-hooks -- These functions create caller service definitions. */

import {
  createMutationService,
  createQueryService,
  useMutation,
  useQuery,
} from "@/lib/utils/caller"
import { apiBaseUrl } from "@/lib/utils/environment"
import type { User } from "@/schemas/users"

const fallbackApiBaseUrl = "http://localhost:8080"

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

const adminBaseUrl = apiBaseUrl ?? fallbackApiBaseUrl
export const ssoApplicationsQueryKey = ["admin", "sso-applications"] as const
export const usersQueryKey = ["admin", "users"] as const

const applicationsService = useQuery<SsoApplication[], undefined>({
  queryKey: ssoApplicationsQueryKey,
  query: {
    url: "/admin/sso-applications",
    method: "GET",
    baseURL: adminBaseUrl,
  },
})

const usersService = useQuery<User[], undefined>({
  queryKey: usersQueryKey,
  query: {
    url: "/admin/users",
    method: "GET",
    baseURL: adminBaseUrl,
  },
})

const createApplicationService = useMutation<
  SsoApplication,
  SsoApplicationPayload
>({
  query: (body) => ({
    url: "/admin/sso-applications",
    method: "POST",
    baseURL: adminBaseUrl,
    body,
  }),
  invalidates: [ssoApplicationsQueryKey],
})

const updateApplicationService = useMutation<
  SsoApplication,
  UpdateSsoApplicationRequest
>({
  query: ({ id, payload }) => ({
    url: `/admin/sso-applications/${encodeURIComponent(id)}`,
    method: "PATCH",
    baseURL: adminBaseUrl,
    body: payload,
  }),
  invalidates: [ssoApplicationsQueryKey],
})

const deleteApplicationService = useMutation<{ id: string }, string>({
  query: (id) => ({
    url: `/admin/sso-applications/${encodeURIComponent(id)}`,
    method: "DELETE",
    baseURL: adminBaseUrl,
  }),
  invalidates: [ssoApplicationsQueryKey],
})

export const useSsoApplicationsQuery = createQueryService(applicationsService)
export const useUsersQuery = createQueryService(usersService)
export const useCreateSsoApplicationMutation = createMutationService(
  createApplicationService
)
export const useUpdateSsoApplicationMutation = createMutationService(
  updateApplicationService
)
export const useDeleteSsoApplicationMutation = createMutationService(
  deleteApplicationService
)
