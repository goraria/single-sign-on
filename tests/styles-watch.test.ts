import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"
import { expect, it } from "vitest"

it("generates app and Primitive styles without watching Next.js build output", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const from = path.join(root, "styles/globals.css")
  const result = await postcss([tailwindcss()]).process(
    await readFile(from, "utf8"),
    { from }
  )
  const directories = result.messages
    .filter((message) => message.type === "dir-dependency")
    .map((message) => String(message.dir))
  const files = result.messages
    .filter((message) => message.type === "dependency")
    .map((message) => String(message.file))

  // A recursive root glob also watches .next/dev/types and restarts HMR
  // whenever Next generates route types on a cold auth-page compilation.
  expect(directories).not.toContain(path.resolve(root))
  for (const entry of [...directories, ...files]) {
    expect(entry.startsWith(path.join(root, ".next"))).toBe(false)
    expect(entry.startsWith(path.join(root, "tests"))).toBe(false)
  }
  for (const directory of ["app", "components", "layouts", "lib"]) {
    expect(directories).toContain(path.join(root, directory))
  }
  expect(
    directories.some((entry) =>
      entry.includes("@gorth/primitive/src/components")
    )
  ).toBe(true)
  for (const utility of [".h-14", ".size-9", ".gap-2", ".rounded-lg"]) {
    expect(result.css).toContain(utility)
  }
})
