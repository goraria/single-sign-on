"use client"

import * as React from "react"

import { startOfMonth, startOfToday } from "date-fns"
import { enGB } from "date-fns/locale"

import { Calendar } from "@gorth/primitive/default/calendar"
import { Card, CardContent } from "@gorth/primitive/default/card"

export function CalendarPanel() {
  const today = startOfToday()
  const [date, setDate] = React.useState<Date | undefined>(today)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() =>
    startOfMonth(today)
  )

  return (
    <Card className="w-full" size="sm">
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          locale={enGB}
          className="w-full p-0"
        />
      </CardContent>
    </Card>
  )
}
