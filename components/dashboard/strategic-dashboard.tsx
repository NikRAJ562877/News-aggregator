"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KnowledgeGraph } from "./knowledge-graph"
import { fetchAnalysisWithRetry } from "@/lib/analyzeUtils"
import { NewsArticle } from "@/lib/types"
import { ArrowRight, BarChart3, Globe, Network, Zap } from "lucide-react"
import { TypingAnimator } from "../typing-animator"

export function StrategicDashboard() {
    const auth = useAuth()
    const [spotlightData, setSpotlightData] = useState<{ topic: string; articles: NewsArticle[] }[]>([])
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
                setLoadingSpotlight(false)
            })
            .catch(err => {
                console.error(err)
                setLoadingSpotlight(false)
            })
    }, [])

    const handleDeepDive = async (article: NewsArticle) => {
        setSelectedArticle(article)
        setAnalyzing(true)
        setAnalysisResult(null)
        try {
            const result = await fetchAnalysisWithRetry(article)
            setAnalysisResult(result)
        } catch (error) {
            console.error("Deep dive failed", error)
        } finally {
            setAnalyzing(false)
        }
    }

    return (
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

            {/* Row 1: Personal Intel & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <Card className="md:col-span-1 bg-card/50 border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Intelligence Gathered</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary">{auth.user?.stats.totalArticlesViewed || 0}</div>
                        <p className="text-sm text-muted-foreground mt-2">Articles analyzed this session</p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-medium">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Reading Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[120px] w-full bg-muted/5 rounded-lg flex items-end justify-between px-6 pb-4 gap-3">
                            {[40, 25, 60, 30, 80, 45, 20, 55, 70, 35, 50, 65].map((h, i) => (
                                <div key={i} className="w-full bg-primary/20 hover:bg-primary/50 transition-all duration-300 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Topic Spotlight */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-3">
                    <TypingAnimator text="Topic Spotlight" />
                    <Badge variant="secondary" className="ml-2 font-normal text-xs px-2 py-0.5">AI Curated</Badge>
                </h2>

                {loadingSpotlight ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map(i => <div key={i} className="h-72 bg-muted/20 animate-pulse rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {spotlightData.map((group, idx) => (
                            <Card key={idx} className="overflow-hidden border-none shadow-lg ring-1 ring-border/50 group hover:ring-primary/30 transition-all duration-300">
                                <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                                    <CardTitle className="flex justify-between items-center text-xl">
                                        <span className="font-bold text-foreground/90">{group.topic}</span>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    {group.articles.map((article, i) => (
                                        <div key={i} className="group/article cursor-pointer" onClick={() => handleDeepDive(article)}>
                                            <h4 className="text-base font-medium group-hover/article:text-primary transition-colors line-clamp-1 leading-snug">
                                                {article.title}
                                            </h4>
                                            <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                                                <span className="bg-muted px-2 py-0.5 rounded">{article.source.name}</span>
                                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
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
                                                    {analysisResult.timeline?.map((item: any, idx: number) => (
                                                        <div key={idx} className="relative">
                                                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-background bg-blue-500" />
                                                            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1 inline-block">{item.date}</span>
                                                            <p className="text-sm text-foreground/80 leading-snug">{item.event}</p>
                                                        </div>
                                                    ))}
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

                                        {/* Right Column: Knowledge Graph (8 cols) */}
                                        <div className="lg:col-span-8">
                                            <div className="h-full min-h-[500px] rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden relative">
                                                <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border shadow-sm">
                                                    Interactive Knowledge Graph
                                                </div>
                                                <KnowledgeGraph data={analysisResult.graph_data} />
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
