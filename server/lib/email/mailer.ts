import nodemailer from "@gorth/mechanism/cores/nodemailer"

import {
  emailFrom,
  emailFromName,
  emailReplyTo,
  smtpHost,
  smtpPassword,
  smtpPort,
  smtpSecure,
  smtpService,
  smtpUser,
} from "@/lib/utils/environment"

export type EmailOtpType =
  "email-verification" | "forget-password" | "sign-in" | "change-email"

type MailTransporter = ReturnType<typeof nodemailer.createTransport>

let transporter: MailTransporter | null = null

function isGmailTransport() {
  return (
    smtpService?.toLowerCase() === "gmail" ||
    smtpHost?.toLowerCase() === "smtp.gmail.com"
  )
}

function getSmtpPassword() {
  if (!smtpPassword) return undefined

  if (!isGmailTransport()) return smtpPassword

  const appPassword = smtpPassword.replace(/\s+/g, "")

  if (appPassword.length !== 16) {
    throw new Error(
      "Gmail SMTP requires a 16-character App Password in VITE_SMTP_PASS; a regular Google account password cannot be used"
    )
  }

  return appPassword
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getTransporter() {
  if (transporter) return transporter

  if (!smtpUser || !smtpPassword) {
    throw new Error("Missing VITE_SMTP_USER or VITE_SMTP_PASS")
  }

  if (!smtpService && !smtpHost) {
    throw new Error("Missing VITE_SMTP_SERVICE or VITE_SMTP_HOST")
  }

  if (!smtpService && (!Number.isInteger(smtpPort) || smtpPort <= 0)) {
    throw new Error("VITE_SMTP_PORT must be a valid positive integer")
  }

  const auth = {
    user: smtpUser,
    pass: getSmtpPassword(),
  }

  transporter = smtpService
    ? nodemailer.createTransport({ service: smtpService, auth })
    : nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth,
      })

  return transporter
}

function normalizeDeliveryError(cause: unknown) {
  if (!cause || typeof cause !== "object") return cause

  const responseCode =
    "responseCode" in cause && typeof cause.responseCode === "number"
      ? cause.responseCode
      : null
  const response =
    "response" in cause && typeof cause.response === "string"
      ? cause.response
      : ""

  if (
    responseCode === 550 &&
    response.toLowerCase().includes("daily user sending limit exceeded")
  ) {
    return new Error(
      "Gmail daily sending limit exceeded. Gmail can block outgoing mail for up to 24 hours; wait for the rolling quota to reset or configure a transactional email provider.",
      { cause }
    )
  }

  return cause
}

function getEmailContent(type: EmailOtpType, otp: string) {
  switch (type) {
    case "forget-password":
      return {
        subject: `${otp} is your Gorth password reset code`,
        heading: "Reset your Gorth password",
        description:
          "Enter this six-digit code to continue resetting your password.",
      }
    case "sign-in":
      return {
        subject: `${otp} is your Gorth sign-in code`,
        heading: "Sign in to Gorth",
        description:
          "Enter this six-digit code to securely sign in to your account.",
      }
    case "change-email":
      return {
        subject: `${otp} is your Gorth email change code`,
        heading: "Confirm your new email address",
        description:
          "Enter this six-digit code to confirm your new email address.",
      }
    default:
      return {
        subject: `${otp} is your Gorth verification code`,
        heading: "Verify your email address",
        description:
          "Enter this six-digit code to finish creating your Gorth account.",
      }
  }
}

export async function sendVerificationOtpEmail({
  email,
  otp,
  type,
}: {
  email: string
  otp: string
  type: EmailOtpType
}) {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Email OTP must contain exactly six digits")
  }

  const content = getEmailContent(type, otp)
  const safeOtp = escapeHtml(otp)
  const fromAddress = emailFrom ?? smtpUser

  if (!fromAddress) throw new Error("Missing VITE_EMAIL_FROM or VITE_SMTP_USER")

  let result

  try {
    result = await getTransporter().sendMail({
      from: `${emailFromName} <${fromAddress}>`,
      replyTo: emailReplyTo,
      to: email,
      subject: content.subject,
      text: `${content.description} Your code is ${otp}. It expires in 2 minutes. Never share this code with anyone.`,
      html: `
        <div style="margin:0;background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#18181b">
          <div style="margin:0 auto;max-width:560px;border:1px solid #e4e4e7;border-radius:12px;background:#ffffff;padding:32px">
            <h1 style="margin:0 0 12px;font-size:24px">${content.heading}</h1>
            <p style="margin:0 0 24px;line-height:1.6;color:#52525b">${content.description}</p>
            <div style="margin:0 0 24px;border-radius:10px;background:#f4f4f5;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:10px">${safeOtp}</div>
            <p style="margin:0;line-height:1.6;color:#71717a">This code expires in 2 minutes. Never share it with anyone. If you did not request it, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    })
  } catch (cause) {
    throw normalizeDeliveryError(cause)
  }

  const accepted = Array.isArray(result.accepted) ? result.accepted : []
  const rejected = Array.isArray(result.rejected) ? result.rejected : []

  if (!accepted.length || rejected.length) {
    throw new Error("The SMTP server did not accept the OTP recipient")
  }

  console.info("[email] OTP accepted by SMTP server", {
    type,
    accepted: accepted.length,
    rejected: rejected.length,
    messageId: result.messageId,
  })

  return result
}
