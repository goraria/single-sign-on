"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@gorth/primitive/custom/sidebar";
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar";
import { SettingsShell } from "@/components/settings/settings-shell";
import { Dashbar } from "@/layouts/dashbar";
import { auth } from "@/lib/auth";
import { settingSidebar } from "@/lib/utils/constant";

const preferencePaths = new Set([
  "/settings/profile",
  "/settings/account",
  "/settings/appearance",
  "/settings/notifications",
  "/settings/display",
]);

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authControls = {
    loading: false,
    authenticated: true,
    login: (returnTo?: string) => {
      router.push(
        `/auth/sign-in${returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : ""}`,
      );
    },
    register: (returnTo?: string) => {
      router.push(
        `/auth/sign-up${returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : ""}`,
      );
    },
    logout: async (returnTo?: string) => {
      await auth.signOut();
      router.push(returnTo ?? "/auth/sign-in");
    },
  };

  return (
    <SidebarProvider>
      <AppSidebar data={settingSidebar} auth={authControls} />
      <SidebarInset>
        <Dashbar />
        <main className="flex flex-1 flex-col">
          <div className="container mx-auto flex flex-1 flex-col p-6">
            {preferencePaths.has(pathname) ? (
              <SettingsShell>{children}</SettingsShell>
            ) : (
              children
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
