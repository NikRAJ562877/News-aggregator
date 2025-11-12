"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserStats } from "@/Types/user"
import { Eye, Zap, Heart, Clock } from "lucide-react"

interface StatsGridProps {
  stats: UserStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const statCards = [
    {
      title: "Articles Viewed",
      value: stats.totalArticlesViewed,
      icon: Eye,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Analyzed",
      value: stats.articlesAnalyzed,
      icon: Zap,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Favorites",
      value: stats.favoriteArticles,
      icon: Heart,
      color: "bg-red-500/10 text-red-600",
    },
    {
      title: "Time Spent",
      value: formatTime(stats.totalTimeSpent),
      icon: Clock,
      color: "bg-purple-500/10 text-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
