"use client"
import { useEffect, useState } from "react"
import { NewsArticle } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react"

export function SectorWatch({ focusArea, onArticleSelect }: { focusArea: string, onArticleSelect: (article: NewsArticle) => void }) {
    const [articles, setArticles] = useState<NewsArticle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/news?persona=Professional&focusArea=${encodeURIComponent(focusArea)}`)
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

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    if (articles.length === 0) return <div className="text-center p-12 text-muted-foreground">No sector intelligence found.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Market Intelligence: {focusArea}
                </h3>
                <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-200">Live Feed</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, i) => (
                    <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 cursor-pointer" onClick={() => onArticleSelect(article)}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="text-[10px]">{article.source.name}</Badge>
                                <span className="text-[10px] text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <CardTitle className="text-base font-bold leading-snug group-hover:text-green-700 transition-colors line-clamp-3">
                                <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{article.description}</p>
                            <div className="flex items-center gap-2 mt-auto">
                                {article.significance && article.significance > 7 && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">High Impact</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
