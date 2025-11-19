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
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { useRouter, useSearchParams } from "next/navigation"
import { NewsArticle } from "@/lib/types"
import { isCompleteAnalysis, fetchAnalysisWithRetry } from "@/lib/analyzeUtils"

export default function NewsAggregator() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams?.get("view")
  const isDashboardView = view === "dashboard"
  const auth = useAuth()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)
  const [selectedStrengthParam, setSelectedStrengthParam] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [strongCountryCache, setStrongCountryCache] = useState<Record<string, Record<string, string[]>>>({})
  const [strongParams, setStrongParams] = useState<string[] | null>(null)
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
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([])
  const [relatedArticlesLoading, setRelatedArticlesLoading] = useState<boolean>(false)
  const [modalTab, setModalTab] = useState<'summary' | 'related'>('summary')
  const analysisCacheRef = useMemo(() => new Map<string, any>(), [])
  const [hoverRegion, setHoverRegion] = useState<string | null>(null)
  const [hoverCountry, setHoverCountry] = useState<string | null>(null)
  const articlesByCountry = useMemo(() => {
    const map: Record<string, { title: string; url: string }[]> = {}
    const textIncludes = (txt: string, needle: string) => txt.toLowerCase().includes(needle.toLowerCase())
    const getText = (a: NewsArticle) => `${a.title} ${(a.description || '')} ${(a.content || '')}`
    const countries = [
      'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Chile', 'Venezuela', 'Russia', 'Germany', 'France', 'Italy', 'United Kingdom', 'Poland', 'Turkey', 'China', 'India', 'Indonesia', 'Pakistan', 'Bangladesh', 'Japan', 'South Korea', 'Thailand', 'Iran', 'Israel', 'Qatar', 'Saudi Arabia', 'United Arab Emirates', 'Nigeria', 'Ethiopia', 'Egypt', 'Kenya', 'South Africa', 'Algeria', 'Australia', 'New Zealand'
    ]
    for (const c of countries) map[c] = []
    for (const a of articles) {
      const txt = getText(a)
      for (const c of countries) {
        if (textIncludes(txt, c)) {
          map[c].push({ title: a.title, url: a.url })
        }
      }
    }

    return map
  }, [articles])

  // Categories derived from articles (simple fallback)
  const categories = useMemo(() => {
    const set = new Set<string>()
    set.add("all")
    for (const a of articles) {
      if (a.category) set.add(a.category)
    }
    return Array.from(set)
  }, [articles])

  // Fetch articles initially
  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/news')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        const payload = Array.isArray(data) ? data : data.articles || []
        setArticles(payload)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  // Filter articles when filters/search change
  useEffect(() => {
    let f = [...articles]
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      f = f.filter((a) => (`${a.title} ${a.description || ''} ${a.content || ''}`).toLowerCase().includes(term))
    }
    if (selectedCategory && selectedCategory !== 'all') {
      f = f.filter((a) => a.category === selectedCategory)
    }
    if (selectedCountry) {
      const urls = new Set((articlesByCountry[selectedCountry] || []).map((x) => x.url))
      f = f.filter((a) => urls.has(a.url))
    }
    setFilteredArticles(f)
  }, [articles, searchTerm, selectedCategory, selectedCountry, articlesByCountry])

  // Basic stubs for analyze / persona /bulk-check to keep the page interactive
  const handleAnalyze = async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalError(null)
    setRelatedArticles([])
    setRelatedArticlesLoading(true)

    // Check client-side cache first
    const cacheKey = article.url || `${article.title}:${article.publishedAt}`
    if (analysisCacheRef.has(cacheKey)) {
      const cached = analysisCacheRef.get(cacheKey)
      setModalResult(cached)
      setArticles((prev) => prev.map((a) => (a.url === article.url ? { ...a, significance: cached.significance ?? a.significance, category: cached.category ?? a.category, region: cached.region ?? a.region, analysis: cached.analysis ?? a.analysis } : a)))
      setModalLoading(false)
    } else {
      // Call the analysis API with retry logic
      try {
        // Attempt to get key count and pick a keyIndex to spread load a bit for single-article analyzes
        let keyIndex: number | undefined = undefined
        try {
          const keyInfoRes = await fetch('/api/key-info')
          const keyInfo = await keyInfoRes.json()
          const numKeys = keyInfo?.count > 0 ? keyInfo.count : 1
          keyIndex = Math.floor(Math.random() * numKeys)
        } catch (e) {
          // ignore and let server rotate keys
          keyIndex = undefined
        }

        const analysis = await fetchAnalysisWithRetry(article, 4, 800, keyIndex)
        setModalResult(analysis)
        analysisCacheRef.set(cacheKey, analysis)
        // Update article with returned analysis (if present)
        setArticles((prev) =>
          prev.map((a) => (a.url === article.url ? { ...a, significance: analysis.significance ?? a.significance, category: analysis.category ?? a.category, region: analysis.region ?? a.region, analysis: analysis.analysis ?? a.analysis } : a)),
        )
      } catch (error) {
        console.error('Analysis failed after retries:', error)
        setModalError('Unable to analyze article')

        // Fallback mock result so UI remains informative
        const fallback = {
          significance: Math.floor(Math.random() * 8) + 3,
          category: article.category || 'General',
          region: article.region || 'Global',
          analysis: 'Mock analysis generated for demo purposes.',
        }
        setModalResult(fallback)
        setArticles((prev) => prev.map((a) => (a.url === article.url ? { ...a, significance: fallback.significance } : a)))
        analysisCacheRef.set(cacheKey, fallback)
      } finally {
        setModalLoading(false)
      }
    }

    // Fetch related articles in parallel (non-blocking for the main analysis)
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

  const evaluatePersona = async () => {
    if (!modalArticle || !modalPersonaTarget) return
    setModalPersonaLoading(true)
    try {
      const res = await fetch('/api/persona-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCountry: modalPersonaTarget, article: modalArticle }),
      })
      const data = await res.json()
      if (data?.error) {
        setModalPersonaResult({ error: data.error, raw: data.raw || null })
      } else {
        setModalPersonaResult(data)
      }
    } catch (e) {
      console.error('Persona evaluate failed:', e)
      setModalPersonaResult({ error: 'Persona evaluation failed' })
    } finally {
      setModalPersonaLoading(false)
    }
  }


  // Continent → Parameter → Countries configuration (curated lists)
  const continentsConfig: Record<string, Record<string, string[]>> = {
    "Asia": {
      "High Population": ["China", "India", "Indonesia", "Pakistan", "Bangladesh"],
      "Army Strong": ["China", "India", "South Korea", "Japan"],
      "Political Shift": ["India", "Pakistan", "Thailand", "Bangladesh"],
      "Diplomatic Strong": ["China", "India", "Japan", "South Korea"],
    },
    "Europe": {
      "High Population": ["Russia", "Germany", "United Kingdom", "France", "Italy"],
      "Army Strong": ["Russia", "France", "United Kingdom", "Turkey", "Germany"],
      "Political Shift": ["United Kingdom", "France", "Germany", "Poland", "Italy"],
      "Diplomatic Strong": ["France", "Germany", "United Kingdom", "Russia"],
    },
    "North America": {
      "High Population": ["United States", "Mexico", "Canada"],
      "Army Strong": ["United States", "Canada"],
      "Political Shift": ["United States", "Mexico"],
      "Diplomatic Strong": ["United States", "Canada", "Mexico"],
    },
    "South America": {
      "High Population": ["Brazil", "Argentina", "Colombia"],
      "Army Strong": ["Brazil", "Argentina", "Chile"],
      "Political Shift": ["Brazil", "Argentina", "Venezuela"],
      "Diplomatic Strong": ["Brazil", "Argentina", "Chile"],
    },
    "Africa": {
      "High Population": ["Nigeria", "Ethiopia", "Egypt", "South Africa"],
      "Army Strong": ["Egypt", "Algeria", "Nigeria", "South Africa"],
      "Political Shift": ["Nigeria", "Ethiopia", "Kenya"],
      "Diplomatic Strong": ["South Africa", "Egypt", "Nigeria", "Kenya"],
    },
    "Middle East": {
      "High Population": ["Turkey", "Iran", "Saudi Arabia"],
      "Army Strong": ["Turkey", "Iran", "Saudi Arabia", "Israel"],
      "Political Shift": ["Israel", "Iran", "Saudi Arabia"],
      "Diplomatic Strong": ["Saudi Arabia", "United Arab Emirates", "Qatar", "Turkey"],
    },
    "Oceania": {
      "High Population": ["Australia", "Papua New Guinea"],
      "Army Strong": ["Australia"],
      "Political Shift": ["Australia"],
      "Diplomatic Strong": ["Australia", "New Zealand"],
    },
  }

  const defaultStrengthParameters = [
    "High Population",
    "Army Strong",
    "Political Shift",
    "Diplomatic Strong",
  ]

  const CONTINENTS = [
    "Asia",
    "Europe",
    "North America",
    "South America",
    "Africa",
    "Middle East",
    "Oceania",
  ]

  const ensureStrongCountries = async (continent: string) => {
    if (strongCountryCache[continent]) return
    try {
      const res = await fetch(`/api/strong-countries?continent=${encodeURIComponent(continent)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed strong-countries fetch')
      const data = await res.json()
      setStrongCountryCache((prev) => ({ ...prev, [continent]: data.parameters || {} }))
      if (Array.isArray(data.params) && data.params.length > 0) setStrongParams(data.params)
    } catch {
      // silently fall back to curated config
    }
  }

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
            <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <TypingAnimator text="Strategic Intelligence Hub" className="text-4xl font-bold" />
              </div>
              <p className="text-muted-foreground mt-1">AI-Powered Geopolitical News Analysis</p>
            </div>
            <div className="flex items-center gap-4">

              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard for logged-in users (real-time data from AuthProvider) */}
      {auth.user && isDashboardView && (
        <DashboardView />
      )}

      {/* Main news UI (only when not viewing dashboard) */}
      {!isDashboardView && (
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

                {/* Persona select removed from filters (moved to per-article modal) */}

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")

                    setSelectedContinent(null)
                    setSelectedStrengthParam(null)
                    setSelectedCountry(null)
                  }}
                >
                  Clear Filters
                </Button>

                {/* Per-article analysis modal (opened when clicking Analyze on a card) */}
                {modalArticle && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => { if (!modalLoading) { setModalArticle(null); setModalResult(null); setModalError(null); setModalTab('summary') } }} />
                    <div className="bg-card rounded-md shadow-lg max-w-4xl w-full p-6 z-10 max-h-[85vh] flex flex-col">
                      {/* Header */}
                      <div className="mb-4 pb-4 border-b">
                        <h3 className="text-lg font-semibold">Article Analysis</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{modalArticle.title}</p>
                      </div>

                      {/* Tab Buttons */}
                      <div className="flex gap-2 mb-4 border-b">
                        <button
                          onClick={() => setModalTab('summary')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${modalTab === 'summary'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          Summary
                        </button>
                        <button
                          onClick={() => setModalTab('related')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${modalTab === 'related'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          Related Articles
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="flex-1 overflow-auto">
                        {/* Summary Tab */}
                        {modalTab === 'summary' && (
                          <div className="space-y-4">
                            {modalLoading && <div className="text-sm">Analyzing article…</div>}
                            {modalError && <div className="text-sm text-destructive">{modalError}</div>}
                            {!modalLoading && modalResult && (
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-muted/40 p-3 rounded">
                                    <div className="text-xs text-muted-foreground mb-1">Significance</div>
                                    <div className="text-2xl font-bold">{modalResult.significance ?? 'N/A'}<span className="text-sm">/10</span></div>
                                  </div>
                                  <div className="bg-muted/40 p-3 rounded">
                                    <div className="text-xs text-muted-foreground mb-1">Category</div>
                                    <div className="font-semibold text-base">{modalResult.category ?? 'N/A'}</div>
                                  </div>
                                  <div className="bg-muted/40 p-3 rounded">
                                    <div className="text-xs text-muted-foreground mb-1">Region</div>
                                    <div className="font-semibold text-base">{modalResult.region ?? 'N/A'}</div>
                                  </div>
                                </div>

                                <div>
                                  <div className="font-semibold mb-2">Analysis</div>
                                  <div className="text-muted-foreground bg-muted/20 p-3 rounded">{modalResult.analysis ?? 'No details'}</div>
                                </div>

                                {/* Persona evaluation input */}
                                <div className="pt-2 border-t">
                                  <label className="text-sm font-medium">Evaluate impact for a country (optional)</label>
                                  <Input
                                    id="modal-persona-input"
                                    placeholder="Enter country (e.g. United States)"
                                    className="mt-2"
                                    value={modalPersonaTarget}
                                    onChange={(e) => setModalPersonaTarget(e.target.value)}
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      onClick={evaluatePersona}
                                      disabled={modalPersonaLoading || !modalPersonaTarget || !modalArticle}
                                    >
                                      {modalPersonaLoading ? 'Evaluating...' : 'Evaluate for Country'}
                                    </Button>
                                  </div>

                                  {/* Persona Results */}
                                  {modalPersonaResult && (
                                    <div className="mt-3 text-sm max-h-64 overflow-auto bg-muted/10 p-3 rounded">
                                      {modalPersonaLoading && <div>Generating persona analysis…</div>}

                                      {!modalPersonaLoading && modalPersonaResult && !modalPersonaResult.error && (
                                        <div className="space-y-3">
                                          {/* Impact */}
                                          <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium">Impact:</span>
                                            <span
                                              className={
                                                `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${modalPersonaResult.impact === 'positive'
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
                                      {!modalPersonaLoading && modalPersonaResult.error && (
                                        <div className="text-xs text-destructive">{modalPersonaResult.error}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Related Articles Tab */}
                        {modalTab === 'related' && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">Related Articles (Past 10 Days)</h4>
                            {relatedArticlesLoading && <div className="text-xs text-muted-foreground">Loading...</div>}
                            {!relatedArticlesLoading && relatedArticles.length === 0 && (
                              <div className="text-xs text-muted-foreground">No related articles found</div>
                            )}
                            <div className="space-y-2">
                              {relatedArticles.map((article, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-muted/30 rounded text-xs cursor-pointer hover:bg-muted/60 transition border border-muted/40"
                                  onClick={() => window.open(article.url, "_blank")}
                                >
                                  <p className="font-medium line-clamp-2 mb-2">{article.title}</p>
                                  <div className="flex justify-between items-center text-muted-foreground">
                                    <p className="text-xs line-clamp-1">{article.source.name}</p>
                                    <p className="text-xs">
                                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setModalArticle(null)
                            setModalResult(null)
                            setModalError(null)
                            setModalTab('summary')
                          }}
                          disabled={modalLoading}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                  // </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* World Map */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">World Map</span>
              </CardTitle>
              <div className="mt-2 text-xs text-muted-foreground">Click a country marker to filter the articles below. Hover markers to preview headlines. Use trackpad/mouse to zoom & pan.</div>
            </CardHeader>
            <CardContent>
              <div className="w-full flex justify-center  items-center">
                <WorldMap
                  className="w-[80%] h-auto"
                  onHoverContinent={(c) => setHoverRegion(c)}
                  onHoverCountry={(c) => setHoverCountry(c)}
                  onClickCountry={(c) => {
                    setSelectedRegion('all')
                    setSelectedCountry(c)
                  }}
                  getArticlesForCountry={(c) => articlesByCountry[c] || []}
                />
              </div>
              <div className="mt-3">
                {selectedCountry && (
                  <Button size="sm" variant="secondary" onClick={() => setSelectedCountry(null)}>
                    Clear country selection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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
      )}
    </div>
  )
}


