// Operator bootstrap: native OAuth registration/secret issuance happens later through the
// existing master-guarded credential UI. This script creates DISABLED drafts only.
import { loadEnvConfig } from "@next/env";
import { Pool } from "@gorth-io/structure/cores/pg";
import { planMachineClients } from "../utils/machine-client-plan.ts";
loadEnvConfig(process.cwd(), true);
const { databaseUrl, betterAuthUrl } = await import("../utils/environment.ts");
if (!databaseUrl || !betterAuthUrl) throw new Error("oauth_bootstrap_not_configured");
const apply = process.argv.includes("--apply");
if (process.argv.includes("--dry-run") && apply) throw new Error("conflicting_bootstrap_mode");
const pool = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 15000, statement_timeout: 30000 });
const connection = await pool.connect();
try {
  await connection.query(apply
    ? "BEGIN ISOLATION LEVEL SERIALIZABLE"
    : "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  if (apply) await connection.query("SELECT pg_advisory_xact_lock(1936946031)");
  const clients = await connection.query('SELECT client_id AS "clientId",uri,disabled,reference_id AS "referenceId",scopes,metadata FROM oauth_client');
  const resources = await connection.query("SELECT identifier,disabled,metadata FROM oauth_resource");
  const plan = planMachineClients(clients.rows, resources.rows, betterAuthUrl);
  const existing = new Set(clients.rows.map((row) => row.clientId));
  const existingRoles = new Set(clients.rows.flatMap((row) => {
    const metadata = row.metadata;
    return row.referenceId === "sso-administration" &&
      metadata && typeof metadata.registryRole === "string" ? [metadata.registryRole] : [];
  }));
  const additions = plan.drafts.filter((draft) => !existing.has(draft.clientId) && !existingRoles.has(draft.clientId));
  const scopes = [...new Set(additions.flatMap((draft) => draft.links.flatMap((link) => link.scopes)))].sort();
  const revisions = await connection.query("SELECT revision,scopes FROM oauth_scope_revision ORDER BY revision DESC LIMIT 1" + (apply ? " FOR UPDATE" : ""));
  if (!revisions.rows.length) throw new Error("oauth_scope_registry_required");
  const previous = revisions.rows[0];
  const nextScopes = [...new Set([...previous.scopes, ...scopes])].sort();
  const revision = scopes.some((scope) => !previous.scopes.includes(scope)) ? previous.revision + 1 : previous.revision;
  if (apply) {
    if (revision !== previous.revision) await connection.query(
      "INSERT INTO oauth_scope_revision(revision,scopes) VALUES($1,$2)", [revision,nextScopes]);
    for (const draft of additions) {
      const ceiling = [...new Set(draft.links.flatMap((link) => link.scopes))].sort();
      await connection.query(
        'INSERT INTO oauth_client(client_id,name,reference_id,disabled,public,require_pkce,token_endpoint_auth_method,grant_types,response_types,redirect_uris,scopes,client_credentials_scopes,metadata) VALUES($1,$2,$3,true,false,false,$4,$5,$6,$7,$8,$8,$9::jsonb)',
        [draft.clientId,draft.name,"sso-administration","client_secret_basic",["client_credentials"],[],[],ceiling,
          JSON.stringify({environment:draft.environment,purpose:draft.purpose,registryDraft:true,registryRole:draft.clientId})]);
      for (const link of draft.links) {
        const current = await connection.query("SELECT disabled,access_token_ttl,allowed_scopes FROM oauth_resource WHERE identifier=$1 FOR UPDATE",[link.identifier]);
        if (current.rows.length) {
          const row=current.rows[0];
          if (row.disabled || (link.ttl===120 && (!row.access_token_ttl || row.access_token_ttl>120)))
            throw new Error("existing_resource_policy_requires_review");
          if (row.allowed_scopes && link.scopes.some((scope) => !row.allowed_scopes.includes(scope))) {
            await connection.query("UPDATE oauth_resource SET allowed_scopes=$2,policy_version=policy_version+1,updated_at=now() WHERE identifier=$1",
              [link.identifier,[...new Set([...row.allowed_scopes,...link.scopes])].sort()]);
          }
        } else await connection.query(
          "INSERT INTO oauth_resource(identifier,name,access_token_ttl,allowed_scopes,metadata) VALUES($1,$2,$3,$4,$5::jsonb)",
          [link.identifier,link.scopes[0]?.startsWith("storage:") ? "Storage credential endpoint" : "Commerce notification recipients",link.ttl,link.scopes,JSON.stringify({application:link.scopes[0]?.startsWith("storage:") ? "storage" : "commerce-notification-recipient",managedBy:"oauth-machine-bootstrap"})]);
        await connection.query("INSERT INTO oauth_client_resource(client_id,resource_id) VALUES($1,$2) ON CONFLICT(client_id,resource_id) DO NOTHING",[draft.clientId,link.identifier]);
      }
      await connection.query("INSERT INTO audit_log(actor_user_id,action,outcome,resource_type,resource_id,metadata) VALUES(NULL,$1,'success','oauth-client',$2,$3::jsonb)",
        ["oauth-client.draft.bootstrap",draft.clientId,JSON.stringify({actorType:"database-operator",environment:draft.environment,disabled:true})]);
    }
  }
  await connection.query(apply?"COMMIT":"ROLLBACK");
  console.log(JSON.stringify({applied:apply,revision,clients:additions.map((draft)=>({clientId:draft.clientId,disabled:true,resources:draft.links})),blocked:plan.blocked,
    next:"Activate the published scope revision on SSO restart, provision each draft through the native credential UI, configure its caller securely, then explicitly enable it."}));
} catch(error) {
  await connection.query("ROLLBACK");
  console.error(JSON.stringify({error:/^[a-z_]+$/.test(error?.message??"")?error.message:"oauth_bootstrap_failed"}));
  process.exitCode=1;
} finally { connection.release(); await pool.end(); }
