import { readFileSync } from "node:fs"
import { Suspense } from "react"
import { expect, it, vi } from "vitest"
import { defaultAuthRedirect } from "@/utils/constant"
import { resolveInternalPath } from "@/utils/client/formatter"
vi.mock("@/features/role-dashboard/redirect", () => ({
  DashboardRedirect: () => null,
}))
import Page from "@/app/(dashboard)/dashboard/page"
import Loading from "@/app/(dashboard)/dashboard/loading"
import { LoadingScreen } from "@/features/shared/loading"

it("shows the infinite spinner while dashboard session routing is pending", () => {
  const page = Page()
  expect(page.props.children[0].type).toBe(LoadingScreen)
  expect(page.props.children[1].type).toBe(Suspense)
  expect(page.props.children[1].props.fallback).toBeNull()
  expect(Loading().type).toBe(LoadingScreen)
  expect(LoadingScreen({}).props.children[0].props.variant).toBe("infinite")
})
it("defaults authentication to dashboard while preserving safe explicit redirects", () => {
  expect(defaultAuthRedirect).toBe("/dashboard")
  expect(resolveInternalPath(null, defaultAuthRedirect)).toBe("/dashboard")
  expect(resolveInternalPath("", defaultAuthRedirect)).toBe("/dashboard")
  expect(resolveInternalPath("/settings/security", defaultAuthRedirect)).toBe(
    "/settings/security"
  )
  expect(resolveInternalPath("//external.example", defaultAuthRedirect)).toBe(
    "/dashboard"
  )
  for (const file of [
    "sign-in-form",
    "social-form",
    "sign-up-form",
    "one-time-password-form",
    "browser-accounts",
  ]) {
    const source = readFileSync(
      new URL(`../components/auth/${file}.tsx`, import.meta.url),
      "utf8"
    )
    expect(source).toContain("defaultAuthRedirect")
  }
})
