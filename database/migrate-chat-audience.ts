import { pool } from "@/database"
import { chatResourceUrl } from "@/database/seeds/oauth-resources"

// Explicit one-resource administrative migration, not a whole-registry seed.
// Preserve the Chat policy and FK-linked client grants; do not seed other apps.
const previousAudience = "http://localhost:5050"
const clientId = "gorth-interactive-messaging-portal"

async function migrateChatAudience() {
  const apply = process.argv.includes("--apply")
  const connection = await pool.connect()
  try {
    await connection.query(apply ? "BEGIN" : "BEGIN READ ONLY")
    const resources = await connection.query(
      `SELECT identifier, name, allowed_scopes, disabled, dpop_bound_access_tokens_required
       FROM oauth_resource WHERE identifier = ANY($1::text[])
       ${apply ? "FOR UPDATE" : ""}`,
      [[previousAudience, chatResourceUrl]]
    )
    const resourceRows: {
      identifier: string
      name: string
      allowed_scopes: string[] | null
      disabled: boolean
      dpop_bound_access_tokens_required: boolean
    }[] = resources.rows
    const oldExists = resourceRows.some(
      (row) => row.identifier === previousAudience
    )
    const newExists = resourceRows.some(
      (row) => row.identifier === chatResourceUrl
    )
    const links = await connection.query(
      `SELECT client_id, resource_id FROM oauth_client_resource
       WHERE resource_id = ANY($1::text[])`,
      [[previousAudience, chatResourceUrl]]
    )
    const linkRows: { client_id: string; resource_id: string }[] = links.rows
    console.info(
      JSON.stringify({
        stage: "preflight",
        oldExists,
        newExists,
        linkedClients: linkRows.length,
        onlyChatLinked: linkRows.every((row) => row.client_id === clientId),
        resources: resourceRows,
      })
    )
    if (
      (!oldExists && !newExists) ||
      linkRows.length !== 1 ||
      linkRows[0]?.client_id !== clientId
    ) {
      throw new Error("Chat resource state requires administrator review")
    }
    const target = resourceRows.find(
      (row) => row.identifier === chatResourceUrl
    )
    if (
      oldExists &&
      newExists &&
      (target?.name !== chatResourceUrl ||
        target.allowed_scopes !== null ||
        target.disabled ||
        target.dpop_bound_access_tokens_required)
    ) {
      throw new Error(
        "Existing target has a custom policy; administrator review required"
      )
    }
    if (apply && oldExists) {
      if (newExists) {
        // Better Auth already created an unconfigured 3030 placeholder. Copy
        // the exact existing Chat policy, move its single client link, then
        // remove only the obsolete 5050 resource. Never widen scopes.
        const copied = await connection.query(
          `UPDATE oauth_resource AS target SET
             name = source.name, access_token_ttl = source.access_token_ttl,
             refresh_token_ttl = source.refresh_token_ttl,
             signing_algorithm = source.signing_algorithm, signing_key_id = source.signing_key_id,
             allowed_scopes = source.allowed_scopes, custom_claims = source.custom_claims,
             dpop_bound_access_tokens_required = source.dpop_bound_access_tokens_required,
             disabled = source.disabled, metadata = source.metadata,
             policy_version = GREATEST(source.policy_version, target.policy_version) + 1,
             updated_at = NOW()
           FROM oauth_resource AS source
           WHERE source.identifier = $1 AND target.identifier = $2 AND target.allowed_scopes IS NULL`,
          [previousAudience, chatResourceUrl]
        )
        if (copied.rowCount !== 1)
          throw new Error("Chat policy transfer failed")
        await connection.query(
          `UPDATE oauth_client_resource SET resource_id = $1
           WHERE client_id = $2 AND resource_id = $3`,
          [chatResourceUrl, clientId, previousAudience]
        )
        const removed = await connection.query(
          "DELETE FROM oauth_resource WHERE identifier = $1",
          [previousAudience]
        )
        if (removed.rowCount !== 1)
          throw new Error("Obsolete Chat resource removal failed")
      } else {
        const result = await connection.query(
          `UPDATE oauth_resource SET identifier = $1, updated_at = NOW(),
           policy_version = policy_version + 1 WHERE identifier = $2`,
          [chatResourceUrl, previousAudience]
        )
        if (result.rowCount !== 1)
          throw new Error("Chat resource update failed")
      }
      // The resource_id FK has ON UPDATE CASCADE. Check it inside the transaction.
      const verified = await connection.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM oauth_client_resource
         WHERE client_id = $1 AND resource_id = $2`,
        [clientId, chatResourceUrl]
      )
      if (verified.rows[0]?.count !== 1)
        throw new Error("Chat resource link verification failed")
    }
    await connection.query(apply ? "COMMIT" : "ROLLBACK")
    console.info(
      JSON.stringify({
        mode: apply ? "apply" : "read-only",
        previousAudience,
        audience: chatResourceUrl,
        oldExists: apply ? false : oldExists,
        newExists: apply ? true : newExists,
        linkedClients: links.rows.length,
        changed: apply && oldExists,
      })
    )
  } catch (error) {
    await connection.query("ROLLBACK")
    throw error
  } finally {
    connection.release()
  }
}

try {
  await migrateChatAudience()
} catch (error) {
  // Do not log DB responses, connection strings, client credentials or tokens.
  console.error(
    "Chat audience migration failed; no other resource was changed."
  )
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null
  if (
    typeof code === "string" &&
    [
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNRESET",
      "28P01",
      "42P01",
      "42703",
      "23503",
      "23505",
      "25006",
    ].includes(code)
  ) {
    console.error("Database error code:", code)
  }
  process.exitCode = 1
} finally {
  await pool.end()
}
