import type { ReactNode } from "react"

export interface LegalSection {
  title: string
  content: ReactNode
}

export interface LegalPageProps {
  description: string
  lastUpdated: string
  sections: LegalSection[]
  title: string
}

export function LegalPage({
  description,
  lastUpdated,
  sections,
  title,
}: LegalPageProps) {
  return (
    <article className="mx-auto w-full max-w-4xl py-8 sm:py-12">
      <header className="border-b pb-8">
        <p className="text-muted-foreground text-sm">
          Last updated {lastUpdated}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
          {description}
        </p>
      </header>

      <div className="divide-y">
        {sections.map((section) => (
          <section key={section.title} className="grid gap-3 py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <div className="text-muted-foreground space-y-3 leading-7">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
