import type { ReactNode } from "react"
import { Floating3DParticles } from "@gorth/primitive/background/floating"

export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-svh bg-background">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <Floating3DParticles color="#000000" className="dark:invert" />
      </div>
      {children}
    </div>
  )
}
