import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))
vi.mock("@/services/client/auth", () => ({ getSession: state.getSession }))
vi.mock("next/navigation", () => ({ redirect: state.redirect }))
vi.mock("@/components/auth/oauth", () => ({
  ApplicationForm: () => null,
  ApplicationEditor: () => null,
  OAuthResourceForm: () => null,
  OAuthResourceEditor: () => null,
}))
vi.mock("@/features/admin/oauth/client", () => ({ Applications: () => null }))
vi.mock("@/features/admin/oauth/resource", () => ({
  OAuthResources: () => null,
}))
vi.mock("@/features/admin/oauth/consent", () => ({ OAuthConsents: () => null }))

import ClientsPage from "@/app/(dashboard)/admin/oauth/client/page"
import CreateClientPage from "@/app/(dashboard)/admin/oauth/client/create/page"
import EditClientPage from "@/app/(dashboard)/admin/oauth/client/edit/[id]/page"
import ResourcesPage from "@/app/(dashboard)/admin/oauth/resource/page"
import CreateResourcePage from "@/app/(dashboard)/admin/oauth/resource/create/page"
import EditResourcePage from "@/app/(dashboard)/admin/oauth/resource/edit/[id]/page"
import ConsentPage from "@/app/(dashboard)/admin/oauth/consent/page"

const id = "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed"
const pages = [
  ["consent", () => ConsentPage()],
  ["client", () => ClientsPage()],
  ["client/create", () => CreateClientPage()],
  ["client/edit", () => EditClientPage({ params: Promise.resolve({ id }) })],
  ["resource", () => ResourcesPage()],
  ["resource/create", () => CreateResourcePage()],
  [
    "resource/edit",
    () => EditResourcePage({ params: Promise.resolve({ id }) }),
  ],
] as const
beforeEach(() => {
  state.getSession.mockReset()
  state.redirect.mockClear()
})

for (const [path, page] of pages) {
  describe(`/admin/oauth/${path}`, () => {
    it("redirects guests before rendering", async () => {
      state.getSession.mockResolvedValue(null)
      await expect(page()).rejects.toThrow("redirect:/")
    })
    it.each(["user", "vice"])("denies the %s role", async (role) => {
      state.getSession.mockResolvedValue({ user: { role } })
      await expect(page()).rejects.toThrow("redirect:/settings")
    })
    it.each(["admin", "master"])("allows the %s role", async (role) => {
      state.getSession.mockResolvedValue({ user: { role } })
      expect((await page()).type).toBeTypeOf("function")
      expect(state.redirect).not.toHaveBeenCalled()
    })
  })
}
it("awaits the edit route UUID and passes it to the editor", async () => {
  state.getSession.mockResolvedValue({ user: { role: "admin" } })
  expect(
    (await EditClientPage({ params: Promise.resolve({ id }) })).props.id
  ).toBe(id)
  expect(
    (await EditResourcePage({ params: Promise.resolve({ id }) })).props.id
  ).toBe(id)
})
