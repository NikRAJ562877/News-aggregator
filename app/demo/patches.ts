"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { NewsCard } from "@/components/news-card"
import { SignificanceChart } from "@/components/significance-chart"
import { WorldMap } from "@/components/world-map"
import { Search, Filter, Globe, TrendingUp, AlertTriangle, Home, ArrowLeft } from "lucide-react"
import { TypingAnimator } from "@/components/typing-animator"
import { useAuth } from "@/components/AuthProvider"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import { UserHeader } from "@/components/dashboard/user-header"
import { UsageChart } from "@/components/dashboard/usage-chart"
import { useRouter, useSearchParams } from "next/navigation"
import { NewsArticle } from "@/lib/types"
import { isCompleteAnalysis, fetchAnalysisWithRetry } from "@/lib/analyzeUtils"

// PATCH: Updated handleAnalyze to use retry logic and show loading
export const handleAnalyzeFactory = (
  setModalArticle: any,
  setModalLoading: any,
  setModalError: any,
  setRelatedArticles: any,
  setRelatedArticlesLoading: any,
  setModalResult: any,
  setArticles: any,
  analysisCacheRef: any,
) => {
  return async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalError(null)
    setRelatedArticles([])
    setRelatedArticlesLoading(true)

    const cacheKey = article.url || `${article.title}:${article.publishedAt}`

    // Check cache first
    if (analysisCacheRef.has(cacheKey)) {
      const cached = analysisCacheRef.get(cacheKey)
      if (isCompleteAnalysis(cached)) {
        setModalResult(cached)
        setArticles((prev: NewsArticle[]) =>
          prev.map((a) =>
            a.url === article.url
              ? {
                  ...a,
                  significance: cached.significance ?? a.significance,
                  category: cached.category ?? a.category,
                  region: cached.region ?? a.region,
                  analysis: cached.analysis ?? a.analysis,
                }
              : a,
          ),
        )
        setModalLoading(false)
      } else {
        // Cache has incomplete result, remove it and refetch
        analysisCacheRef.delete(cacheKey)
      }
    }

    // Fetch with retry (keeps loading state on screen during retries)
    try {
      const analysis = await fetchAnalysisWithRetry(article, 3, 1000)
      setModalResult(analysis)
      analysisCacheRef.set(cacheKey, analysis)
      setArticles((prev: NewsArticle[]) =>
        prev.map((a) =>
          a.url === article.url
            ? {
                ...a,
                significance: analysis.significance ?? a.significance,
                category: analysis.category ?? a.category,
                region: analysis.region ?? a.region,
                analysis: analysis.analysis ?? a.analysis,
              }
            : a,
        ),
      )
    } catch (error) {
      console.error("Analysis failed after retries:", error)
      setModalError("Unable to analyze this article. Try again in a moment.")
      // Don't cache incomplete results
    } finally {
      setModalLoading(false)
    }

    // Fetch related articles (non-blocking)
    try {
      const relatedResponse = await fetch("/api/related-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      })
      const relatedData = await relatedResponse.json()
      setRelatedArticles(relatedData.articles || [])
    } catch (error) {
      console.error("Failed to fetch related articles:", error)
    } finally {
      setRelatedArticlesLoading(false)
    }
  }
}

// PATCH: Reduced batch concurrency from 8 to 3
export const reducedConcurrency = 3
