import { z } from "@gorth/structure/cores/zod"

export const signInSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  rememberMe: z.boolean(),
})

export const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email."),
})

export const changePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long."),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export const usernameSchema = z
  .string()
  .trim()
  .min(5, "Username must be at least 5 characters long.")
  .max(32, "Username must be no more than 32 characters long.")
  .regex(
    /^[a-z0-9._]+$/,
    "Username may only contain lowercase English letters, numbers, periods, and underscores."
  )

export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Please enter your first name.")
      .max(128),
    lastName: z.string().trim().min(1, "Please enter your last name.").max(128),
    username: usernameSchema,
    email: z.email("Please enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export const accountProfileSchema = z.object({
  nameFormat: z.enum(["first-last", "last-first", "first", "last", "username"]),
  username: usernameSchema,
  firstName: z.string().trim().min(1, "Please enter your first name.").max(128),
  lastName: z.string().trim().min(1, "Please enter your last name.").max(128),
  email: z.email("Please enter a valid email."),
  image: z
    .string()
    .trim()
    .max(2048, "The image URL is too long.")
    .refine(
      (value) => value.length === 0 || URL.canParse(value),
      "Please enter a valid image URL."
    ),
})

export const accountPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters long."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      message: "Passwords don't match.",
      path: ["confirmPassword"],
    }
  )

export const oneTimePasswordSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Please enter the 6-digit code."),
})
