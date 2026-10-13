import { existsSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { fileURLToPath } from "node:url"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { adminServices, adminSidebar, settingsSidebar } from "@/utils/constant"
import { canAccessDashboard, getDashboardPath } from "@/utils/dashboard"
import { NavDropdownItem } from "@gorth/primitive/dashboard/nav-user"
import { DropdownMenu } from "@gorth/primitive/custom/dropdown"
import { LayoutDashboard } from "@gorth/primitive/cores/lucide"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))
vi.mock("@/services/client/auth", () => ({ getSession: mocks.getSession }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/layouts/dashboard-shell", () => ({ DashboardShell: () => null }))

import DashboardPage from "@/app/(dashboard)/dashboard/page"
import { RoleDashboardLayout } from "@/layouts/role-dashboard"

beforeEach(() => {
  mocks.getSession.mockReset()
  mocks.redirect.mockClear()
})

describe("server dashboard routing", () => {
  it.each([
    ["user", "/user"],
    ["vice", "/vice"],
    ["admin", "/admin"],
    ["master", "/admin"],
  ])("redirects %s to its static dashboard", async (role, path) => {
    mocks.getSession.mockResolvedValue({ user: { role } })
    await expect(DashboardPage()).rejects.toThrow(`redirect:${path}`)
    expect(mocks.redirect).toHaveBeenCalledWith(path)
    expect(getDashboardPath(role)).toBe(path)
  })
  it("requires an authenticated session", async () => {
    mocks.getSession.mockResolvedValue(null)
    await expect(DashboardPage()).rejects.toThrow(
      "redirect:/auth/sign-in?redirect=%2Fdashboard"
    )
  })
  it("never turns an unknown role into an arbitrary redirect or elevated access", () => {
    expect(getDashboardPath("//attacker.example")).toBe("/settings")
    expect(canAccessDashboard("unknown", "admin")).toBe(false)
  })
  for (const role of ["user", "vice", "admin", "master"]) {
    for (const target of ["user", "vice", "admin"] as const) {
      it(`${role} → ${target} uses the verified session and only master bypasses the role match`, async () => {
        mocks.getSession.mockResolvedValue({ user: { role } })
        const allowed = role === "master" || role === target
        expect(canAccessDashboard(role, target)).toBe(allowed)
        const result = RoleDashboardLayout({ role: target, children: null })
        if (allowed) expect((await result).props.section).toBe(target)
        else
          await expect(result).rejects.toThrow(
            `redirect:${getDashboardPath(role)}`
          )
      })
    }
  }
})

it("places dashboards only under admin and creates all seven static service pages", () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  expect(adminServices).toHaveLength(7)
  const services = adminSidebar.navMain.find(
    (item) => item.title === "Services"
  )
  expect(services && "items" in services ? services.items : []).toHaveLength(7)
  for (const service of adminServices) {
    expect(
      existsSync(
        `${root}app/(dashboard)/admin/services/${service.slug}/page.tsx`
      )
    ).toBe(true)
  }
  expect(existsSync(`${root}app/(dashboard)/setting/page.tsx`)).toBe(false)
  expect(existsSync(`${root}app/(dashboard)/master/page.tsx`)).toBe(false)
  for (const path of [
    "crm",
    "finance",
    "analytics",
    "productivity",
    "ecommerce",
    "academy",
    "logistics",
    "infrastructure",
    "file-manager",
    "patient-monitoring",
  ]) {
    expect(existsSync(`${root}app/(dashboard)/admin/${path}/page.tsx`)).toBe(
      true
    )
    expect(
      settingsSidebar.navMain.some((item) => item.url === `/settings/${path}`)
    ).toBe(false)
  }
})

it("makes the whole Dashboard dropdown row a single link", () => {
  const html = renderToStaticMarkup(
    createElement(
      DropdownMenu,
      { open: true },
      createElement(NavDropdownItem, {
        title: "Dashboard",
        link: "/dashboard",
        icon: LayoutDashboard,
      })
    )
  )
  expect(html).toMatch(
    /<a[^>]+data-slot="dropdown-menu-item"[^>]+href="\/dashboard"/
  )
  expect(html.match(/<a\b/g)).toHaveLength(1)
  expect(html).toContain("Dashboard")
})
