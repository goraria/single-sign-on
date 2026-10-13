import {
  Banknote,
  ChevronRight,
  Droplet,
  History,
  Lightbulb,
  MoreHorizontal,
  QrCode,
  SendHorizontal,
  Smartphone,
} from "@gorth/primitive/cores/lucide"

import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import { Button } from "@gorth/primitive/custom/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Field } from "@gorth/primitive/default/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@gorth/primitive/default/input-group"

const contacts = [
  { id: 1, initials: "AR" },
  { id: 2, initials: "SC" },
  { id: 3, initials: "MJ" },
  { id: 4, initials: "ED" },
]

const shortcuts = [
  { id: 1, label: "Scan QR", icon: QrCode },
  { id: 2, label: "Transfer", icon: SendHorizontal },
  { id: 3, label: "Pay Bills", icon: Banknote },
  { id: 4, label: "History", icon: History },
  { id: 5, label: "Mobile", icon: Smartphone },
  { id: 6, label: "Electricity", icon: Lightbulb },
  { id: 7, label: "Water", icon: Droplet },
  { id: 8, label: "More", icon: MoreHorizontal },
]

export function QuickActions() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Quick Transfer</CardTitle>
          <CardAction>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {contacts.map((contact) => (
                  <NavIdentity
                    key={contact.id}
                    user={{ name: contact.initials }}
                    showName={false}
                  />
                ))}
              </div>
              <ChevronRight className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="0.00" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>USD</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <Button>Send</Button>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon
              return (
                <div
                  key={shortcut.id}
                  className="flex flex-col items-center gap-2.5"
                >
                  <Button variant="outline" className="size-12 rounded-full">
                    <Icon className="size-5" />
                  </Button>
                  <span className="text-center text-muted-foreground text-xs">
                    {shortcut.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
