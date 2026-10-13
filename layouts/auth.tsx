import { Suspense, type ReactNode } from "react"
import Link from "next/link"
import { OAuthTimeout } from "@/components/auth/oauth-timeout"
import { AuthIllustration } from "@/components/auth/illustration"

import { IconDefault } from "@/assets/icon/brand/icon-default"
import {
  Card,
  CardContent,
  // CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { cn } from "@gorth/primitive/cores/cn"

export interface AuthLayoutProps {
  children: ReactNode
  className?: string
  description?: ReactNode
  footer?: ReactNode
  title: ReactNode
}

export function AuthLayout({
  children,
  className,
  // description,
  footer,
  title,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh w-full items-center p-4 sm:p-6">
      <div className="container mx-auto">
        <Card className="grid h-[calc(100vh-2*--spacing(4))] w-full grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden border bg-card/80 py-0 shadow-xl ring-0 sm:h-[calc(100vh-2*--spacing(6))] lg:grid-cols-2">
          <div className="hidden min-h-0 items-center justify-center overflow-hidden border-r bg-muted/30 p-8 lg:flex">
            <AuthIllustration />
          </div>
          <div className="flex min-h-0 min-w-0 items-center-safe justify-center overflow-y-auto p-6">
            <Card
              className={cn(
                "relative isolate w-full max-w-sm overflow-hidden border bg-gradient-to-b from-muted/50 to-card py-8 shadow-lg/5 ring-0 [--card-spacing:--spacing(8)] dark:from-card/80 dark:shadow-xl",
                className
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px -z-10"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, color-mix(in srgb, var(--card-foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--card-foreground) 8%, transparent) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                  maskImage:
                    "repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px), repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px), radial-gradient(ellipse 70% 50% at 50% 0%, black 60%, transparent 100%)",
                  WebkitMaskImage:
                    "repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px), repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px), radial-gradient(ellipse 70% 50% at 50% 0%, black 60%, transparent 100%)",
                  maskComposite: "intersect",
                  WebkitMaskComposite: "source-in",
                }}
              />
              <CardHeader className="flex flex-col items-center gap-2 text-center">
                <div className="flex w-full justify-center">
                  <Link href="/" aria-label="Gorth home">
                    <IconDefault className="size-14" title="Gorth" />
                  </Link>
                </div>
                <CardTitle className="font-medium text-xl">{title}</CardTitle>
                {/* {description ? (
                  <CardDescription>{description}</CardDescription>
                ) : null} */}
              </CardHeader>
              <CardContent>
                <Suspense fallback={null}>
                  <OAuthTimeout />
                </Suspense>
                {children}
              </CardContent>
              {footer ? (
                <CardFooter className="text-muted-foreground justify-center text-center text-sm">
                  {footer}
                </CardFooter>
              ) : null}
            </Card>
          </div>
        </Card>
      </div>
    </main>
  )
}
