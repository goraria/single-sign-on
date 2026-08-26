import { z } from "@gorth/structure/cores/zod"

export const signInSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
})

export const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email."),
})

export const changePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long."),
})

export const oneTimePasswordSchema = z.object({
  otp: z.string().length(6, "Please enter the 6-digit code."),
})
