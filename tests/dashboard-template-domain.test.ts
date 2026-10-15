import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { expect, it } from "vitest"
import { infrastructureGroups } from "@/features/admin-dashboards/infrastructure/_components/infrastructure-data"

it("uses the SSO domain instead of the old template domain", () => {
  const domains = infrastructureGroups.flatMap((group) =>
    group.rows.map((row) => row.domain)
  )
  expect(domains).toHaveLength(4)
  for (const domain of domains) {
    expect(new URL(`https://${domain}`).hostname).toBe("gorth-auth.vercel.app")
  }
})

it("does not retain template deployment URLs in dashboard source", () => {
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) inspect(path)
      else if (/\.(ts|tsx|json)$/.test(entry.name)) {
        expect(readFileSync(path, "utf8"), path).not.toContain(
          "next-shadcn-admin-dashboard.vercel.app"
        )
      }
    }
  }
  inspect(
    fileURLToPath(new URL("../features/admin-dashboards", import.meta.url))
  )
})
