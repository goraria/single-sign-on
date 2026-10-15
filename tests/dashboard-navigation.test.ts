import { expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  replace: vi.fn(),
  effects: [] as (() => void)[],
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace }),
}))
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => state.effects.push(effect),
}))
import { DashboardNavigation } from "@/features/role-dashboard/navigation"

it("starts a replace navigation after mount without clearing the page's persistent spinner", () => {
  expect(DashboardNavigation({ href: "/admin" })).toBeNull()
  expect(state.replace).not.toHaveBeenCalled()
  state.effects[0]()
  expect(state.replace).toHaveBeenCalledWith("/admin")
})
