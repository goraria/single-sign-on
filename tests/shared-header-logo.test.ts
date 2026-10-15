import { readFileSync } from "node:fs"
import { expect, it } from "vitest"

it("uses the existing Gorth logo at size-9 in the shared header, not a text button", () => {
  const source = readFileSync(
    new URL("../app/(shared)/layout.tsx", import.meta.url),
    "utf8"
  )
  const header = source.slice(
    source.indexOf("<Header"),
    source.indexOf("<main")
  )
  expect(header).toContain('href="/"')
  expect(header).toContain('aria-label="Gorth home"')
  expect(header).toContain("src={gorthLogo}")
  expect(header).toContain("width={36}")
  expect(header).toContain("height={36}")
  expect(header).toContain('className="size-9 object-contain"')
  expect(header).not.toContain("<Button")
  expect(source).toContain('className="size-24 object-contain"')
})
