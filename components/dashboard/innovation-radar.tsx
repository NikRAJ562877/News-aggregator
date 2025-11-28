"use client"
import { useEffect, useState } from "react"
import { NewsArticle } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Radio, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { fetchAnalysisWithRetry } from "@/lib/analyzeUtils"

export function InnovationRadar({ focusArea, onArticleSelect }: { focusArea: string, onArticleSelect: (article: NewsArticle, analysisType?: 'general' | 'innovation' | 'sector') => void }) {
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
                const res = await fetch(`/api/news?persona=Executive&focusArea=${encodeURIComponent(focusArea)}`)
                const data = await res.json()
                if (data.articles) {
                    setArticles(data.articles)
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
            const result = await fetchAnalysisWithRetry(article, 3, 1000, undefined, 'innovation')
            setPopupAnalysis(result)
        } catch (error) {
            console.error("Analysis failed", error)
        } finally {
            setAnalyzing(false)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>

    if (articles.length === 0) return <div className="text-center p-12 text-muted-foreground">No innovation signals detected.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-slate-100">
                    <Radio className="h-5 w-5 text-purple-400" />
                    Innovation Radar: {focusArea}
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.map((article, i) => {
                    return (
                        <Card key={i} className="group hover:shadow-2xl transition-all duration-300 bg-slate-900/50 border-slate-800 hover:border-purple-500/50 cursor-pointer backdrop-blur-sm" onClick={() => handleCardClick(article)}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">{article.source.name}</Badge>
                                    <span className="text-[10px] text-slate-500">{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <CardTitle className="text-lg font-bold leading-snug text-slate-200 group-hover:text-purple-400 transition-colors">
                                    {article.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-400 line-clamp-3 mb-4">{article.description}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
                <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-purple-400 flex items-center gap-2">
                            <Zap className="h-5 w-5" /> Founder Intelligence
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {selectedArticle?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                            <p className="text-sm text-slate-400 animate-pulse">Analyzing for investment potential...</p>
                        </div>
                    ) : popupAnalysis?.founder_lens ? (
                        <div className="space-y-6 mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/20">
                                    <div className="text-xs text-purple-300 uppercase font-bold tracking-wider mb-1">M&A Verdict</div>
                                    <div className="text-xl font-black text-white">{popupAnalysis.founder_lens.ma_verdict}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Synergy</div>
                                    <div className="text-xl font-black text-white">{popupAnalysis.founder_lens.synergy_score}<span className="text-sm text-slate-500 font-normal">/10</span></div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Moat</div>
                                    <div className="text-lg font-bold text-white">{popupAnalysis.founder_lens.tech_moat}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Risk</div>
                                    <div className="text-lg font-bold text-white">{popupAnalysis.scenarios?.[0]?.probability || 'Medium'}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-200">Investment Thesis</h4>
                                <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                    {popupAnalysis.analysis}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-200">Competitors</h4>
                                <div className="flex flex-wrap gap-2">
                                    {popupAnalysis.founder_lens.competitors?.map((c: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">{c}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            Unable to generate founder intelligence.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
