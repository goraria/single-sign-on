import { buildApplicationDirectory, type DirectoryClient, type DirectoryResource } from "@/utils/application-directory";

export interface MachineDraft {
  clientId: string; name: string; environment: "local" | "production";
  purpose: string; links: { identifier: string; scopes: string[]; ttl: number }[];
}
export function planMachineClients(
  clients: DirectoryClient[], resources: DirectoryResource[], authority: string,
) {
  const drafts: MachineDraft[] = [], blocked: string[] = [];
  for (const environment of ["local", "production"] as const) {
    const directory = buildApplicationDirectory(clients, resources, environment, authority);
    const link = (key: string, scopes: string[]) => {
      const service = directory.services[key];
      if (!service) { blocked.push(environment + ":" + key); return undefined; }
      return { identifier: service.audience, scopes, ttl: 600 };
    };
    const draft = (key: string, links: Array<MachineDraft["links"][number] | undefined>, purpose = key + "-backend") => {
      if (!links.length || links.some((value) => !value)) return;
      drafts.push({ clientId: "gorth-" + key + "-backend-" + environment,
        name: "Gorth " + key + " backend (" + environment + ")", environment, purpose,
        links: links as MachineDraft["links"] });
    };
    draft("payment", [link("commerce", ["commerce:payment:sync"])]);
    const commerceApplications = ["marketplace", "restaurant"].filter(application => directory.applications[application]);
    if (directory.services.commerce && commerceApplications.length) {
      const url = new URL(authority);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (local === (environment === "local")) draft("commerce", [
        link("notify", commerceApplications.map(application => application + ":notification:publish")),
        link("discovery", commerceApplications.map(application => application + ":discovery:write")),
        { identifier: new URL("/auth/commerce/notification-recipient", authority).href,
          scopes: ["commerce:notification:recipient"], ttl: 120 },
      ], "commerce-outbox");
    }
    if (directory.services.media) {
      const credentials = Object.entries(directory.applications).flatMap(([application, registration]) => {
        const url = new URL(registration.origin);
        const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
        if (local !== (environment === "local")) return [];
        return [{ identifier: new URL("/internal/storage/credential", registration.origin).href,
          scopes: ["storage:" + application + ":credential"], ttl: 120 }];
      });
      draft("media", credentials, "media-storage-credential-reader");
    } else blocked.push(environment + ":media");
    for (const application of Object.keys(directory.applications)) {
      if (!["chat", "video", "reader", "social", "task", "marketplace", "restaurant"].includes(application)) continue;
      const links = [
        link("notify", [application + ":notification:publish"]),
        link("discovery", [application + ":discovery:write"]),
      ];
      if (["chat", "video", "reader", "social", "task"].includes(application))
        links.push(link("media", [application + ":media:delegate"]));
      if (application === "task") links.push(link("resource", ["task:resource:policy"]));
      if (application === "video") links.push(link("resource", ["video:resource:read"]));
      draft(application, links);
    }
  }
  return { drafts, blocked: [...new Set(blocked)].sort() };
}
