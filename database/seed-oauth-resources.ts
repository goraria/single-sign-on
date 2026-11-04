import { pool } from "@/database"
import { bootstrapOAuthResources } from "@/database/bootstrap-oauth-resources"
import { oauthResourceSeeds } from "@/database/seeds/oauth-resources"

async function seedOAuthResources() {
  if (!process.argv.includes("--local"))
    throw new Error(
      "Local bootstrap requires --local; manage production resources through the dashboard"
    )
  await bootstrapOAuthResources(oauthResourceSeeds)
  console.info(
    "OAuth resource bootstrap completed; existing policies and links preserved"
  )
}

seedOAuthResources()
  .catch((error: unknown) => {
    console.error(
      "[oauth-resource-seed-error]",
      error instanceof Error ? error.message : "Unknown database error"
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
