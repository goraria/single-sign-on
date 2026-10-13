import { Badge } from "@gorth/primitive/custom/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { adminServices } from "@/utils/constant"

export interface ServiceOverviewProps {
  slug: (typeof adminServices)[number]["slug"]
}

export function ServiceOverview({ slug }: ServiceOverviewProps) {
  const service = adminServices.find((item) => item.slug === slug)!
  const Icon = service.icon
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="size-6 shrink-0" />
          <div>
            <h1 className="text-2xl font-semibold">{service.title}</h1>
            <p className="text-sm text-muted-foreground">
              {service.description}
            </p>
          </div>
        </div>
        <Badge variant="outline">Demo</Badge>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Service status",
            value: "Not connected",
            description: "No health probe is configured for this demo.",
          },
          {
            title: "Requests",
            value: "—",
            description: "Connect the service API to load live usage.",
          },
          {
            title: "Errors",
            value: "—",
            description: "No production metrics are being queried.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Service configuration</CardTitle>
          <CardDescription>{service.repository}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            This is a layout preview. It does not change service configuration,
            process payments, send notifications or access private service data.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
