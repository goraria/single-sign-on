"use client"

import { useState } from "react"
import { BellRing, Save } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import {
  NativeSelect,
  NativeSelectOption,
} from "@gorth/primitive/default/native-select"

const notificationRows = [
  "New products and offers",
  "Account activity",
  "Sign-in from a new browser",
  "New device linked",
]

export function NotificationSettingsPage() {
  const [changed, setChanged] = useState(false)
  const [saved, setSaved] = useState(false)

  function markChanged() {
    setChanged(true)
    setSaved(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-5" />
          Notification preferences
        </CardTitle>
        <CardDescription>
          Choose how you receive account and application notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="overflow-x-auto rounded-md border">
          <div className="bg-muted/40 grid min-w-160 grid-cols-[1fr_repeat(3,120px)] border-b p-3 text-sm font-medium">
            <span>Notification type</span>
            <span>Email</span>
            <span>Browser</span>
            <span>Application</span>
          </div>
          {notificationRows.map((row, index) => (
            <div
              className="grid min-w-160 grid-cols-[1fr_repeat(3,120px)] items-center border-b p-3 text-sm last:border-0"
              key={row}
            >
              <span>{row}</span>
              {[0, 1, 2].map((channel) => (
                <Checkbox
                  aria-label={`${row}: channel ${channel + 1}`}
                  defaultChecked={index + channel < 4}
                  key={channel}
                  onCheckedChange={markChanged}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex max-w-xl flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="notification-time">
            When to send notifications
          </label>
          <NativeSelect
            className="w-full"
            defaultValue="online"
            id="notification-time"
            onChange={markChanged}
          >
            <NativeSelectOption value="online">
              Only while I am online
            </NativeSelectOption>
            <NativeSelectOption value="always">At any time</NativeSelectOption>
            <NativeSelectOption value="daily">Daily summary</NativeSelectOption>
          </NativeSelect>
        </div>

        {saved ? (
          <p className="text-sm text-emerald-600">
            Notification preferences saved.
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            disabled={!changed}
            onClick={() => {
              setChanged(false)
              setSaved(true)
            }}
          >
            <Save className="size-4" />
            Save changes
          </Button>
          <Button
            disabled={!changed}
            onClick={() => {
              setChanged(false)
              setSaved(false)
            }}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
