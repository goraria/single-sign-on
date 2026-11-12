import { HTTPException } from "hono/http-exception";

export type DirectoryEnvironment = "local" | "production";
export interface DirectoryClient {
  clientId: string; uri: string | null; disabled: boolean | null;
  referenceId: string | null; scopes: string[] | null; metadata: unknown;
}
export interface DirectoryResource {
  identifier: string; disabled: boolean; metadata: unknown;
}
const serviceKeys: Record<string, string> = {
  "shared-notification-center": "notify", "shared-resource-interaction": "resource",
  "shared-discovery-engine": "discovery", "shared-payment-gateway": "payment",
  "shared-billing-subscription": "billing", "shared-media-storage": "media",
  "shared-insight-governance": "insight", commerce: "commerce",
};
function metadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function origin(value: string, environment: DirectoryEnvironment) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
    local !== (environment === "local") ||
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    (!local && /^(?:\d+\.\d+\.\d+\.\d+|\[)/.test(url.hostname)))
    throw new Error("invalid_directory_origin");
  return url.origin;
}
export function buildApplicationDirectory(
  clients: DirectoryClient[], resources: DirectoryResource[],
  environment: DirectoryEnvironment, authority: string,
) {
  const applications: Record<string, { origin: string; clientIds: string[] }> = {};
  const services: Record<string, { origin: string; audience: string }> = {};
  const insert = (target: Record<string, { origin: string }>, key: string, value: { origin: string }) => {
    if (Object.hasOwn(target, key) && target[key]?.origin !== value.origin)
      throw new HTTPException(503, { message: "ambiguous_directory_registration" });
  };
  for (const client of clients) {
    const meta = metadata(client.metadata);
    if (client.disabled || client.referenceId !== "sso-administration" ||
      meta.environment !== environment || !client.uri) continue;
    // Only native app read/write scopes establish an existing application's namespace.
    // Multi-namespace clients need an explicit administrative application label.
    const namespaces = [...new Set((client.scopes ?? []).flatMap((scope) =>
      /^([a-z][a-z0-9-]*):(?:read|write)$/.exec(scope)?.[1] ?? []))];
    const key = typeof meta.application === "string" && namespaces.includes(meta.application)
      ? meta.application : namespaces.length === 1 ? namespaces[0] : undefined;
    if (!key || !/^[a-z][a-z0-9-]{0,63}$/.test(key)) continue;
    let registered: string;
    try { registered = origin(client.uri, environment); } catch { continue; }
    insert(applications, key, { origin: registered });
    const previous = applications[key];
    applications[key] = { origin: registered, clientIds: [...new Set([...(previous?.clientIds ?? []), client.clientId])].sort() };
  }
  for (const resource of resources) {
    if (resource.disabled) continue;
    const application = String(metadata(resource.metadata).application);
    const key = Object.hasOwn(serviceKeys, application) ? serviceKeys[application] : undefined;
    if (!key) continue;
    let registered: string;
    try { registered = origin(resource.identifier, environment); } catch { continue; }
    insert(services, key, { origin: registered });
    services[key] = { origin: registered, audience: registered };
  }
  const issuer = new URL("/auth", authority).href;
  applications.sso = { origin: new URL(authority).origin, clientIds: [] };
  return { version: 1 as const, environment, issuer, applications, services };
}
