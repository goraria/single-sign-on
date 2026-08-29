import { Button } from "@gorth/primitive/default/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gorth/primitive/custom/tabs"
import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
} from "@gorth/primitive/cores/lucide"
import { getInitials } from "@/lib/utils/formatter"

const metrics = [
  ["Total Revenue", "$45,231.89", "+20.1% from last month", DollarSign],
  ["Subscriptions", "+2,350", "+180.1% from last month", Users],
  ["Sales", "+12,234", "+19% from last month", CreditCard],
  ["Active Now", "+573", "+201 since last hour", Activity],
] as const

const chartValues = [38, 58, 44, 70, 52, 82, 64, 88, 72, 94, 76, 86]
const recentSales = [
  ["Olivia Martin", "olivia@example.com", "+$1,999.00"],
  ["Jackson Lee", "jackson@example.com", "+$39.00"],
  ["Isabella Nguyen", "isabella@example.com", "+$299.00"],
  ["William Kim", "will@example.com", "+$99.00"],
  ["Sofia Davis", "sofia@example.com", "+$39.00"],
]

export function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="overview" className="gap-6">
        <div className="flex flex-wrap items-center justify-between overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
          <Button>Download</Button>
        </div>
        <TabsContent value="overview" className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([title, value, change, Icon]) => (
              <Card key={title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  <Icon className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-muted-foreground text-xs">{change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-72 items-end gap-2">
                  {chartValues.map((value, index) => (
                    <div
                      key={index}
                      className="bg-primary/80 hover:bg-primary flex-1 rounded-t-sm transition-colors"
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  You made 265 sales this month.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {recentSales.map(([name, email, amount]) => (
                  <div key={email} className="flex items-center gap-3">
                    <div className="bg-muted flex size-9 items-center justify-center rounded-full text-xs font-medium">
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {email}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{amount}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Authentication and application activity overview.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {["Successful logins", "Token refreshes", "Active clients"].map(
                (label, index) => (
                  <div key={label} className="rounded-md border p-4">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="mt-2 text-2xl font-bold">
                      {[1248, 829, 18][index]}
                    </p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
