// Declaring a scope does NOT grant it to public clients. Only explicitly
// registered confidential clients may receive these client_credentials scopes.
const applications = [
  "chat",
  "video",
  "reader",
  "social",
  "task",
  "marketplace",
] as const
export const notificationPublishScopes = applications.map(
  (application) => `${application}:notification:publish`
)
export const discoveryIndexScopes = applications.map(
  (application) => `${application}:discovery:write`
)
export const serviceMachineScopes = [
  ...notificationPublishScopes,
  ...discoveryIndexScopes,
]
