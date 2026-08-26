import Link from "next/link"
import { Suspense } from "react"

import { AuthLayout } from "@/components/auth/auth-layout"
import { OtpForm } from "@/components/auth/one-time-password-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"

export default function Page() {
  return (
    <AuthLayout>
      <Suspense>
        <Card className="max-w-md gap-4">
          <CardHeader>
            <CardTitle className="text-lg tracking-tight">
              Two-factor Authentication
            </CardTitle>
            <CardDescription>
              Please enter the authentication code. We have sent the
              authentication code to your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OtpForm />
          </CardContent>
          <CardFooter>
            <p className="text-muted-foreground text-center text-sm">
              Haven&apos;t received it?{" "}
              <Link
                href="/auth/forgot-password"
                className="hover:text-primary underline underline-offset-4"
              >
                Resend a new code.
              </Link>
            </p>
          </CardFooter>
        </Card>
      </Suspense>
    </AuthLayout>
  )
}
