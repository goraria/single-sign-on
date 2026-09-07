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

export interface SsoApplicationsRequest extends Record<string, unknown> {
  page: number
  limit: number
  search?: string
  status?: "enabled" | "disabled"
  sortBy?: "name" | "clientId" | "homepageUrl" | "state" | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export interface SsoApplicationsResponse {
  items: SsoApplication[]
  total: number
  page: number
  limit: number
}

export interface AdminUser extends User {
  username: string | null
  firstName: string | null
  lastName: string | null
}

export interface AdminUsersRequest extends Record<string, unknown> {
  page: number
  limit: number
  search?: string
  state?: "verified" | "unverified" | "banned"
  role?: AdminUser["role"]
  sortBy?: "name" | "email" | "role" | "state" | "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export interface AdminUsersResponse {
  items: AdminUser[]
  total: number
  page: number
  limit: number
}

export interface AdminUserPayload {
  firstName: string
  lastName: string
  username: string
  name: string
  email: string
  image?: string | null
  role: AdminUser["role"]
  emailVerified: boolean
  bannedUntil?: string | null
  password: string
}

export type AdminUserPatch = Partial<AdminUserPayload>

export interface UpdateAdminUserRequest {
  id: string
  payload: AdminUserPatch
}

export interface AdminSession {
  id: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string | null
  userAgent: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface OAuthResource {
  id: string
  identifier: string
  name: string
  accessTokenTtl: number | null
  refreshTokenTtl: number | null
  signingAlgorithm: string | null
  allowedScopes: string[] | null
  dpopBoundAccessTokensRequired: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface OAuthConsent {
  id: string
  clientId: string
  clientName: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  resources: string[] | null
  scopes: string[]
  createdAt: string | null
  updatedAt: string | null
}

export const ssoApplicationsQueryKey = ["admin", "sso-applications"] as const
export const usersQueryKey = ["admin", "users"] as const
export const sessionsQueryKey = ["admin", "sessions"] as const
export const oauthResourcesQueryKey = ["admin", "oauth-resources"] as const
export const oauthConsentsQueryKey = ["admin", "oauth-consents"] as const

const applicationsService = useQuery<
  SsoApplicationsResponse,
  SsoApplicationsRequest
>({
  queryKey: (request) => [...ssoApplicationsQueryKey, request] as const,
  query: (request) => ({
    url: "/admin/gateway/sso-applications",
    method: "GET",
    baseURL: null,
    credentials: "include",
    params: request,
  }),
  queryOptions: {
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  },
})

const applicationService = useQuery<SsoApplication, string>({
  queryKey: (id) => [...ssoApplicationsQueryKey, id] as const,
  query: (id) => ({
    url: `/admin/gateway/sso-applications/${encodeURIComponent(id)}`,
    method: "GET",
    baseURL: null,
    credentials: "include",
  }),
  queryOptions: (id) => ({ enabled: Boolean(id) }),
})

const usersService = useQuery<AdminUsersResponse, AdminUsersRequest>({
  queryKey: (request) => [...usersQueryKey, request] as const,
  query: (request) => ({
    url: "/admin/gateway/users",
    method: "GET",
    baseURL: null,
    credentials: "include",
    params: request,
  }),
  queryOptions: {
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  },
})

const userService = useQuery<AdminUser, string>({
  queryKey: (id) => [...usersQueryKey, id] as const,
  query: (id) => ({
    url: `/admin/gateway/users/${encodeURIComponent(id)}`,
    method: "GET",
    baseURL: null,
    credentials: "include",
  }),
  queryOptions: (id) => ({ enabled: Boolean(id) }),
})

const createUserService = useMutation<AdminUser, AdminUserPayload>({
  query: (body) => ({
    url: "/admin/gateway/users",
    method: "POST",
    baseURL: null,
    credentials: "include",
    body,
  }),
  invalidates: [usersQueryKey],
})

const updateUserService = useMutation<AdminUser, UpdateAdminUserRequest>({
  query: ({ id, payload }) => ({
    url: `/admin/gateway/users/${encodeURIComponent(id)}`,
    method: "PATCH",
    baseURL: null,
    credentials: "include",
    body: payload,
  }),
  invalidates: [usersQueryKey],
})

const sessionsService = useQuery<AdminSession[], undefined>({
  queryKey: sessionsQueryKey,
  query: {
    url: "/admin/gateway/sessions",
    method: "GET",
    baseURL: null,
    credentials: "include",
  },
})

const oauthResourcesService = useQuery<OAuthResource[], undefined>({
  queryKey: oauthResourcesQueryKey,
  query: {
    url: "/admin/gateway/oauth-resources",
    method: "GET",
    baseURL: null,
    credentials: "include",
  },
})

const oauthConsentsService = useQuery<OAuthConsent[], undefined>({
  queryKey: oauthConsentsQueryKey,
  query: {
    url: "/admin/gateway/oauth-consents",
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

export const useSsoApplicationsQuery = createQueryService(applicationsService)
export const useSsoApplicationQuery = createQueryService(applicationService)
export const useUsersQuery = createQueryService(usersService)
export const useUserQuery = createQueryService(userService)
export const useCreateUserMutation = createMutationService(createUserService)
export const useUpdateUserMutation = createMutationService(updateUserService)
export const useAdminSessionsQuery = createQueryService(sessionsService)
export const useOAuthResourcesQuery = createQueryService(oauthResourcesService)
export const useOAuthConsentsQuery = createQueryService(oauthConsentsService)
export const useCreateSsoApplicationMutation = createMutationService(
  createApplicationService
)
export const useUpdateSsoApplicationMutation = createMutationService(
  updateApplicationService
)
export const useDeleteSsoApplicationMutation = createMutationService(
  deleteApplicationService
)
