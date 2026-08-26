import type { ReactNode } from "react"
import { Separator } from "@gorth/primitive/default/separator"

interface ContentSectionProps {
  title: string
  description: string
  children: ReactNode
}

export function ContentSection({
  title,
  description,
  children,
}: ContentSectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-none">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Separator className="my-4 flex-none" />
      <div className="min-h-0 w-full flex-1 overflow-y-auto scroll-smooth pe-4 pb-12">
        <div className="-mx-1 px-1.5 lg:max-w-xl">{children}</div>
      </div>
    </section>
  )
}
