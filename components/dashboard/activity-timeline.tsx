"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { UserActivity } from "@/Types/user"
import { Eye, Zap, Heart, Search } from "lucide-react"

interface ActivityTimelineProps {
  activities: UserActivity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: UserActivity["type"]) => {
    switch (type) {
      case "view":
        return <Eye className="h-4 w-4" />
      case "analyze":
        return <Zap className="h-4 w-4" />
      case "favorite":
        return <Heart className="h-4 w-4" />
      case "search":
        return <Search className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: UserActivity["type"]) => {
    switch (type) {
      case "view":
        return "bg-blue-500/10 text-blue-700"
      case "analyze":
        return "bg-emerald-500/10 text-emerald-700"
      case "favorite":
        return "bg-red-500/10 text-red-700"
      case "search":
        return "bg-purple-500/10 text-purple-700"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
              <div className={`p-2 rounded-lg h-fit ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.articleTitle}</p>
                {activity.details && <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>}
                <p className="text-xs text-muted-foreground mt-2">{formatTime(activity.timestamp)}</p>
              </div>
              <Badge variant="outline" className="capitalize h-fit">
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
