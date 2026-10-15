"use client"

/* eslint-disable react-hooks/rules-of-hooks -- These functions create caller service definitions. */

import {
  createMutationService,
  createQueryService,
  useMutation,
  useQuery,
} from "@/utils/caller"
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
  banned: boolean
  banExpires: string | null
  banReason: string | null
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
  banned: boolean
  banExpires?: string | null
  banReason?: string | null
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
  signingKeyId: string | null
  allowedScopes: string[] | null
  dpopBoundAccessTokensRequired: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
  policyVersion: number
  application: string | null
}

export interface OAuthResourcePayload {
  identifier: string
  name: string
  accessTokenTtl: number | null
  refreshTokenTtl: number | null
  signingAlgorithm: "RS256" | "PS256" | "ES256" | "ES512" | "EdDSA" | null
  signingKeyId: string | null
  allowedScopes: string[] | null
  dpopBoundAccessTokensRequired: boolean
  disabled: boolean
}

export interface UpdateOAuthResourceRequest {
  id: string
  payload: OAuthResourcePayload
}

export interface OAuthResourcesRequest extends Record<string, unknown> {
  page: number
  limit: number
  search?: string
  status?: "enabled" | "disabled"
  sortBy?: "name" | "identifier" | "accessTokenTtl" | "state" | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export interface OAuthResourcesResponse {
  items: OAuthResource[]
  total: number
  page: number
  limit: number
}

export interface OAuthConsent {
  id: string
  clientId: string
  clientName: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  referenceId: string | null
  resources: string[] | null
  scopes: string[]
  createdAt: string | null
  updatedAt: string | null
}

export interface AdminSecurityRequest extends Record<string, unknown> {
  page: number
  limit: number
  search?: string
  userId?: string
  clientId?: string
  actorUserId?: string
  outcome?: "success" | "failure"
  resourceType?: string
  from?: string
  to?: string
}
export interface AdminSecurityPage<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
export interface AdminAuditLog {
  id: string
  actorUserId: string | null
  actorName: string | null
  actorEmail: string | null
  action: string
  outcome: "success" | "failure"
  resourceType: string | null
  resourceId: string | null
  requestId: string | null
  phase: string | null
  status: string | null
  subjectUserId: string | null
  clientId: string | null
  createdAt: string
}

export const ssoApplicationsQueryKey = ["admin", "sso-application"] as const
export const usersQueryKey = ["admin", "user"] as const
export const sessionsQueryKey = ["admin", "session"] as const
export const oauthResourcesQueryKey = ["admin", "oauth-resource"] as const
export const oauthConsentsQueryKey = ["admin", "oauth-consent"] as const
export const auditLogsQueryKey = ["admin", "audit-log"] as const

const applicationsService = useQuery<
  SsoApplicationsResponse,
  SsoApplicationsRequest
>({
  queryKey: (request) => [...ssoApplicationsQueryKey, request] as const,
  query: (request) => ({
    url: "/admin/gateway/sso-application",
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
    url: `/admin/gateway/sso-application/${encodeURIComponent(id)}`,
    method: "GET",
    baseURL: null,
    credentials: "include",
  }),
  queryOptions: (id) => ({ enabled: Boolean(id) }),
})

const usersService = useQuery<AdminUsersResponse, AdminUsersRequest>({
  queryKey: (request) => [...usersQueryKey, request] as const,
  query: (request) => ({
    url: "/admin/gateway/user",
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
    url: `/admin/gateway/user/${encodeURIComponent(id)}`,
    method: "GET",
    baseURL: null,
    credentials: "include",
  }),
  queryOptions: (id) => ({ enabled: Boolean(id) }),
})

const createUserService = useMutation<AdminUser, AdminUserPayload>({
  query: (body) => ({
    url: "/admin/gateway/user",
    method: "POST",
    baseURL: null,
    credentials: "include",
    body,
  }),
  invalidates: [usersQueryKey, auditLogsQueryKey],
})

const updateUserService = useMutation<AdminUser, UpdateAdminUserRequest>({
  query: ({ id, payload }) => ({
    url: `/admin/gateway/user/${encodeURIComponent(id)}`,
    method: "PATCH",
    baseURL: null,
    credentials: "include",
    body: payload,
  }),
  invalidates: [usersQueryKey, auditLogsQueryKey],
})

const sessionsService = useQuery<
  AdminSecurityPage<AdminSession>,
  AdminSecurityRequest
>({
  queryKey: (request) => [...sessionsQueryKey, request],
  query: (request) => ({
    url: "/admin/gateway/session",
    method: "GET",
    baseURL: null,
    credentials: "include",
    params: request,
  }),
})

const oauthResourcesService = useQuery<
  OAuthResourcesResponse,
  OAuthResourcesRequest
>({
  queryKey: (request) => [...oauthResourcesQueryKey, request] as const,
  query: (request) => ({
    url: "/admin/gateway/oauth-resource",
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

const oauthResourceService = useQuery<OAuthResource, string>({
  queryKey: (id) => [...oauthResourcesQueryKey, id] as const,
  query: (id) => ({
    url: `/admin/gateway/oauth-resource/${encodeURIComponent(id)}`,
    method: "GET",
    baseURL: null,
    credentials: "include",
  }),
  queryOptions: (id) => ({ enabled: Boolean(id) }),
})

const createOAuthResourceService = useMutation<
  OAuthResource,
  OAuthResourcePayload
>({
  query: (body) => ({
    url: "/admin/gateway/oauth-resource",
    method: "POST",
    baseURL: null,
    credentials: "include",
    body,
  }),
  invalidates: [oauthResourcesQueryKey, auditLogsQueryKey],
})

const updateOAuthResourceService = useMutation<
  OAuthResource,
  UpdateOAuthResourceRequest
>({
  query: ({ id, payload }) => ({
    url: `/admin/gateway/oauth-resource/${encodeURIComponent(id)}`,
    method: "PATCH",
    baseURL: null,
    credentials: "include",
    body: payload,
  }),
  invalidates: [oauthResourcesQueryKey, auditLogsQueryKey],
})

const deleteOAuthResourceService = useMutation<{ id: string }, string>({
  query: (id) => ({
    url: `/admin/gateway/oauth-resource/${encodeURIComponent(id)}`,
    method: "DELETE",
    baseURL: null,
    credentials: "include",
  }),
  invalidates: [oauthResourcesQueryKey, auditLogsQueryKey],
})

const oauthConsentsService = useQuery<
  AdminSecurityPage<OAuthConsent>,
  AdminSecurityRequest
>({
  queryKey: (request) => [...oauthConsentsQueryKey, request],
  query: (request) => ({
    url: "/admin/gateway/oauth-consent",
    method: "GET",
    baseURL: null,
    credentials: "include",
    params: request,
  }),
})

const auditLogsService = useQuery<
  AdminSecurityPage<AdminAuditLog>,
  AdminSecurityRequest
>({
  queryKey: (request) => [...auditLogsQueryKey, request],
  query: (request) => ({
    url: "/admin/gateway/audit-log",
    method: "GET",
    baseURL: null,
    credentials: "include",
    params: request,
  }),
})
const revokeAdminSessionService = useMutation<{ id: string }, string>({
  query: (id) => ({
    url: `/admin/gateway/session/${encodeURIComponent(id)}`,
    method: "DELETE",
    baseURL: null,
    credentials: "include",
  }),
  invalidates: [sessionsQueryKey, auditLogsQueryKey],
})
const revokeAdminUserSessionsService = useMutation<{ userId: string }, string>({
  query: (id) => ({
    url: `/admin/gateway/user/${encodeURIComponent(id)}/session`,
    method: "DELETE",
    baseURL: null,
    credentials: "include",
  }),
  invalidates: [sessionsQueryKey, auditLogsQueryKey],
})
const revokeOAuthConsentService = useMutation<{ id: string }, string>({
  query: (id) => ({
    url: `/admin/gateway/oauth-consent/${encodeURIComponent(id)}`,
    method: "DELETE",
    baseURL: null,
    credentials: "include",
  }),
  invalidates: [oauthConsentsQueryKey, auditLogsQueryKey],
})
export const useAuditLogsQuery = createQueryService(auditLogsService)
export const useRevokeAdminSessionMutation = createMutationService(
  revokeAdminSessionService
)
export const useRevokeAdminUserSessionsMutation = createMutationService(
  revokeAdminUserSessionsService
)
export const useRevokeOAuthConsentMutation = createMutationService(
  revokeOAuthConsentService
)

const createApplicationService = useMutation<
  SsoApplication,
  SsoApplicationPayload
>({
  query: (body) => ({
    url: "/admin/gateway/sso-application",
    method: "POST",
    baseURL: null,
    credentials: "include",
    body,
  }),
  invalidates: [ssoApplicationsQueryKey, auditLogsQueryKey],
})

const updateApplicationService = useMutation<
  SsoApplication,
  UpdateSsoApplicationRequest
>({
  query: ({ id, payload }) => ({
    url: `/admin/gateway/sso-application/${encodeURIComponent(id)}`,
    method: "PATCH",
    baseURL: null,
    credentials: "include",
    body: payload,
  }),
  invalidates: [ssoApplicationsQueryKey, auditLogsQueryKey],
})

const deleteApplicationService = useMutation<{ id: string }, string>({
  query: (id) => ({
    url: `/admin/gateway/sso-application/${encodeURIComponent(id)}`,
    method: "DELETE",
    baseURL: null,
    credentials: "include",
  }),
  invalidates: [ssoApplicationsQueryKey, auditLogsQueryKey],
})

export const useSsoApplicationsQuery = createQueryService(applicationsService)
export const useSsoApplicationQuery = createQueryService(applicationService)
export const useUsersQuery = createQueryService(usersService)
export const useUserQuery = createQueryService(userService)
export const useCreateUserMutation = createMutationService(createUserService)
export const useUpdateUserMutation = createMutationService(updateUserService)
export const useAdminSessionsQuery = createQueryService(sessionsService)
export const useOAuthResourcesQuery = createQueryService(oauthResourcesService)
export const useOAuthResourceQuery = createQueryService(oauthResourceService)
export const useCreateOAuthResourceMutation = createMutationService(
  createOAuthResourceService
)
export const useUpdateOAuthResourceMutation = createMutationService(
  updateOAuthResourceService
)
export const useDeleteOAuthResourceMutation = createMutationService(
  deleteOAuthResourceService
)
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
