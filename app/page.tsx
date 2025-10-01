"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { NewsCard } from "@/components/news-card"
import { SignificanceChart } from "@/components/significance-chart"
import { Search, Filter, Globe, TrendingUp, AlertTriangle } from "lucide-react"
import type { NewsArticle } from "@/lib/types"

export default function NewsAggregator() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [minSignificance, setMinSignificance] = useState<string>("any")

  useEffect(() => {
    console.log("[v0] ========== AI NEWS AGGREGATOR FEATURES ==========")
    console.log("[v0] 🔍 CORE FEATURES:")
    console.log("[v0] • News API Integration - Fetches latest geopolitical news")
    console.log("[v0] • AI-Powered Analysis - OpenAI GPT analysis for strategic significance")
    console.log("[v0] • Significance Scoring - 1-10 scale for strategic importance")
    console.log("[v0] • Geopolitical Categorization - Military, Diplomacy, Trade, Energy, etc.")
    console.log("[v0] • Regional Classification - Global regions (Europe, Asia-Pacific, etc.)")
    console.log("[v0] ")
    console.log("[v0] 🎛️ FILTERING & SEARCH:")
    console.log("[v0] • Advanced Search - Search by title and description")
    console.log("[v0] • Category Filtering - Filter by geopolitical themes")
    console.log("[v0] • Regional Filtering - Filter by global regions")
    console.log("[v0] • Significance Filtering - Filter by importance level (High 6+, Critical 8+)")
    console.log("[v0] • Clear Filters - Reset all filters with one click")
    console.log("[v0] ")
    console.log("[v0] 📊 ANALYTICS DASHBOARD:")
    console.log("[v0] • Significance Distribution Chart - Visual breakdown of article importance")
    console.log("[v0] • Regional Distribution - Percentage breakdown by region")
    console.log("[v0] • Category Breakdown - Count and average significance by category")
    console.log("[v0] • Real-time Statistics - Average significance and critical article count")
    console.log("[v0] ")
    console.log("[v0] 🎨 UI/UX FEATURES:")
    console.log("[v0] • Professional Dashboard Design - Emerald color scheme")
    console.log("[v0] • Responsive Grid Layout - Adapts to different screen sizes")
    console.log("[v0] • Interactive News Cards - Expandable with AI analysis")
    console.log("[v0] • Loading States - Professional loading animations")
    console.log("[v0] • Badge System - Visual indicators for significance levels")
    console.log("[v0] • Dark/Light Mode Support - Built-in theme switching")
    console.log("[v0] ")
    console.log("[v0] 🤖 AI CAPABILITIES:")
    console.log("[v0] • Strategic Importance Analysis - AI evaluates geopolitical impact")
    console.log("[v0] • Automatic Categorization - AI assigns geopolitical themes")
    console.log("[v0] • Regional Classification - AI determines geographic relevance")
    console.log("[v0] • On-demand Analysis - Click to analyze any article with AI")
    console.log("[v0] ")
    console.log("[v0] 🔧 TECHNICAL FEATURES:")
    console.log("[v0] • Next.js App Router - Modern React framework")
    console.log("[v0] • TypeScript - Type-safe development")
    console.log("[v0] • Tailwind CSS - Utility-first styling")
    console.log("[v0] • Shadcn/UI Components - Professional component library")
    console.log("[v0] • API Routes - Server-side news fetching and AI analysis")
    console.log("[v0] • Real-time Updates - Dynamic content updates")
    console.log("[v0] ================================================")

    fetchNews()
  }, [])

  // Fetch news only once on component mount
  useEffect(() => {
    fetchNews()
  }, [])

  // This effect handles all client-side filtering
  useEffect(() => {
    filterArticles()
  }, [articles, searchTerm, selectedCategory, selectedRegion, minSignificance])

  const fetchNews = async () => {
    setLoading(true)
    try {
      // No more query params needed, the API gets all topics
      const response = await fetch(`/api/news`)
      const data = await response.json()
      setArticles(data.articles || []) // Ensure articles is always an array
    } catch (error) {
      console.error("Failed to fetch news:", error)
      setArticles([]) // Clear articles on error
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    if (searchTerm) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (article.description || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // The backend now provides the category, so this filter will work correctly.
    if (selectedCategory !== "all") {
      filtered = filtered.filter((article) => article.category === selectedCategory)
    }

    // Region filtering will work after analysis populates the region field.
    if (selectedRegion !== "all") {
      filtered = filtered.filter((article) => article.region === selectedRegion)
    }

    if (minSignificance !== "any") {
      filtered = filtered.filter((article) => (article.significance || 0) >= Number.parseInt(minSignificance))
    }

    setFilteredArticles(filtered)
  }

  const handleAnalyze = async (article: NewsArticle) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      })
      const analysis = await response.json()

      // Update article with AI analysis
      const updatedArticles = articles.map((a) =>
        a.url === article.url
          ? {
            ...a,
            significance: analysis.significance,
            category: analysis.category,
            region: analysis.region,
            analysis: analysis.analysis,
          }
          : a,
      )
      setArticles(updatedArticles)
    } catch (error) {
      console.error("Analysis failed:", error)
    }
  }

  const categories = [...new Set(articles.map((a) => a.category).filter((c): c is string => !!c))]
  const regions = [...new Set(articles.map((a) => a.region).filter((r): r is string => !!r))]
  const highSignificanceCount = articles.filter((a) => (a.significance || 0) >= 8).length
  const avgSignificance =
    articles.length > 0
      ? (articles.reduce((sum, a) => sum + (a.significance || 0), 0) / articles.length).toFixed(1)
      : "0"

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading strategic intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Strategic Intelligence Hub</h1>
              <p className="text-muted-foreground mt-1">AI-Powered Geopolitical News Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                Avg: {avgSignificance}/10
              </Badge>
              <Badge variant="destructive" className="text-sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highSignificanceCount} Critical
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Intelligence Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter((category) => category !== "all")
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions
                    .filter((region) => region !== "all")
                    .map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={minSignificance} onValueChange={setMinSignificance}>
                <SelectTrigger>
                  <SelectValue placeholder="Min Significance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Level</SelectItem>
                  <SelectItem value="6">High (6+)</SelectItem>
                  <SelectItem value="8">Critical (8+)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                  setSelectedRegion("all")
                  setMinSignificance("any")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SignificanceChart articles={filteredArticles} />

          <Card>
            <CardHeader>
              <CardTitle>Regional Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {regions
                  .filter((region) => region !== "all")
                  .map((region) => {
                    const count = filteredArticles.filter((a) => a.region === region).length
                    const percentage =
                      filteredArticles.length > 0 ? Math.round((count / filteredArticles.length) * 100) : 0
                    return (
                      <div key={region} className="flex justify-between items-center">
                        <span className="text-sm">{region}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories
                  .filter((category) => category !== "all")
                  .map((category) => {
                    const count = filteredArticles.filter((a) => a.category === category).length
                    const avgSig =
                      filteredArticles
                        .filter((a) => a.category === category)
                        .reduce((sum, a) => sum + (a.significance || 0), 0) / count || 0
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {avgSig.toFixed(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <NewsCard key={`${article.url}-${index}`} article={article} onAnalyze={handleAnalyze} />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
