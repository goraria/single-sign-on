import type { Metadata } from "next"

import { LegalPage } from "@/layouts/legal"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing access to and use of Gorth services.",
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="August 27, 2026"
      description="These terms govern your access to Gorth identity services, connected applications, and related account features."
      sections={[
        {
          title: "Using Gorth",
          content: (
            <p>
              You must provide accurate account information, protect your
              credentials, and use the service only for lawful purposes. You are
              responsible for activity performed through your account.
            </p>
          ),
        },
        {
          title: "Connected applications",
          content: (
            <p>
              Gorth may authorize access to applications you select. Review the
              permissions requested by each application before continuing. You
              may revoke access or end active sessions where those controls are
              available.
            </p>
          ),
        },
        {
          title: "Acceptable use",
          content: (
            <p>
              You may not misuse the service, bypass security controls,
              interfere with other users, probe systems without permission, or
              use Gorth to violate applicable laws or third-party rights.
            </p>
          ),
        },
        {
          title: "Availability and changes",
          content: (
            <p>
              We may update, suspend, or discontinue features to maintain
              security and reliability. Material changes to these terms will be
              communicated through the service when appropriate.
            </p>
          ),
        },
        {
          title: "Contact",
          content: (
            <p>
              Questions about these terms can be sent to{" "}
              <a
                href="mailto:legal@gorth.app"
                className="text-foreground underline underline-offset-4"
              >
                legal@gorth.app
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  )
}
