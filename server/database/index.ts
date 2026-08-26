import { Pool } from "@/lib/structure/cores/pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "@/database/schema"

import { databaseUrl, pgPoolMax } from "@/lib/utils/environment"

const connectionString = databaseUrl
const defaultPoolMax = 5
const poolMax = Number.parseInt(pgPoolMax ?? `${defaultPoolMax}`, 10)

if (!connectionString) {
  throw new Error(
    "Database URL is required (DATABASE_URL, VITE_DATABASE_URL, or VITE_PUBLIC_DATABASE_URL)"
  )
}

const globalForDatabase = globalThis as typeof globalThis & {
  pgPool?: InstanceType<typeof Pool>
}

const sharedPool =
  globalForDatabase.pgPool ??
  new Pool({
    connectionString,
    max: Number.isNaN(poolMax) ? defaultPoolMax : poolMax,
  })

if (!globalForDatabase.pgPool) {
  sharedPool.on("error", (error: unknown) => {
    console.error("[pg-pool-error]", error)
  })

  globalForDatabase.pgPool = sharedPool
}

export const pool = globalForDatabase.pgPool
export const database = drizzle(pool, { schema })

export interface DatabaseHandle {
  database: typeof database
}

export { schema }
export default database
