import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"

export const metadata: Metadata = { title: "Careers" }

export default function CareersPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-12">
      <div>
        <p className="text-primary text-sm font-medium">Careers</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Build calm, reliable access with us.</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">We are interested in people who care about identity standards, thoughtful interfaces, and dependable infrastructure.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Open applications</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground">There are no published roles right now. You can still introduce yourself and tell us what you would like to build.</p>
          <Button nativeButton={false} render={<Link href="mailto:careers@gorth.app" />}>
            Contact careers <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
