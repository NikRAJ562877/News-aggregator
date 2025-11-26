"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KnowledgeGraph } from "./knowledge-graph"
import { StrategicAdvisor } from "./strategic-advisor"
import { SectorWatch } from "./sector-watch"
import { InnovationRadar } from "./innovation-radar"
import { fetchAnalysisWithRetry } from "@/lib/analyzeUtils"
import { NewsArticle } from "@/lib/types"
import { ArrowRight, BarChart3, Globe, Network, Zap, ExternalLink, Loader2, TrendingUp } from "lucide-react"
import { TypingAnimator } from "../typing-animator"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Helper component for fetching timeline links
function TimelineLink({ event, date, isLast, articleUrl }: { event: string, date: string, isLast: boolean, articleUrl?: string }) {
    const [linkData, setLinkData] = useState<{ url: string, title: string, source: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (isLast && articleUrl) {
            setLoading(false)
            return
        }

        const fetchLink = async () => {
            try {
                const query = `${event} ${date} news`
                const res = await fetch(`/api/search-link?query=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setLinkData(data)
                } else {
                    setError(true)
                }
            } catch (e) {
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchLink()
    }, [event, date, isLast, articleUrl])

    // Fallback URL (DuckDuckGo)
    const ddgUrl = `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(event + " " + date + " news")}`

    if (isLast && articleUrl) {
        return (
            <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-medium flex items-center gap-1 shrink-0 transition-colors text-primary hover:text-primary/80"
                title="Read Original Article"
            >
                Read Article <ArrowRight className="h-3 w-3" />
            </a>
        )
    }

    if (loading) {
        return <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Finding source...</span>
    }

    if (error || !linkData) {
        return (
            <a
                href={ddgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-medium text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0 transition-colors"
                title="Search for this event"
            >
                Source <ArrowRight className="h-3 w-3" />
            </a>
        )
    }

    return (
        <a
            href={linkData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 transition-colors max-w-[150px] truncate"
            title={linkData.title}
        >
            {linkData.source} <ExternalLink className="h-3 w-3" />
        </a>
    )
}

export function StrategicDashboard() {
    const auth = useAuth()
    const [spotlightData, setSpotlightData] = useState<{ topic: string; articles: NewsArticle[] }[]>([])
    const [sourceData, setSourceData] = useState<{ name: string; count: number }[]>([])
    const [loadingSpotlight, setLoadingSpotlight] = useState(true)

    // Deep Dive State
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const [analyzing, setAnalyzing] = useState(false)

    useEffect(() => {
        fetch("/api/dashboard-data")
            .then(res => res.json())
            .then(data => {
                if (data.topics) setSpotlightData(data.topics)
                if (data.sources) setSourceData(data.sources)
                setLoadingSpotlight(false)
            })
            .catch(err => {
                console.error(err)
                setLoadingSpotlight(false)
            })
    }, [])

    const handleDeepDive = async (article: NewsArticle, analysisType: 'general' | 'innovation' | 'sector' = 'general') => {
        setSelectedArticle(article)
        setAnalyzing(true)
        setAnalysisResult(null)
        try {
            const result = await fetchAnalysisWithRetry(article, 3, 1000, undefined, analysisType)
            setAnalysisResult(result)
        } catch (error) {
            console.error("Deep dive failed", error)
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 text-foreground/90">
                            <Globe className="h-10 w-10 text-primary" />
                            Strategic Command Center
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2 font-light">
                            Daily Intelligence Briefing • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Global Risk Level</span>
                            <span className="text-base font-bold text-amber-500 flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full mt-1">
                                <Zap className="h-4 w-4" /> ELEVATED
                            </span>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="global" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-muted/20">
                        <TabsTrigger value="global" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                            Global Briefing
                        </TabsTrigger>
                        {(auth.user?.persona === 'Professional' || auth.user?.persona === 'Executive') && (
                            <TabsTrigger value="sector" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                                Sector Watch {auth.user?.focusArea && `(${auth.user.focusArea})`}
                            </TabsTrigger>
                        )}
                        {auth.user?.persona === 'Executive' && (
                            <TabsTrigger value="innovation" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
                                Innovation Radar
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="global" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Row 1: Personal Intel & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <Card className="md:col-span-1 bg-card/50 border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Source Intelligence</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingSpotlight ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted/20 animate-pulse rounded" />)}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                {sourceData.slice(0, 5).map((source, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="font-medium truncate max-w-[120px]">{source.name}</span>
                                                            <span className="text-muted-foreground">{source.count}</span>
                                                        </div>
                                                        <Progress value={(source.count / (sourceData[0]?.count || 1)) * 100} className="h-1.5" />
                                                    </div>
                                                ))}
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="w-full text-xs h-7">
                                                        See All Sources
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Global Intelligence Sources</DialogTitle>
                                                        <DialogDescription>
                                                            Breakdown of news sources currently active in the global feed.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                        {sourceData.map((source, i) => (
                                                            <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/40">
                                                                <span className="font-medium text-sm">{source.name}</span>
                                                                <Badge variant="secondary" className="text-xs">{source.count}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-3 border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Dossier Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4">
                                    <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
                                        <div className="text-2xl font-bold text-foreground">{auth.user?.savedArticles.length || 0}</div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Files Saved</div>
                                    </div>
                                    <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
                                        <div className="text-2xl font-bold text-foreground">
                                            {auth.user?.savedArticles.length ?
                                                Object.entries(auth.user.savedArticles.reduce((acc, a) => {
                                                    acc[a.category || 'General'] = (acc[a.category || 'General'] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0][0]
                                                : 'N/A'}
                                        </div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Top Category</div>
                                    </div>
                                    <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
                                        <div className="text-2xl font-bold text-foreground">{auth.user?.stats.articlesAnalyzed || 0}</div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Deep Dives</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Row 2: Mission Dossier (Saved Articles) */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold flex items-center gap-3">
                                <TypingAnimator text="Mission Dossier" />
                                <Badge variant="secondary" className="ml-2 font-normal text-xs px-2 py-0.5">Classified</Badge>
                            </h2>

                            {auth.user?.savedArticles.length === 0 ? (
                                <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border">
                                    <p className="text-muted-foreground">No classified files found.</p>
                                    <Button variant="link" onClick={() => window.location.href = '/demo'} className="mt-2">
                                        Return to Intel Feed to save articles
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Card className="col-span-2 overflow-hidden border-none shadow-lg ring-1 ring-border/50 bg-card/50">
                                        <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                                            <CardTitle className="flex justify-between items-center text-xl">
                                                <span className="font-bold text-foreground/90">Saved Intelligence</span>
                                                <Badge variant="outline">{auth.user?.savedArticles.length} Files</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {auth.user?.savedArticles.map((article, i) => (
                                                <div key={i} className="group/article cursor-pointer p-4 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-all" onClick={() => handleDeepDive(article)}>
                                                    <h4 className="text-base font-medium group-hover/article:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                                                        {article.title}
                                                    </h4>
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                                                        <span className="bg-muted px-2 py-0.5 rounded">{article.source.name}</span>
                                                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>

                        {/* Row 3: Deep Dive / Knowledge Graph */}
                        <div id="deep-dive" className="scroll-mt-24">
                            <Card className="border-none shadow-xl ring-1 ring-border/60 bg-card/80 backdrop-blur-sm">
                                <CardHeader className="border-b border-border/40 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <Network className="h-6 w-6 text-indigo-500" />
                                        Deep Dive Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    {!selectedArticle ? (
                                        <div className="text-center py-20 text-muted-foreground/60">
                                            <Network className="h-16 w-16 mx-auto mb-6 opacity-10" />
                                            <p className="text-lg font-light">Select an article from the Topic Spotlight above to generate a Knowledge Graph.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* Article Header */}
                                            <div className="max-w-4xl">
                                                <h3 className="text-3xl font-bold leading-tight text-foreground/90">{selectedArticle.title}</h3>
                                                <p className="text-lg text-muted-foreground mt-3 leading-relaxed">{selectedArticle.description}</p>
                                            </div>

                                            {analyzing ? (
                                                <div className="w-full h-[500px] bg-muted/5 flex flex-col items-center justify-center rounded-xl border border-dashed border-border">
                                                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                                    <p className="text-base text-muted-foreground font-medium animate-pulse">Synthesizing Intelligence...</p>
                                                </div>
                                            ) : analysisResult ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom duration-700">

                                                    {/* Left Column: Timeline & Scenarios (4 cols) */}
                                                    <div className="lg:col-span-4 space-y-8">
                                                        {/* Timeline */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500" /> Historical Timeline
                                                            </h4>
                                                            <div className="relative border-l-2 border-muted ml-3 space-y-6 pl-6 py-2">
                                                                {analysisResult.timeline?.map((item: any, idx: number) => {
                                                                    const isLast = idx === (analysisResult.timeline?.length || 0) - 1

                                                                    return (
                                                                        <div key={idx} className="relative">
                                                                            <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-background ${isLast ? "bg-primary animate-pulse" : "bg-blue-500"}`} />
                                                                            <span className={`text-xs font-mono px-2 py-0.5 rounded mb-1 inline-block ${isLast ? "text-primary bg-primary/10 font-bold" : "text-blue-600 bg-blue-50"}`}>
                                                                                {item.date}
                                                                            </span>
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <p className={`text-sm leading-snug ${isLast ? "font-medium text-foreground" : "text-foreground/80"}`}>{item.event}</p>
                                                                                <TimelineLink
                                                                                    event={item.event}
                                                                                    date={item.date}
                                                                                    isLast={isLast}
                                                                                    articleUrl={selectedArticle?.url}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Scenarios */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-purple-500" /> Future Scenarios
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {analysisResult.scenarios?.map((scenario: any, idx: number) => (
                                                                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-sm font-bold text-foreground/90">{scenario.outcome}</span>
                                                                            <Badge variant={scenario.probability === 'High' ? 'default' : 'secondary'} className="text-[10px]">
                                                                                {scenario.probability} Prob
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Knowledge Graph & Advisor (8 cols) */}
                                                    <div className="lg:col-span-8 space-y-8">
                                                        <div className="h-[500px] rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden relative">
                                                            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border shadow-sm">
                                                                Interactive Knowledge Graph
                                                            </div>
                                                            <KnowledgeGraph data={analysisResult.graph_data} />
                                                        </div>

                                                        {/* Strategic Advisor */}
                                                        <StrategicAdvisor />
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sector" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {auth.user?.focusArea ? (
                            <SectorWatch focusArea={auth.user.focusArea} onArticleSelect={handleDeepDive} />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Please configure your target sector in settings.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="innovation" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {auth.user?.focusArea ? (
                            <InnovationRadar focusArea={auth.user.focusArea} onArticleSelect={handleDeepDive} />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Please configure your strategic industry in settings.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
