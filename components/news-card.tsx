"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, Globe } from "lucide-react"
import type { NewsArticle } from "@/app/api/news/route"

interface NewsCardProps {
  article: NewsArticle
  onAnalyze?: (article: NewsArticle) => void
}

export function NewsCard({ article, onAnalyze }: NewsCardProps) {
  const getSignificanceColor = (significance?: number) => {
    if (!significance) return "bg-muted"
    if (significance >= 8) return "bg-destructive"
    if (significance >= 6) return "bg-accent"
    return "bg-secondary"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">{article.title}</CardTitle>
          {article.significance && (
            <Badge className={`${getSignificanceColor(article.significance)} text-white shrink-0`}>
              {article.significance}/10
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {article.source.name}
          </div>
        </div>
      </CardHeader>

      {article.urlToImage && (
        <div className="px-6 pb-3">
          <img
            src={article.urlToImage || "/placeholder.svg"}
            alt={article.title}
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}

      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {article.category && <Badge variant="outline">{article.category}</Badge>}
          {article.region && <Badge variant="outline">{article.region}</Badge>}
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => window.open(article.url, "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Read More
          </Button>
          {onAnalyze && (
            <Button variant="secondary" size="sm" onClick={() => onAnalyze(article)}>
              Analyze
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
