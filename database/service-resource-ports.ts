import { isDeepStrictEqual } from "node:util"
import type { OAuthResourceSeed } from "./seeds/oauth-resources"

export const serviceResourcePortMappings = [
  { application: "shared-notification-center", oldPort: 7072, newPort: 5052 },
  { application: "shared-resource-interaction", oldPort: 7073, newPort: 5053 },
  { application: "shared-discovery-engine", oldPort: 7074, newPort: 5054 },
  { application: "shared-payment-gateway", oldPort: 7075, newPort: 5055 },
  { application: "shared-billing-subscription", oldPort: 7076, newPort: 5056 },
  { application: "shared-media-storage", oldPort: 7077, newPort: 5057 },
  { application: "shared-insight-governance", oldPort: 7078, newPort: 5058 },
].map((entry) => ({
  ...entry,
  oldIdentifier: `http://localhost:${entry.oldPort}`,
  identifier: `http://localhost:${entry.newPort}`,
}))

export interface ResourcePortRow extends Record<string, unknown> {
  identifier: string
  metadata: { application?: string } | null
}

export interface ResourcePortConnection {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    parameters?: unknown[]
  ): Promise<{ rows: Row[]; rowCount: number | null }>
}

interface ResourcePortLink extends Record<string, unknown> {
  resource_id: string
}

export function planServiceResourcePorts(rows: ResourcePortRow[]) {
  return serviceResourcePortMappings.map((mapping) => {
    const previous = rows.find(
      (row) => row.identifier === mapping.oldIdentifier
    )
    const current = rows.find((row) => row.identifier === mapping.identifier)
    // Do not silently merge two independent policies/grant sets.
    if (previous && current) throw new Error("resource_port_collision")
    if (
      (previous ?? current)?.metadata?.application !== mapping.application &&
      (previous || current)
    ) {
      throw new Error("unexpected_resource_application")
    }
    if (!previous && !current && mapping.newPort !== 5058)
      throw new Error("missing_service_resource")
    return {
      ...mapping,
      action: previous
        ? ("rename" as const)
        : current
          ? ("unchanged" as const)
          : ("create" as const),
    }
  })
}

function preservedResourceFields(row: ResourcePortRow) {
  const { identifier, updated_at, policy_version, ...preserved } = row
  void identifier
  void updated_at
  void policy_version
  return preserved
}

// The caller owns BEGIN/COMMIT and production-database attestation.
// No consent/token snapshots, users, client secrets or redirect URIs are mutated.
export async function migrateServiceResourcePorts(
  client: ResourcePortConnection,
  seeds: OAuthResourceSeed[],
  apply: boolean
) {
  const identifiers = serviceResourcePortMappings.flatMap((entry) => [
    entry.oldIdentifier,
    entry.identifier,
  ])
  const rows = await client.query<ResourcePortRow>(
    "SELECT * FROM oauth_resource WHERE identifier = ANY($1::text[]) ORDER BY identifier FOR UPDATE",
    [identifiers]
  )
  const plan = planServiceResourcePorts(rows.rows)
  const constraints = await client.query<{ definition: string }>(
    "SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contype = 'f' AND conrelid = 'oauth_client_resource'::regclass AND confrelid = 'oauth_resource'::regclass"
  )
  if (
    constraints.rows.length !== 1 ||
    !constraints.rows[0]?.definition.includes("ON UPDATE CASCADE")
  )
    throw new Error("resource_link_cascade_required")
  const beforeLinks = await client.query<ResourcePortLink>(
    "SELECT * FROM oauth_client_resource WHERE resource_id = ANY($1::text[]) ORDER BY id FOR UPDATE",
    [identifiers]
  )
  if (!apply)
    return plan.map((entry) => ({
      ...entry,
      links: beforeLinks.rows.filter((link) =>
        [entry.oldIdentifier, entry.identifier].includes(link.resource_id)
      ).length,
    }))
  for (const entry of plan) {
    if (entry.action === "rename") {
      const result = await client.query(
        "UPDATE oauth_resource SET identifier = $1, updated_at = now(), policy_version = policy_version + 1 WHERE identifier = $2",
        [entry.identifier, entry.oldIdentifier]
      )
      if (result.rowCount !== 1) throw new Error("resource_rename_failed")
    } else if (entry.action === "create") {
      const seed = seeds.find(
        (resource) =>
          resource.identifier === entry.identifier &&
          resource.metadata.application === entry.application
      )
      if (!seed) throw new Error("missing_resource_seed")
      await client.query(
        "INSERT INTO oauth_resource (identifier, name, access_token_ttl, allowed_scopes, metadata) VALUES ($1, $2, $3, $4::text[], $5::jsonb)",
        [
          seed.identifier,
          seed.name,
          seed.accessTokenTtl,
          seed.allowedScopes,
          JSON.stringify(seed.metadata),
        ]
      )
    }
  }
  const after = await client.query<ResourcePortRow>(
    "SELECT * FROM oauth_resource WHERE identifier = ANY($1::text[]) ORDER BY identifier",
    [identifiers]
  )
  const afterLinks = await client.query<ResourcePortLink>(
    "SELECT * FROM oauth_client_resource WHERE resource_id = ANY($1::text[]) ORDER BY id",
    [identifiers]
  )
  const expectedLinks = beforeLinks.rows.map((link) => ({
    ...link,
    resource_id:
      plan.find((entry) => entry.oldIdentifier === link.resource_id)
        ?.identifier ?? link.resource_id,
  }))
  if (!isDeepStrictEqual(expectedLinks, afterLinks.rows))
    throw new Error("resource_links_changed")
  for (const entry of plan) {
    const row = after.rows.find(
      (resource) => resource.identifier === entry.identifier
    )
    if (
      !row ||
      after.rows.some((resource) => resource.identifier === entry.oldIdentifier)
    )
      throw new Error("resource_port_verification_failed")
    const previous = rows.rows.find(
      (resource) =>
        resource.identifier ===
        (entry.action === "rename" ? entry.oldIdentifier : entry.identifier)
    )
    if (
      previous &&
      !isDeepStrictEqual(
        preservedResourceFields(previous),
        preservedResourceFields(row)
      )
    )
      throw new Error("resource_policy_changed")
  }
  return plan.map((entry) => ({
    ...entry,
    links: afterLinks.rows.filter(
      (link) => link.resource_id === entry.identifier
    ).length,
  }))
}
