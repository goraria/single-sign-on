import type { Metadata } from "next"

import { LegalPage } from "@/layouts/legal"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Gorth collects, uses, and protects account information.",
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="August 27, 2026"
      description="This policy explains how Gorth processes information when you create an account, sign in, or connect an application."
      sections={[
        {
          title: "Information we collect",
          content: (
            <p>
              We process account details such as your name, email address,
              profile image, authentication providers, active sessions, and
              security events needed to operate the identity service.
            </p>
          ),
        },
        {
          title: "How we use information",
          content: (
            <p>
              Information is used to authenticate you, issue and validate
              sessions, connect approved applications, prevent abuse, support
              account recovery, and improve service reliability.
            </p>
          ),
        },
        {
          title: "Sharing and connected apps",
          content: (
            <p>
              We disclose identity claims only to applications you authorize and
              according to the requested scopes. We do not sell personal
              information.
            </p>
          ),
        },
        {
          title: "Security and retention",
          content: (
            <p>
              We use technical and organizational safeguards to protect account
              data. Information is retained only for as long as needed to
              provide the service, meet legal obligations, and resolve security
              incidents.
            </p>
          ),
        },
        {
          title: "Your choices",
          content: (
            <p>
              You may review account settings, revoke connected applications,
              end sessions, or request assistance with your personal information
              by contacting us.
            </p>
          ),
        },
        {
          title: "Contact",
          content: (
            <p>
              Privacy questions can be sent to{" "}
              <a
                href="mailto:privacy@gorth.app"
                className="text-foreground underline underline-offset-4"
              >
                privacy@gorth.app
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  )
}
