import Link from "next/link"

import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
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
      <Card className="max-w-sm gap-4 sm:min-w-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your registered email and we will send you a link to reset
            your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="hover:text-primary underline underline-offset-4"
            >
              Sign up
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
