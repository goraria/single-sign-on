import { Children, createElement, isValidElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@gorth/primitive/custom/dropdown"
import { AccountSwitcherItems } from "@gorth/primitive/dashboard/account-switcher"
import type { BrowserAccount } from "@/schemas/browser-account"
import { SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { NavAccount } from "@gorth/primitive/dashboard/nav-user"

vi.mock("@/services/client/browser-account", () => ({
  listBrowserAccounts: vi.fn(),
  changeBrowserAccount: vi.fn(),
}))

const accounts: BrowserAccount[] = [
  {
    sessionId: "first",
    user: { id: "one", name: "First account", email: "first@example.test" },
    active: true,
  },
  {
    sessionId: "second",
    user: { id: "two", name: "Second account", email: "second@example.test" },
    active: false,
  },
]

function props(
  overrides: Partial<Parameters<typeof AccountSwitcherItems>[0]> = {}
) {
  return {
    accounts,
    loading: false,
    pendingSessionId: null,
    error: null,
    onSelect: vi.fn(),
    onRetry: vi.fn(),
    addAccountHref: "/auth/add-account?redirect=%2Fsettings",
    ...overrides,
  }
}

function render(
  overrides: Partial<Parameters<typeof AccountSwitcherItems>[0]> = {}
) {
  return renderToStaticMarkup(
    createElement(
      SidebarProvider,
      null,
      createElement(
        DropdownMenu,
        { open: true },
        createElement(AccountSwitcherItems, props(overrides))
      )
    )
  )
}

it("keeps NavUser triggers unchanged and fetches accounts only when the switch view opens", async () => {
  const { NavUser } = await import("@/components/dashboard/nav-user")
  const { listBrowserAccounts } =
    await import("@/services/client/browser-account")
  const auth = {
    authenticated: true,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }
  const user = {
    name: "First account",
    email: "first@example.test",
    avatar: "",
  }
  for (const type of ["sidebar", "navbar"] as const) {
    const html = renderToStaticMarkup(
      createElement(
        SidebarProvider,
        null,
        createElement(NavUser, {
          type,
          size: "lg",
          user,
          auth,
          nav: { main: [], secondary: [] },
        })
      )
    )
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-label="Account menu for First account"')
    if (type === "sidebar") {
      expect(html).toContain("First account")
      expect(html).toContain("h-14")
    }
    expect(html).not.toContain("Accounts on this browser")
  }
  expect(listBrowserAccounts).not.toHaveBeenCalled()
})

it("lists every signed-in account, marks the active one and ends with add-account", () => {
  const html = render()
  expect(html).toContain("First account")
  expect(html).toContain("first@example.test")
  expect(html).toContain("Second account")
  expect(html).toContain("second@example.test")
  expect(html).toContain('aria-label="Active account"')
  expect(html).toContain('href="/auth/add-account?redirect=%2Fsettings"')
  const items = html.match(/<[^>]+data-slot="dropdown-menu-item"[^>]*>/g)
  expect(items).toHaveLength(3)
  expect(
    items
      ?.slice(0, 2)
      .every((item) => item.includes("h-14") && item.includes("w-full"))
  ).toBe(true)
  expect(items?.at(-1)).toContain("h-9")
  expect(
    html.slice(html.lastIndexOf('data-slot="dropdown-menu-item"'))
  ).toContain("Add account")
})

it("uses exactly the dashboard NavUser button, avatar and name styling for account rows", () => {
  const user = {
    name: accounts[0].user.name,
    email: accounts[0].user.email,
    avatar: "",
  }
  const reference = renderToStaticMarkup(
    createElement(SidebarProvider, null, createElement(NavAccount, { user }))
  )
  const html = render()
  expect(reference).toContain("h-14")
  expect(html).toContain('class="flex min-w-0 items-center gap-2 flex-1"')
  expect(html).toContain(
    'class="grid min-w-0 flex-1 text-left text-sm leading-tight"'
  )
  expect(html).toContain('class="block min-w-0 truncate font-medium"')
  expect(html).toContain('class="block min-w-0 truncate text-xs"')
  expect(html.match(/data-slot="avatar"[^>]*class="[^"]*size-9/g)).toHaveLength(
    2
  )
})

it("renders loading, empty and retry states without inventing account entries", () => {
  expect(render({ accounts: [], loading: true })).toContain(
    "Loading accounts..."
  )
  expect(render({ accounts: [] })).toContain(
    "No accounts signed in on this browser."
  )
  const html = render({ accounts: [], error: "Unable to load accounts." })
  expect(html).toContain('role="alert"')
  expect(html).toContain("Try again")
  expect(html.lastIndexOf("Add account")).toBeGreaterThan(
    html.lastIndexOf("Try again")
  )
})

it("disables actions during a switch and respects the native five-account limit", () => {
  const pending = render({ pendingSessionId: "second" })
  expect(pending).toContain('aria-label="Switching account"')
  expect(pending.match(/aria-disabled="true"/g)).toHaveLength(3)
  const html = render({
    accounts: Array.from({ length: 5 }, (_, index) => ({
      ...accounts[1],
      sessionId: String(index),
    })),
  })
  expect(html).toContain("Sign out of an account before adding another.")
  expect(html.match(/aria-disabled="true"/g)).toHaveLength(1)
})

it("passes the chosen public account to the switch handler and keeps the menu open", () => {
  const viewProps = props()
  const items: { onClick?: () => void; closeOnClick?: boolean }[] = []
  function visit(node: ReactNode) {
    Children.forEach(node, (child) => {
      if (
        !isValidElement<{
          children?: ReactNode
          onClick?: () => void
          closeOnClick?: boolean
        }>(child)
      )
        return
      if (child.type === DropdownMenuItem) items.push(child.props)
      visit(child.props.children)
    })
  }
  visit(AccountSwitcherItems(viewProps))
  items[1].onClick?.()
  expect(viewProps.onSelect).toHaveBeenCalledExactlyOnceWith(accounts[1])
  expect(items[1].closeOnClick).toBe(false)
})
