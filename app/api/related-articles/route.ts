import { type NextRequest, NextResponse } from "next/server"
import type { NewsArticle } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { article }: { article: NewsArticle } = await request.json()

    if (!article) {
      return NextResponse.json({ error: "Article content required" }, { status: 400 })
    }

    const newsApiKey = process.env.NEWSAPI_KEY
    if (!newsApiKey) {
      return NextResponse.json({ error: "NewsAPI key is not configured" }, { status: 500 })
    }

    // Build search query using article analysis fields + keywords for better topical relevance
    // Prioritize category/topic over generic keywords to avoid country-only matches
    const keywords: string[] = []
    
    // Add category if available (highest priority)
    if (article.category) {
      keywords.push(article.category)
    }
    
    // Extract important terms from title
    const titleTerms = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !['that', 'this', 'from', 'with', 'have', 'been', 'says', 'said', 'will', 'does', 'after'].includes(word))
      .slice(0, 4)
    keywords.push(...titleTerms)
    
    // Add key terms from description if available
    if (article.description) {
      const descTerms = article.description
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 4 && !['article', 'report', 'according', 'officials', 'source', 'which', 'could'].includes(word))
        .slice(0, 2)
      keywords.push(...descTerms)
    }
    
    const uniqueKeywords = [...new Set(keywords)].filter(Boolean)
    const searchQuery = uniqueKeywords.length > 0 
      ? uniqueKeywords.slice(0, 6).join(" OR ")
      : article.title // Fallback to full title if no keywords extracted

    // Fetch articles from last 10 days with similar keywords
    const fromDate = new Date(new Date().setDate(new Date().getDate() - 10))
      .toISOString()
      .split("T")[0]
    const toDate = new Date().toISOString().split("T")[0]

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      searchQuery,
    )}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&language=en&pageSize=8&apiKey=${newsApiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("NewsAPI error:", await response.text())
      return NextResponse.json({ articles: [] })
    }

    const data = await response.json()

    // Filter out the original article and return related ones
    const relatedArticles: NewsArticle[] = (data.articles || [])
      .filter((a: any) => a.url !== article.url)
      .slice(0, 6)
      .map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: {
          name: article.source.name,
        },
        content: article.content,
      }))

    return NextResponse.json({ articles: relatedArticles })
  } catch (error) {
    console.error("Related articles error:", error)
    return NextResponse.json({ articles: [] })
  }
}
