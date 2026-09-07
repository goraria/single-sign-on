import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"

export const metadata: Metadata = { title: "About" }

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-12">
      <div>
        <p className="text-primary text-sm font-medium">About Gorth</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">One identity across the ecosystem.</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">Gorth provides a central authentication and authorization layer for applications that need secure access without duplicating account infrastructure.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          ["Simple", "A consistent sign-in experience across every connected application."],
          ["Secure", "Standards-based OAuth, isolated application data, and controlled scopes."],
          ["Connected", "A shared identity while each application retains its own business roles."],
        ].map(([title, description]) => (
          <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-muted-foreground leading-6">{description}</CardContent></Card>
        ))}
      </div>
    </div>
  )
}
