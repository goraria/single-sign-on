import { Hono } from "hono"

import {
  createSsoApplication,
  rotateSsoApplicationCredential,
  createUser,
  deleteSsoApplication,
  getSsoApplication,
  getUserById,
  listOAuthConsents,
  listOAuthResources,
  listSessions,
  listSsoApplications,
  listUsers,
  updateSsoApplication,
  updateUser,
  getOAuthResource,
  createOAuthResource,
  updateOAuthResource,
  deleteOAuthResource,
  listAuditLogs,
  revokeAdminSession,
  revokeAdminUserSessions,
  revokeOAuthConsent,
} from "@/controllers/admin"
import { requireAdmin } from "@/middlewares/admin"
import { auditAdminMutation } from "@/middlewares/admin-audit"

import {
  adoptOAuthClient,
  listOAuthScopeRevisions,
  publishOAuthScopeRevision,
} from "@/controllers/oauth-registry"
import {
  listOAuthClientResources,
  linkOAuthClientResource,
  unlinkOAuthClientResource,
} from "@/controllers/oauth-client-resource"

const router = new Hono()
router.post(
  "/sso-application/:id/management",
  requireAdmin(),
  auditAdminMutation("oauth-client", "oauth-client.adopt"),
  adoptOAuthClient
)
router.get("/oauth-scope", requireAdmin(), listOAuthScopeRevisions)
router.post(
  "/oauth-scope",
  requireAdmin(),
  auditAdminMutation("oauth-scope", "oauth-scope.publish"),
  publishOAuthScopeRevision
)
router.get(
  "/sso-application/:id/resource",
  requireAdmin(),
  listOAuthClientResources
)
router.post(
  "/sso-application/:id/resource/:resourceId",
  requireAdmin(),
  auditAdminMutation("client-resource"),
  linkOAuthClientResource
)
router.delete(
  "/sso-application/:id/resource/:resourceId",
  requireAdmin(),
  auditAdminMutation("client-resource"),
  unlinkOAuthClientResource
)

router.get("/user", requireAdmin(), listUsers)
router.post("/sso-application/:id/credential", requireAdmin(), auditAdminMutation("oauth-client", "oauth-client.credential.rotate"), rotateSsoApplicationCredential)
router.get("/user/:id", requireAdmin(), getUserById)
router.post("/user", requireAdmin(), auditAdminMutation("user"), createUser)
router.patch(
  "/user/:id",
  requireAdmin(),
  auditAdminMutation("user"),
  updateUser
)
router.get("/session", requireAdmin(), listSessions)
router.delete(
  "/session/:id",
  requireAdmin(),
  auditAdminMutation("session"),
  revokeAdminSession
)
router.delete(
  "/user/:id/session",
  requireAdmin(),
  auditAdminMutation("session", "session.revoke-all"),
  revokeAdminUserSessions
)
router.get("/audit-log", requireAdmin(), listAuditLogs)
router.get("/oauth-resource", requireAdmin(), listOAuthResources)
router.get("/oauth-resource/:id", requireAdmin(), getOAuthResource)
router.post(
  "/oauth-resource",
  requireAdmin(),
  auditAdminMutation("oauth-resource"),
  createOAuthResource
)
router.patch(
  "/oauth-resource/:id",
  requireAdmin(),
  auditAdminMutation("oauth-resource"),
  updateOAuthResource
)
router.delete(
  "/oauth-resource/:id",
  requireAdmin(),
  auditAdminMutation("oauth-resource"),
  deleteOAuthResource
)
router.get("/oauth-consent", requireAdmin(), listOAuthConsents)
router.delete(
  "/oauth-consent/:id",
  requireAdmin(),
  auditAdminMutation("oauth-consent"),
  revokeOAuthConsent
)
router.get("/sso-application", requireAdmin(), listSsoApplications)
router.get("/sso-application/:id", requireAdmin(), getSsoApplication)
router.post(
  "/sso-application",
  requireAdmin(),
  auditAdminMutation("sso-application"),
  createSsoApplication
)
router.patch(
  "/sso-application/:id",
  requireAdmin(),
  auditAdminMutation("sso-application"),
  updateSsoApplication
)
router.delete(
  "/sso-application/:id",
  requireAdmin(),
  auditAdminMutation("sso-application"),
  deleteSsoApplication
)

export default router
