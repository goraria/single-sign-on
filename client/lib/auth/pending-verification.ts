export type VerificationType = "email-verification" | "forget-password"
export type VerificationSource = "sign-up" | "sign-in" | "forgot-password"

export interface PendingVerification {
  email: string
  type: VerificationType
  source: VerificationSource
  redirect: string
  oauthQuery: string
  verifiedOtp: string | null
}

let pendingVerification: PendingVerification | null = null

export function setPendingVerification(
  value: Omit<PendingVerification, "verifiedOtp">
) {
  pendingVerification = {
    ...value,
    email: value.email.trim().toLowerCase(),
    verifiedOtp: null,
  }
}

export function getPendingVerification() {
  return pendingVerification
}

export function setPendingVerificationOtp(otp: string) {
  if (!pendingVerification) return

  pendingVerification = {
    ...pendingVerification,
    verifiedOtp: otp,
  }
}

export function clearPendingVerification() {
  pendingVerification = null
}
