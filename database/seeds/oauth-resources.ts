export interface OAuthResourceSeed {
  identifier: string
  name: string
  accessTokenTtl: number
  allowedScopes: string[]
  metadata: {
    application: string
    managedBy: "database-seed"
  }
}

export const chatResourceUrl = "http://localhost:3030"
export const videoResourceUrl = "http://localhost:3031"
export const readerResourceUrl = "http://localhost:3032"
export const socialResourceUrl = "http://localhost:3033"
export const taskResourceUrl = "http://localhost:3034"
export const marketplaceResourceUrl = "http://localhost:3035"
export const resourceInteractionResourceUrl = "http://localhost:5053"
export const notificationCenterResourceUrl = "http://localhost:5052"
export const mediaStorageResourceUrl = "http://localhost:5057"
export const paymentGatewayResourceUrl = "http://localhost:5055"
export const billingSubscriptionResourceUrl = "http://localhost:5056"
export const discoveryEngineResourceUrl = "http://localhost:5054"
export const insightGovernanceResourceUrl = "http://localhost:5058"

const accessTokenTtl = 60 * 10
const oidcScopes = ["openid", "profile", "email", "offline_access"]

export const oauthResourceSeeds = [
  {
    identifier: chatResourceUrl,
    name: "Gorth Chat API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "chat:read", "chat:write"],
    metadata: {
      application: "chat",
      managedBy: "database-seed",
    },
  },
  {
    identifier: videoResourceUrl,
    name: "Gorth Video API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "video:read", "video:write"],
    metadata: {
      application: "video",
      managedBy: "database-seed",
    },
  },
  {
    identifier: readerResourceUrl,
    name: "Gorth Reader API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "reader:read", "reader:write"],
    metadata: {
      application: "reader",
      managedBy: "database-seed",
    },
  },
  {
    identifier: socialResourceUrl,
    name: "Gorth Social API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "social:read", "social:write"],
    metadata: {
      application: "social",
      managedBy: "database-seed",
    },
  },
  {
    identifier: taskResourceUrl,
    name: "Gorth Task API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "task:read", "task:write"],
    metadata: {
      application: "task",
      managedBy: "database-seed",
    },
  },
  {
    identifier: marketplaceResourceUrl,
    name: "Gorth Marketplace API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "marketplace:read", "marketplace:write"],
    metadata: {
      application: "marketplace",
      managedBy: "database-seed",
    },
  },
  {
    identifier: resourceInteractionResourceUrl,
    name: "Gorth Resource Interaction API",
    accessTokenTtl,
    allowedScopes: [
      ...oidcScopes,
      "chat:read",
      "chat:write",
      "video:read",
      "video:write",
      "reader:read",
      "reader:write",
      "social:read",
      "social:write",
      "task:read",
      "task:write",
      "marketplace:read",
      "marketplace:write",
    ],
    metadata: {
      application: "shared-resource-interaction",
      managedBy: "database-seed",
    },
  },
  {
    identifier: notificationCenterResourceUrl,
    name: "Gorth Notification Center API",
    accessTokenTtl,
    allowedScopes: [
      ...oidcScopes,
      "chat:read",
      "chat:write",
      "video:read",
      "video:write",
      "reader:read",
      "reader:write",
      "social:read",
      "social:write",
      "task:read",
      "task:write",
      "marketplace:read",
      "marketplace:write",
    ],
    metadata: {
      application: "shared-notification-center",
      managedBy: "database-seed",
    },
  },
  {
    identifier: mediaStorageResourceUrl,
    name: "Gorth Media Storage API",
    accessTokenTtl,
    allowedScopes: [
      ...oidcScopes,
      "video:read",
      "video:write",
      "reader:read",
      "reader:write",
      "social:read",
      "social:write",
      "marketplace:read",
      "marketplace:write",
    ],
    metadata: {
      application: "shared-media-storage",
      managedBy: "database-seed",
    },
  },
  {
    identifier: paymentGatewayResourceUrl,
    name: "Gorth Payment Gateway API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "marketplace:read", "marketplace:write"],
    metadata: {
      application: "shared-payment-gateway",
      managedBy: "database-seed",
    },
  },
  {
    identifier: billingSubscriptionResourceUrl,
    name: "Gorth Billing Subscription API",
    accessTokenTtl,
    allowedScopes: [...oidcScopes, "marketplace:read", "marketplace:write"],
    metadata: {
      application: "shared-billing-subscription",
      managedBy: "database-seed",
    },
  },
  {
    identifier: discoveryEngineResourceUrl,
    name: "Gorth Discovery API",
    accessTokenTtl,
    allowedScopes: [
      ...oidcScopes,
      "chat:read",
      "chat:write",
      "video:read",
      "video:write",
      "reader:read",
      "reader:write",
      "social:read",
      "social:write",
      "task:read",
      "task:write",
      "marketplace:read",
      "marketplace:write",
    ],
    metadata: {
      application: "shared-discovery-engine",
      managedBy: "database-seed",
    },
  },
  {
    identifier: insightGovernanceResourceUrl,
    name: "Gorth Insight Governance API",
    accessTokenTtl,
    allowedScopes: [
      ...oidcScopes,
      "chat:read",
      "chat:write",
      "video:read",
      "video:write",
      "reader:read",
      "reader:write",
      "social:read",
      "social:write",
      "task:read",
      "task:write",
      "marketplace:read",
      "marketplace:write",
    ],
    metadata: {
      application: "shared-insight-governance",
      managedBy: "database-seed",
    },
  },
] satisfies OAuthResourceSeed[]

export const oauthClientResourceSeeds = [
  {
    clientId: "gorth-interactive-messaging-portal",
    resourceIds: [
      chatResourceUrl,
      resourceInteractionResourceUrl,
      notificationCenterResourceUrl,
      discoveryEngineResourceUrl,
    ],
  },
  {
    clientId: "gorth-video-streaming-platform",
    resourceIds: [
      videoResourceUrl,
      resourceInteractionResourceUrl,
      notificationCenterResourceUrl,
      mediaStorageResourceUrl,
      discoveryEngineResourceUrl,
    ],
  },
  {
    clientId: "gorth-content-reader-platform",
    resourceIds: [
      readerResourceUrl,
      resourceInteractionResourceUrl,
      notificationCenterResourceUrl,
      mediaStorageResourceUrl,
      discoveryEngineResourceUrl,
    ],
  },
  {
    clientId: "gorth-social-networking-portal",
    resourceIds: [
      socialResourceUrl,
      resourceInteractionResourceUrl,
      notificationCenterResourceUrl,
      mediaStorageResourceUrl,
      discoveryEngineResourceUrl,
    ],
  },
  {
    clientId: "gorth-task-productivity-suite",
    resourceIds: [
      taskResourceUrl,
      resourceInteractionResourceUrl,
      notificationCenterResourceUrl,
      discoveryEngineResourceUrl,
    ],
  },
  {
    clientId: "gorth-online-marketplace-solution",
    resourceIds: [
      marketplaceResourceUrl,
      resourceInteractionResourceUrl,
      notificationCenterResourceUrl,
      mediaStorageResourceUrl,
      paymentGatewayResourceUrl,
      billingSubscriptionResourceUrl,
      discoveryEngineResourceUrl,
    ],
  },
] as const
