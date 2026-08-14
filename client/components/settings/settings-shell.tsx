"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Monitor,
  Palette,
  UserCog,
  Wrench,
} from "@gorth/primitive/cores/lucide";
import { Separator } from "@gorth/primitive/default/separator";
import { cn } from "@/lib/utils";

const settingItems = [
  { title: "Profile", href: "/settings/profile", icon: UserCog },
  { title: "Account", href: "/settings/account", icon: Wrench },
  { title: "Appearance", href: "/settings/appearance", icon: Palette },
  { title: "Notifications", href: "/settings/notifications", icon: Bell },
  { title: "Display", href: "/settings/display", icon: Monitor },
];

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-4 lg:my-6" />
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:gap-12">
        <aside className="lg:w-1/5">
          <select
            aria-label="Settings section"
            value={pathname}
            onChange={(event) => router.push(event.target.value)}
            className="border-input bg-background h-12 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2 md:hidden"
          >
            {settingItems.map((item) => (
              <option key={item.href} value={item.href}>
                {item.title}
              </option>
            ))}
          </select>
          <nav className="hidden space-y-1 md:block">
            {settingItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium",
                    pathname === item.href && "bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 p-1">{children}</div>
      </div>
    </div>
  );
}
