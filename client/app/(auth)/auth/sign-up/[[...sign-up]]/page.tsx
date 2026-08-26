import Link from "next/link"
import { Suspense } from "react"

import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"
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
            <CardTitle className="text-lg tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription>
              Enter your email and password to create an account. Already have
              one?{" "}
              <Link
                href="/auth/sign-in"
                className="hover:text-primary underline underline-offset-4"
              >
                Sign In
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
          <CardFooter>
            <p className="text-muted-foreground px-8 text-center text-sm">
              By creating an account, you agree to our{" "}
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
