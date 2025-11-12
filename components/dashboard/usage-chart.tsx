"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const usageData = [
  { day: "Mon", views: 45, analyses: 12 },
  { day: "Tue", views: 52, analyses: 15 },
  { day: "Wed", views: 48, analyses: 10 },
  { day: "Thu", views: 61, analyses: 18 },
  { day: "Fri", views: 55, analyses: 14 },
  { day: "Sat", views: 42, analyses: 8 },
  { day: "Sun", views: 38, analyses: 9 },
]

export function UsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Usage Pattern</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="var(--color-primary)" name="Articles Viewed" />
            <Line type="monotone" dataKey="analyses" stroke="var(--color-secondary)" name="Analyzed" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
