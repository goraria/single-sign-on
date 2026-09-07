import type { Metadata } from "next"
import { LegalPage } from "@/layouts/legal"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Gorth uses cookies for authentication and preferences.",
}

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="August 31, 2026"
      description="This policy explains the cookies required to operate Gorth securely."
      sections={[
        { title: "Essential cookies", content: <p>Gorth uses secure, HTTP-only cookies to maintain authentication sessions and complete OAuth authorization flows.</p> },
        { title: "Preference cookies", content: <p>Interface preferences such as theme, base color, paint color, chart color, and dashboard layout are stored in first-party cookies.</p> },
        { title: "Cookie lifetime", content: <p>Session cookies expire with the related session. Preference cookies may remain for up to one year unless you reset or remove them.</p> },
        { title: "Third-party services", content: <p>Connected identity providers may set their own cookies while you authenticate on their domains. Their cookie policies apply independently.</p> },
        { title: "Your choices", content: <p>You may remove preference cookies through your browser. Removing authentication cookies signs you out and may interrupt an active authorization flow.</p> },
      ]}
    />
  )
}
