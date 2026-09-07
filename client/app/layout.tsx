// "use client"

import { Geist_Mono, Inter } from "next/font/google"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import "@/styles/globals.css"
import { ApplicationProvider } from "@gorth/primitive/providers/application"
import type {
  Collapsible,
  LayoutWidth,
  LayoutVariant,
  NavbarBehavior,
} from "@gorth/primitive/providers/layout"
import type { Direction } from "@gorth/primitive/providers/direction"
import { AuthProvider } from "@/providers/auth"
import { cn } from "@gorth/primitive/lib/utils"
import { appGlobal } from "@/lib/utils/constant"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Single Sign On | Gorth",
    template: "%s | Single Sign On | Gorth",
  },
  description: appGlobal.description,
  icons: {
    icon: "/assets/icon.ico",
  },
}

const layoutVariants = new Set<LayoutVariant>([
  "sidebar",
  "floating",
  "inset",
])
const layoutCollapsibles = new Set<Collapsible>([
  "offcanvas",
  "icon",
  "none",
])
const layoutWidths = new Set<LayoutWidth>(["centered", "full-width"])
const navbarBehaviors = new Set<NavbarBehavior>(["sticky", "scroll"])
const directions = new Set<Direction>(["ltr", "rtl"])
const themes = new Set(["light", "dark", "system"] as const)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const variantCookie = cookieStore.get("layout_variant")?.value
  const collapsibleCookie = cookieStore.get("layout_collapsible")?.value
  const widthCookie = cookieStore.get("layout_width")?.value
  const navbarBehaviorCookie = cookieStore.get("navbar_behavior")?.value
  const directionCookie = cookieStore.get("dir")?.value
  const themeCookie = cookieStore.get("color-theme")?.value
  const initialVariant = layoutVariants.has(variantCookie as LayoutVariant)
    ? (variantCookie as LayoutVariant)
    : "sidebar"
  const initialCollapsible = layoutCollapsibles.has(
    collapsibleCookie as Collapsible
  )
    ? (collapsibleCookie as Collapsible)
    : "icon"
  const initialWidth = layoutWidths.has(widthCookie as LayoutWidth)
    ? (widthCookie as LayoutWidth)
    : "centered"
  const initialNavbarBehavior = navbarBehaviors.has(
    navbarBehaviorCookie as NavbarBehavior
  )
    ? (navbarBehaviorCookie as NavbarBehavior)
    : "sticky"
  const initialDirection = directions.has(directionCookie as Direction)
    ? (directionCookie as Direction)
    : "ltr"
  const initialTheme = themes.has(
    themeCookie as "light" | "dark" | "system"
  )
    ? (themeCookie as "light" | "dark" | "system")
    : "system"
  const htmlCustomizerAttributes = {
    "color-base": cookieStore.get("color-base")?.value ?? "neutral",
    "color-paint": cookieStore.get("color-paint")?.value ?? "primary",
    "color-chart": cookieStore.get("color-chart")?.value ?? "neutral",
    wide: initialWidth === "full-width" ? "wide" : "contained",
  }

  return (
    <html
      lang="en"
      dir={initialDirection}
      {...htmlCustomizerAttributes}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        initialTheme === "system" ? undefined : initialTheme
      )}
    >
      <body>
        <ApplicationProvider
          initialVariant={initialVariant}
          initialCollapsible={initialCollapsible}
          initialDirection={initialDirection}
          initialWidth={initialWidth}
          initialNavbarBehavior={initialNavbarBehavior}
          {...{ initialTheme }}
        >
          <AuthProvider>{children}</AuthProvider>
        </ApplicationProvider>
      </body>
    </html>
  )
}
