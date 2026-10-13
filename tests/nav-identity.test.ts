import { Children, createElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { TooltipContent } from "@gorth/primitive/custom/tooltip"
import {
  NavIdentity,
  NavProfile,
  NavName,
  type NavIdentityProps,
} from "@gorth/primitive/dashboard/nav-user"

const user = { name: "A very long account name", email: "account@example.test" }

it("renders a large rounded profile avatar with consumer className", () => {
  const html = renderToStaticMarkup(createElement(NavProfile, { user, className: "shrink-0" }))
  expect(html).toContain("size-24")
  expect(html).toContain("rounded-2xl")
  expect(html).toContain("text-2xl")
  expect(html).toContain("shrink-0")
})

function render(props: Partial<NavIdentityProps> = {}) {
  return renderToStaticMarkup(createElement(NavIdentity, { user, ...props }))
}

function destinations(html: string) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
}

it("renders a raw, fixed-size identity without navigation", () => {
  const html = render()
  expect(html).toContain(user.name)
  expect(html).toContain(user.email)
  expect(html).toContain("size-9")
  expect(html).toContain("cursor-default")
  expect(html).toContain("truncate font-medium")
  expect(html).not.toContain('data-slot="tooltip-trigger"')
  expect(destinations(html)).toEqual([])
})

it("shares url between avatar, description and name by default", () => {
  expect(destinations(render({ url: "/profile/account" }))).toEqual([
    "/profile/account",
    "/profile/account",
    "/profile/account",
  ])
  expect(render({ url: "/profile/account" })).toContain("cursor-pointer")
})

it("uses href only for name, keeping avatar and description on url", () => {
  expect(
    destinations(render({ url: "/channel/account", href: "/watch?id=video" }))
  ).toEqual(["/channel/account", "/watch?id=video", "/channel/account"])
})

it("renders tooltip triggers as the name element without invalid DOM props or nested buttons", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {})
  try {
    const html = render({ tooltip: true, url: "/profile/account" })
    expect(html).toContain('data-slot="tooltip-trigger"')
    expect(html).not.toContain("<button")
    expect(destinations(html)).toEqual([
      "/profile/account",
      "/profile/account",
      "/profile/account",
    ])
    expect(error).not.toHaveBeenCalled()
  } finally {
    error.mockRestore()
  }
})

it("supports name-only and avatar-only modes without a second identity implementation", () => {
  const textOnly = render({ showAvatar: false })
  expect(textOnly).not.toContain('data-slot="avatar"')
  expect(textOnly).toContain(user.name)
  const avatarOnly = render({ showName: false, url: "/profile/account" })
  expect(avatarOnly).toContain('data-slot="avatar"')
  expect(avatarOnly).not.toContain(user.email)
  expect(destinations(avatarOnly)).toEqual(["/profile/account"])
})

it("does not nest links when the consumer owns navigation", () => {
  const html = renderToStaticMarkup(
    createElement(
      "a",
      { href: "/chat/conversation" },
      createElement(NavIdentity, { user })
    )
  )
  expect(destinations(html)).toEqual(["/chat/conversation"])
})

it("can hide description and preserve trailing domain actions", () => {
  const html = render({
    description: null,
    trailing: createElement("button", { type: "button" }, "Follow"),
  })
  expect(html).not.toContain(user.email)
  expect(html).toContain("Follow")
})

it("keeps the full name in a 240px multiline tooltip below and left-aligned", () => {
  const view = NavName({ user, tooltip: true })
  const root = Children.toArray(view.props.children)[0] as ReactElement<{
    children: ReactElement[]
  }>
  const content = Children.toArray(root.props.children)[1] as ReactElement<{
    side: string
    align: string
    className: string
    arrowAlign: string
    variant: string
    children: string
  }>
  expect(content.props.side).toBe("bottom")
  expect(content.props.align).toBe("start")
  expect(content.props.arrowAlign).toBe("start")
  expect(content.props.variant).toBe("popover")
  expect(content.props.className).toContain("w-60 min-w-60 max-w-60")
  expect(content.props.className).toContain("whitespace-normal")
  expect(content.props.children).toBe(user.name)
})

it("uses theme surface colors for both identity tooltip and arrow", () => {
  const portal = TooltipContent({ children: "Name", variant: "popover" })
  const positioner = portal.props.children as ReactElement<{
    children: ReactElement<{ className: string; children: ReactElement[] }>
  }>
  const popup = positioner.props.children
  const arrow = Children.toArray(popup.props.children).at(-1) as ReactElement<{
    className: string
  }>
  expect(popup.props.className).toContain("bg-popover")
  expect(popup.props.className).toContain("text-popover-foreground")
  expect(popup.props.className).not.toContain("bg-foreground")
  expect(arrow.props.className).toContain("bg-popover")
  expect(arrow.props.className).toContain("fill-popover")
  expect(arrow.props.className).not.toContain("fill-foreground")
})

it("pins the identity arrow at the start without changing default tooltip arrows", () => {
  function arrowClass(arrowAlign?: "anchor" | "start") {
    const portal = TooltipContent({
      children: "Name",
      side: "bottom",
      arrowAlign,
    })
    const positioner = portal.props.children as ReactElement<{
      children: ReactElement<{ children: ReactElement[] }>
    }>
    const popup = positioner.props.children
    const arrow = Children.toArray(popup.props.children).at(
      -1
    ) as ReactElement<{ className: string }>
    return arrow.props.className
  }
  expect(arrowClass("start")).toContain("data-[side=bottom]:left-3!")
  expect(arrowClass("start")).toContain("data-[side=top]:left-3!")
  expect(arrowClass()).not.toContain("left-3!")
})
