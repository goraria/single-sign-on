import Link from "next/link"
import { Suspense } from "react"

import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/sign-in-form"
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
        <Card className="max-w-sm gap-4">
          <CardHeader>
            <CardTitle className="text-lg tracking-tight">Sign in</CardTitle>
            <CardDescription>
              Enter your email and password below to log into your account.
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="hover:text-primary underline underline-offset-4"
              >
                Sign Up
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter>
            <p className="text-muted-foreground px-8 text-center text-sm">
              By clicking sign in, you agree to our{" "}
              <Link
                href="#"
                className="hover:text-primary underline underline-offset-4"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="hover:text-primary underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </Suspense>
    </AuthLayout>
  )
}
