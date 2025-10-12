"use client"

import { useState, useEffect, useMemo } from "react"
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
  // persona removed from top-level filters
  // removed minSignificance filter (levels handled via modal/batch only)

  // Per-article analysis modal state
  const [modalArticle, setModalArticle] = useState<NewsArticle | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [modalResult, setModalResult] = useState<any>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalPersonaTarget, setModalPersonaTarget] = useState<string>("")
  const [modalPersonaLoading, setModalPersonaLoading] = useState<boolean>(false)
  const [modalPersonaResult, setModalPersonaResult] = useState<any>(null)
  // Single-button batch level check state
  const [isCheckingLevels, setIsCheckingLevels] = useState<boolean>(false)
  const [checkedCount, setCheckedCount] = useState<number>(0)
  const [totalToCheck, setTotalToCheck] = useState<number>(0)

  // Normalize helper must be defined early so filters can use it
  const normalize = (v?: string) => (v ?? "").toString().trim().toLowerCase()

  // persona logic removed — persona selection moved into per-article modal

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
  }, [articles, searchTerm, selectedCategory, selectedRegion])

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

    // Category filter: compare normalized values so casing/whitespace differences don't break the filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((article) => normalize(article.category) === normalize(selectedCategory))
    }

    // Region filter: use same normalization as categories
    if (selectedRegion !== "all") {
      filtered = filtered.filter((article) => normalize(article.region) === normalize(selectedRegion))
    }

    // persona filtering removed

    // minSignificance removed — levels handled interactively via the modal or batch-check.

    setFilteredArticles(filtered)
  }

  // When user clicks Analyze on a news card, open a modal and run analysis there.
  // Do NOT immediately overwrite the article in the list — let user review and Apply.
  const handleAnalyze = async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalResult(null)
    setModalError(null)
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Analysis failed')
      }
      const analysis = await response.json()
      setModalResult(analysis)
    } catch (error: any) {
      console.error("Analysis failed:", error)
      setModalError(error?.message ?? 'Analysis failed')
    } finally {
      setModalLoading(false)
    }
  }

  // Evaluate persona impact (country) for the article currently open in modal
  const evaluatePersona = async () => {
    if (!modalArticle || !modalPersonaTarget) return
    setModalPersonaLoading(true)
    setModalPersonaResult(null)
    try {
      const payload = {
        targetCountry: modalPersonaTarget,
        article: {
          title: modalArticle.title,
          url: modalArticle.url,
          significance: modalResult?.significance ?? null,
          category: modalResult?.category ?? modalArticle.category,
          region: modalResult?.region ?? modalArticle.region,
          description: modalArticle.description,
        },
      }
      const res = await fetch('/api/persona-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Persona evaluation failed')
      }
      const json = await res.json()
      setModalPersonaResult(json)
    } catch (err: any) {
      console.error('Persona evaluation failed', err)
      setModalPersonaResult({ error: err?.message ?? 'Evaluation failed' })
    } finally {
      setModalPersonaLoading(false)
    }
  }

  // Check levels for all currently displayed (filtered) articles with a small delay between requests.
  // This sends individual POST requests to /api/analyze for each article sequentially to avoid overloading the LLM.
  const checkLevelsForDisplayed = async () => {
    if (isCheckingLevels) return
    const toCheck = filteredArticles // use already filtered list
      .filter((a) => a && a.url)
    if (toCheck.length === 0) return

    setIsCheckingLevels(true)
    setCheckedCount(0)
    setTotalToCheck(toCheck.length)

    for (const article of toCheck) {
      try {
        // Only call analyze if article is unassessed or you want to re-run every time
        if (article.significance == null) {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article }),
          })
          const analysis = await response.json()

          // Merge analysis result into articles list
          setArticles((prev) =>
            prev.map((a) =>
              a.url === article.url
                ? {
                    ...a,
                    significance: analysis.significance,
                    category: typeof analysis.category === 'string' ? analysis.category.trim() : a.category,
                    region: typeof analysis.region === 'string' ? analysis.region.trim() : a.region,
                    analysis: analysis.analysis,
                  }
                : a,
            ),
          )
        }
      } catch (err) {
        console.error('Batch analyze failed for', article.url, err)
      } finally {
        setCheckedCount((c) => c + 1)
        // small delay between requests to reduce load on the LLM/API
        await new Promise((r) => setTimeout(r, 400))
      }
    }

    setIsCheckingLevels(false)
    setTotalToCheck(0)
  }

  // Derive categories and regions from current articles and include a default 'all'
  const categories = useMemo(() => {
    const s = new Set<string>()
    articles.forEach((a) => {
      if (a.category && typeof a.category === "string") s.add(a.category.trim())
    })
    return ["all", ...Array.from(s).sort()]
  }, [articles])

  const regions = useMemo(() => {
    const s = new Set<string>()
    articles.forEach((a) => {
      if (a.region && typeof a.region === "string") s.add(a.region.trim())
    })
    // Keep 'Global' or other initial tags produced by the API; include 'all' at top
    return ["all", ...Array.from(s).sort()]
  }, [articles])

  const highSignificanceCount = articles.filter((a) => (a.significance || 0) >= 8).length
  // Compute average only over assessed articles
  const analyzedArticles = articles.filter((a) => a.significance != null)
  const avgSignificance =
    analyzedArticles.length > 0
      ? (analyzedArticles.reduce((sum, a) => sum + (a.significance || 0), 0) / analyzedArticles.length).toFixed(1)
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

              {/* Persona select removed from filters (moved to per-article modal) */}

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                  setSelectedRegion("all")
                }}
              >
                Clear Filters
              </Button>

              {/* Single-button bulk analyze for currently displayed articles */}
              <Button
                variant="default"
                onClick={checkLevelsForDisplayed}
                disabled={isCheckingLevels || filteredArticles.length === 0}
              >
                {isCheckingLevels ? `Checking ${checkedCount}/${totalToCheck}` : 'Check Levels'}
              </Button>
              {/* Per-article analysis modal (opened when clicking Analyze on a card) */}
              {modalArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" onClick={() => { if (!modalLoading) { setModalArticle(null); setModalResult(null); setModalError(null) } }} />
                  <div className="bg-card rounded-md shadow-lg max-w-2xl w-full p-6 z-10">
                    <h3 className="text-lg font-semibold">Article Analysis</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{modalArticle.title}</p>

                    <div className="mt-4">
                      {modalLoading && <div className="text-sm">Analyzing article…</div>}
                      {modalError && <div className="text-sm text-destructive">{modalError}</div>}
                      {!modalLoading && modalResult && (
                        <div className="space-y-2 text-sm">
                          <div><strong>Significance:</strong> {modalResult.significance ?? 'N/A'}/10</div>
                          <div><strong>Category:</strong> {modalResult.category ?? 'N/A'}</div>
                          <div><strong>Region:</strong> {modalResult.region ?? 'N/A'}</div>
                          <div><strong>Analysis:</strong> <div className="mt-1 text-muted-foreground">{modalResult.analysis ?? 'No details'}</div></div>
                        </div>
                      )}

                      {/* Persona evaluation input inside the modal */}
                      <div className="mt-4">
                        <label className="text-sm">Evaluate impact for a country (optional)</label>
                        <Input id="modal-persona-input" placeholder="Enter country (e.g. United States)" className="mt-2" value={modalPersonaTarget}
                          onChange={(e) => setModalPersonaTarget(e.target.value)} />
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={evaluatePersona} disabled={modalPersonaLoading || !modalPersonaTarget || !modalArticle}>
                            {modalPersonaLoading ? 'Evaluating...' : 'Evaluate for Country'}
                          </Button>
                        </div>
                        <div className="mt-3 text-sm max-h-80 overflow-auto bg-muted/10 p-3 rounded">
                          {modalPersonaLoading && <div>Generating persona analysis…</div>}

                          {!modalPersonaLoading && modalPersonaResult && !modalPersonaResult.error && (
                            <div className="space-y-3">
                              {/* Impact */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Impact:</span>
                                <span
                                  className={
                                    `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                      modalPersonaResult.impact === 'positive'
                                        ? 'bg-green-600 text-white'
                                        : modalPersonaResult.impact === 'negative'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-300 text-gray-800'
                                    }`
                                  }
                                >
                                  {String(modalPersonaResult.impact).toUpperCase()}
                                </span>
                              </div>

                              {/* Good For / Bad For */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm font-medium mb-1">Good for</div>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {(modalPersonaResult.goodFor || []).length === 0 && <li className="text-muted-foreground">No clear beneficiaries</li>}
                                    {(modalPersonaResult.goodFor || []).map((g: string, i: number) => (
                                      <li key={`good-${i}`}>{g}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <div className="text-sm font-medium mb-1">Bad for</div>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {(modalPersonaResult.badFor || []).length === 0 && <li className="text-muted-foreground">No clear losers</li>}
                                    {(modalPersonaResult.badFor || []).map((b: string, i: number) => (
                                      <li key={`bad-${i}`}>{b}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Competitors */}
                              <div>
                                <div className="text-sm font-medium mb-1">Competitors</div>
                                {(modalPersonaResult.competitors || []).length === 0 ? (
                                  <div className="text-sm text-muted-foreground">No competitors identified</div>
                                ) : (
                                  <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-left text-xs text-muted-foreground">
                                          <th className="pb-1">Name</th>
                                          <th className="pb-1">Effect</th>
                                          <th className="pb-1">Reason</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(modalPersonaResult.competitors || []).map((c: any, i: number) => (
                                          <tr key={`comp-${i}`} className="align-top border-t">
                                            <td className="py-2 pr-4 font-medium">{c.name}</td>
                                            <td className="py-2 pr-4">{c.effect}</td>
                                            <td className="py-2 text-muted-foreground">{c.reason}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* Recommendation & Steps */}
                              <div>
                                <div className="text-sm font-medium mb-1">Recommendation</div>
                                <div className="text-sm">{modalPersonaResult.recommendation}</div>
                                <div className="text-sm font-medium mt-2 mb-1">Suggested steps</div>
                                <ol className="list-decimal list-inside text-sm space-y-1">
                                  {(modalPersonaResult.steps || []).length === 0 && <li className="text-muted-foreground">No specific steps suggested</li>}
                                  {(modalPersonaResult.steps || []).map((s: string, i: number) => (
                                    <li key={`step-${i}`}>{s}</li>
                                  ))}
                                </ol>
                              </div>

                              {/* Confidence */}
                              <div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Confidence</span>
                                  <span>{(modalPersonaResult.confidence ?? 0)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded h-2 mt-1 overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, modalPersonaResult.confidence ?? 0)}%` }} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show raw fallback if model returned non-JSON or error */}
                          {!modalPersonaLoading && modalPersonaResult && modalPersonaResult.error && (
                            <div className="text-sm text-destructive">{modalPersonaResult.error}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end mt-4">
                        <Button variant="ghost" onClick={() => { setModalArticle(null); setModalResult(null); setModalError(null) }} disabled={modalLoading}>Close</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                      (filteredArticles.filter((a) => a.category === category).reduce((sum, a) => sum + (a.significance || 0), 0) / (count || 1)) || 0
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
