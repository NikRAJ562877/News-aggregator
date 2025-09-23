"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { NewsArticle } from "@/app/api/news/route"

interface SignificanceChartProps {
  articles: NewsArticle[]
}

export function SignificanceChart({ articles }: SignificanceChartProps) {
  // Group articles by significance score
  const significanceData = articles.reduce(
    (acc, article) => {
      const score = article.significance || 0
      const range = score >= 8 ? "8-10" : score >= 6 ? "6-7" : score >= 4 ? "4-5" : "1-3"
      acc[range] = (acc[range] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = [
    { range: "1-3", count: significanceData["1-3"] || 0, label: "Low" },
    { range: "4-5", count: significanceData["4-5"] || 0, label: "Medium" },
    { range: "6-7", count: significanceData["6-7"] || 0, label: "High" },
    { range: "8-10", count: significanceData["8-10"] || 0, label: "Critical" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategic Significance Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
