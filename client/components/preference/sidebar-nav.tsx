"use client"

import type { ComponentType, SVGProps } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@gorth/primitive/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/default/select"
import { ScrollArea } from "@gorth/primitive/default/scroll-area"

export interface PreferenceNavItem {
  title: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export function SidebarNav({ items }: { items: PreferenceNavItem[] }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      <div className="p-1 md:hidden">
        <Select
          value={pathname}
          onValueChange={(value) => {
            if (value) router.push(value)
          }}
        >
          <SelectTrigger className="h-12 sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <span className="flex gap-x-4 px-2 py-1">
                  <item.icon className="size-4" />
                  <span className="text-base">{item.title}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="bg-background hidden w-full min-w-40 px-1 py-2 md:block">
        <nav className="flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:bg-accent flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-muted hover:bg-accent"
                  : "hover:underline"
              )}
            >
              <item.icon className="me-2 size-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}
