"use client"
import { useEffect, useState } from "react"
import { NewsArticle } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Radio, Zap } from "lucide-react"

export function InnovationRadar({ focusArea, onArticleSelect }: { focusArea: string, onArticleSelect: (article: NewsArticle) => void }) {
    const [articles, setArticles] = useState<NewsArticle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/news?persona=Executive&focusArea=${encodeURIComponent(focusArea)}`)
                const data = await res.json()
                if (data.articles) setArticles(data.articles)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        if (focusArea) fetchNews()
    }, [focusArea])

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>

    if (articles.length === 0) return <div className="text-center p-12 text-muted-foreground">No innovation signals detected.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Radio className="h-5 w-5 text-purple-500" />
                    Innovation Radar: {focusArea}
                </h3>
                <Badge variant="outline" className="text-purple-600 bg-purple-500/10 border-purple-200 animate-pulse">Scanning</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.map((article, i) => (
                    <Card key={i} className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-purple-50/50 border-purple-100 dark:border-purple-900/20 cursor-pointer" onClick={() => onArticleSelect(article)}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-700">{article.source.name}</Badge>
                                <span className="text-[10px] text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <CardTitle className="text-lg font-bold leading-snug group-hover:text-purple-700 transition-colors">
                                <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{article.description}</p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800 hover:bg-purple-200">
                                    <Zap className="h-3 w-3 mr-1" /> Disruption Signal
                                </Badge>
                                {article.category === 'Innovation' && (
                                    <Badge variant="secondary" className="text-[10px]">Strategic Tech</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
