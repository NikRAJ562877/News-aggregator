
"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { NewsArticle } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react"
import { fetchAnalysisWithRetry } from "@/lib/analyzeUtils"

export function SectorWatch({ focusArea, onArticleSelect }: { focusArea: string, onArticleSelect: (article: NewsArticle, analysisType?: 'general' | 'innovation' | 'sector') => void }) {
    const [articles, setArticles] = useState<NewsArticle[]>([])
    const [analyses, setAnalyses] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)

    // Popup State
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
    const [popupAnalysis, setPopupAnalysis] = useState<any>(null)
    const [analyzing, setAnalyzing] = useState(false)

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/news?persona=Professional&focusArea=${encodeURIComponent(focusArea)}`)
                const data = await res.json()
                if (data.articles) {
                    setArticles(data.articles)
                    // Trigger batch analysis
                    fetch('/api/batch-analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ articles: data.articles.slice(0, 4) })
                    })
                        .then(r => r.json())
                        .then(analysisData => {
                            if (analysisData.analyses) {
                                const map: Record<string, any> = {}
                                analysisData.analyses.forEach((a: any) => map[a.url] = a)
                                setAnalyses(map)
                            }
                        })
                        .catch(console.error)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        if (focusArea) fetchNews()
    }, [focusArea])

    const handleCardClick = async (article: NewsArticle) => {
        setSelectedArticle(article)
        setAnalyzing(true)
        setPopupAnalysis(null)
        try {
            const result = await fetchAnalysisWithRetry(article, 3, 1000, undefined, 'sector')
            setPopupAnalysis(result)
        } catch (error) {
            console.error("Analysis failed", error)
        } finally {
            setAnalyzing(false)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

    if (articles.length === 0) return <div className="text-center p-12 text-muted-foreground">No sector intelligence found.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-slate-100">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Market Intelligence: {focusArea}
                </h3>
                <Badge variant="outline" className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30">Live Feed</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, i) => {
                    const analysis = analyses[article.url]
                    return (
                        <Card key={i} className="group hover:shadow-2xl transition-all duration-300 bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 cursor-pointer backdrop-blur-sm" onClick={() => handleCardClick(article)}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400">{article.source.name}</Badge>
                                    <span className="text-[10px] text-slate-500">{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <CardTitle className="text-base font-bold leading-snug text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-3">
                                    {article.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-slate-400 line-clamp-3 mb-3">{article.description}</p>
                                <div className="flex items-center gap-2 mt-auto">
                                    {analysis ? (
                                        <>
                                            <Badge variant="outline" className={`text - [10px] px - 1.5 py - 0 ${analysis.significance > 7 ? 'text-red-400 border-red-900 bg-red-900/20' : 'text-emerald-400 border-emerald-900 bg-emerald-900/20'} `}>
                                                {analysis.significance > 7 ? 'High Impact' : 'Stable'}
                                            </Badge>
                                            <span className="text-[10px] text-slate-500">{analysis.region}</span>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-slate-600 animate-pulse">Analyzing market impact...</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
                <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" /> Market Strategy
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {selectedArticle?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                            <p className="text-sm text-slate-400 animate-pulse">Synthesizing market signals...</p>
                        </div>
                    ) : popupAnalysis?.market_lens ? (
                        <div className="space-y-6 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                                    <div className="text-xs text-emerald-300 uppercase font-bold tracking-wider mb-1">Entry Signal</div>
                                    <div className={`text - xl font - black ${popupAnalysis.market_lens.entry_signal.includes('Green') ? 'text-emerald-400' : popupAnalysis.market_lens.entry_signal.includes('Red') ? 'text-red-400' : 'text-amber-400'} `}>
                                        {popupAnalysis.market_lens.entry_signal}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Competitive Threat</div>
                                    <div className="text-xl font-black text-white">{popupAnalysis.market_lens.competitive_threat}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Market Impact</div>
                                    <div className="text-xl font-black text-white">{popupAnalysis.significance}<span className="text-sm text-slate-500 font-normal">/10</span></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-200">Strategic Opportunity</h4>
                                <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                    {popupAnalysis.market_lens.opportunity}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-200">Outlook</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {popupAnalysis.analysis}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            Unable to generate market strategy.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

