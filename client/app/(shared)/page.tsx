import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  Check,
  ChevronRight,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Dot,
} from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { Badge } from "@gorth/primitive/custom/badge"
import { Avatar, AvatarFallback } from "@gorth/primitive/custom/avatar"
import { Card } from "@gorth/primitive/default/card"

const features = [
  {
    icon: LockKeyhole,
    title: "One secure entry point",
    description:
      "Give every teammate a single, effortless way into the tools they use every day.",
  },
  {
    icon: ShieldCheck,
    title: "Security that stays current",
    description:
      "Adaptive policies, automatic provisioning, and complete visibility without the busywork.",
  },
  {
    icon: Sparkles,
    title: "Setup in an afternoon",
    description:
      "Connect your stack, invite your team, and start making access feel invisible.",
  },
]

const apps = ["Notion", "Linear", "Slack", "GitHub", "Figma"]

export const metadata: Metadata = {
  title: "Home",
}

export default function Page() {
  return (
    <div className="w-full overflow-hidden">
      <Card
        className="-mx-6 -mt-6 gap-0 rounded-none bg-transparent py-0 shadow-none ring-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 36% 36% at center, color-mix(in oklab, var(--primary) 55%, transparent) 0%, color-mix(in oklab, var(--primary) 22%, transparent) 45%, transparent 100%)",
        }}
      >
        <section id="top" className="relative px-6 py-12">
          <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 xl:gap-20">
            <div>
              <Badge
                variant="outline"
                className="mb-6 inline-flex items-center gap-2 rounded-full border font-mono backdrop-blur-sm"
              >
                <Dot className="bg-accent size-2 rounded-full" />
                The calm way to sign in
              </Badge>
              <h1 className="text-foreground max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-7xl lg:leading-[.98] xl:text-[5.25rem]">
                Access, without the{" "}
                <span className="text-primary">friction.</span>
              </h1>
              <p className="text-muted-foreground mt-8 max-w-xl text-lg leading-8 text-pretty">
                Gorth is the modern SSO layer for teams that value momentum. One
                identity, every tool, zero interruptions.
              </p>
              <div id="start" className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  nativeButton={false}
                  render={<Link href="/auth/sign-up" />}
                  // size="lg"
                >
                  Get started free
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="#how-it-works" />}
                  variant="outline"
                  // size="lg"
                >
                  See how it works
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
              <div className="text-muted-foreground mt-7 flex items-center gap-2 text-sm">
                <Check className="text-accent" /> No credit card required
                <span className="text-border">•</span> Setup in minutes
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div
                className="bg-primary/10 absolute -inset-2 rounded-4xl blur-2xl"
                aria-hidden="true"
              />
              <Card className="border-border bg-card shadow-primary/10 text-foreground relative gap-0 rounded-3xl border p-3 shadow-2xl ring-0">
                <div className="border-border bg-background rounded-xl border p-6 sm:p-8">
                  <div className="border-border flex items-center justify-between border-b pb-6">
                    <div>
                      <p className="text-muted-foreground font-mono text-xs">
                        GORTH / ACCESS
                      </p>
                      <p className="mt-2 font-medium">Welcome back</p>
                    </div>
                    <Avatar size="lg">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        G
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-muted-foreground mt-7 text-sm">
                    Continue with your workspace identity
                  </p>
                  <Card
                    size="sm"
                    className="order-border mt-4 h-14 flex-row items-center gap-2.5 rounded-lg border p-2.5 ring-0"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-muted-foreground text-primary-foreground">
                        JG
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        japtor@gorth.org
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Gorth workspace
                      </p>
                    </div>
                    <Check className="text-accent" />
                  </Card>
                  <Button
                    nativeButton={false}
                    render={<Link href="/auth/sign-in" />}
                    className="mt-5 w-full"
                  >
                    Continue securely <ArrowRight data-icon="inline-end" />
                  </Button>
                  <p className="text-muted-foreground mt-5 text-center text-xs">
                    Protected by Gorth identity controls
                  </p>
                </div>
              </Card>
              <div className="border-border bg-card text-foreground absolute -bottom-5 -left-8 hidden rounded-xl border px-4 py-3 shadow-lg sm:block">
                <p className="text-muted-foreground font-mono text-[10px]">
                  ACTIVE SESSIONS
                </p>
                <p className="mt-1 text-sm font-medium">12,408 protected</p>
              </div>
            </div>
          </div>
        </section>
      </Card>

      <Card
        id="how-it-works"
        className="border-border rounded-2xl border p-6 ring-0"
      >
        <div>
          <p className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase">
            Built for flow
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="border-border border-l-2 pl-5">
                <Icon className="text-accent size-5" />
                <h2 className="mt-5 text-lg font-medium tracking-tight">
                  {title}
                </h2>
                <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-6">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Card>

      <section id="security" className="py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase">
              Quietly powerful
            </p>
            <h2 className="mt-5 max-w-lg text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Your team moves faster when access just works.
            </h2>
          </div>
          <div>
            <p className="text-muted-foreground max-w-xl text-lg leading-8">
              From first invite to your thousandth teammate, Gorth keeps
              identity simple and your security team in control.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {apps.map((app) => (
                <Badge key={app}>{app}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Card
        id="pricing"
        className="bg-primary text-primary-foreground border-primary-foreground/20 gap-0 rounded-2xl border px-6 py-6 ring-0"
      >
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-primary-foreground/60 font-mono text-xs tracking-[0.2em] uppercase">
              Ready when you are
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Make the next sign-in feel like the last.
            </h2>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="mailto:hello@gorth.app" />}
            variant="secondary"
            // size="lg"
          >
            Talk to Gorth
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
