"use client"

import React, { useState } from "react"
import { MotionCard } from "@/components/motion-card"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, Globe, Bookmark } from "lucide-react"
import type { NewsArticle } from "@/lib/types"
import { useAuth } from "@/components/AuthProvider"


interface NewsCardProps {
  article: NewsArticle
  onAnalyze?: (article: NewsArticle) => void
  onAuthenticate?: (article: NewsArticle) => void
}

export function NewsCard({ article, onAnalyze, onAuthenticate: onAuthenticateProp }: NewsCardProps) {
  const auth = useAuth()
  const [authenticating, setAuthenticating] = useState(false)
  const [verdict, setVerdict] = useState<string | null>(null)

  const isSaved = auth.user?.savedArticles?.some(a => a.url === article.url) || false

  const getSignificanceColor = (significance?: number) => {
    if (!significance) return "bg-muted"
    if (significance >= 8) return "bg-destructive"
    if (significance >= 6) return "bg-accent"
    return "bg-secondary"
  }


  const getReliabilityColor = (reliability?: string) => {
    switch (reliability) {
      case 'High':
        return 'bg-green-600'
      case 'Medium':
        return 'bg-yellow-500'
      case 'Low':
        return 'bg-red-600'
      case 'Opinion':
        return 'bg-blue-500'
      case 'Satire':
        return 'bg-gray-500'
      default:
        return 'bg-muted'
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }


  async function onAuthenticate(article: NewsArticle): Promise<void> {
    // If parent provides handler, use it (opens modal)
    if (onAuthenticateProp) {
      onAuthenticateProp(article)
      return
    }

    // Otherwise, use local state (inline display)
    setAuthenticating(true)
    setVerdict(null)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/check_fake_news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_text: article.title + ". " + article.description,
        }),
      })
      const data = await response.json()
      setVerdict(data.verdict)
    } catch (err) {
      setVerdict("Error checking authenticity.")
    }
    setAuthenticating(false)
  }


  return (
    <MotionCard className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">{article.title}</CardTitle>
        </div>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {article.source.name}
            {article.sourceReliability && (
              <Badge
                className={`${getReliabilityColor(
                  article.sourceReliability
                )} text-white ml-2`}
              >
                {article.sourceReliability}
              </Badge>
            )}
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
        <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{article.description}</p>


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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAuthenticate(article)}
            disabled={authenticating}
          >
            {authenticating ? "Checking..." : "Authenticate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={(e) => {
              e.stopPropagation()
              if (auth.user) {
                auth.toggleSaveArticle(article)
              }
            }}
            title={isSaved ? "Remove from Dossier" : "Add to Dossier"}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </Button>
        </div>

        {verdict && (
          <div className="mt-2 text-sm font-semibold">
            Fake News Verdict: <span>{verdict}</span>
          </div>
        )}
      </CardContent>
    </MotionCard >
  )
}
