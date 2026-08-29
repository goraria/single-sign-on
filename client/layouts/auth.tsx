import type { ReactNode } from "react"

import { IconDefault } from "@/assets/icon/brand/icon-default"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { cn } from "@gorth/primitive/lib/utils"

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
  description,
  footer,
  title,
}: AuthLayoutProps) {
  return (
    <main className="bg-muted/30 grid min-h-screen w-full place-items-center p-4 sm:p-6">
      <Card className={cn("w-full max-w-sm shadow-lg", className)}>
        <CardHeader className="items-center text-center">
          <div className="flex w-full justify-center">
            <IconDefault className="size-24" title="Gorth" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? (
          <CardFooter className="text-muted-foreground justify-center text-center text-sm">
            {footer}
          </CardFooter>
        ) : null}
      </Card>
    </main>
  )
}
