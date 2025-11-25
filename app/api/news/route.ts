import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";
import type { NewsArticle } from "@/lib/types";

export const dynamic = 'force-dynamic';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function generateSearchQuery(topic: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }) // Using a faster model for query generation
    const prompt = `Create a sophisticated, boolean-logic search query for NewsAPI to find articles about the geopolitical topic "${topic}". The query should be highly relevant and actively exclude common false positives. For example, for "defense", exclude sports. For "finance", focus on international economics, not personal finance. The query should be a single line of text. Example for 'military': ("military exercise" OR "troop deployment" OR "arms deal" OR "defense budget") AND NOT (sports OR game).`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    // Clean up the response to ensure it's a valid query string
    return text.trim().replace(/[\r\n]+/g, " ")
  } catch (error) {
    console.error(`Error generating query for topic ${topic}:`, error)
    // Fallback to a simple query if the LLM fails
    return `"${topic}"`
  }
}

// Simple continent/region detection using keywords from article fields.
// This is a heuristic to provide initial region tags (continents) so the UI
// can offer continent filters even before AI analysis runs. The AI analysis
// endpoint may later overwrite these values with more precise regions.
function detectRegion(article: any): string {
  const text = [article.title, article.description, article.content, article.source?.name, article.url]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const regionKeywords: { region: string; keywords: string[] }[] = [
    { region: 'North America', keywords: ['united states', 'usa', 'us ', 'canada', 'mexico'] },
    { region: 'South America', keywords: ['brazil', 'argentina', 'colombia', 'chile', 'peru'] },
    { region: 'Europe', keywords: ['united kingdom', 'uk', 'england', 'france', 'germany', 'spain', 'italy', 'europe', 'eu'] },
    { region: 'Asia', keywords: ['china', 'india', 'japan', 'korea', 'south korea', 'north korea', 'beijing', 'tokyo', 'seoul', 'asia'] },
    { region: 'Africa', keywords: ['nigeria', 'kenya', 'south africa', 'egypt', 'africa'] },
    { region: 'Oceania', keywords: ['australia', 'new zealand', 'oceania'] },
    { region: 'Middle East', keywords: ['middle east', 'saudi', 'iran', 'iraq', 'israel', 'palestine', 'u.a.e', 'uae'] },
    { region: 'Arctic', keywords: ['arctic'] },
    { region: 'Antarctica', keywords: ['antarctica'] },
  ]

  for (const entry of regionKeywords) {
    for (const kw of entry.keywords) {
      if (text.includes(kw)) return entry.region
    }
  }

  // If no keyword matched, try some fallback heuristics
  if (text.includes('european') || text.includes('european union') || text.includes('eu')) return 'Europe'
  if (text.includes('north america') || text.includes('canadian') || text.includes('american')) return 'North America'

  // Default to Global to indicate no continent-specific match; UI can still show "Global" option
  return 'Global'
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const persona = searchParams.get('persona')
  const focusArea = searchParams.get('focusArea')

  const newsApiKey = process.env.NEWSAPI_KEY
  const newsDataKey = process.env.NEWSDATA_API_KEY
  const googleKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_CUSTOM_SEARCH || process.env.GOOGLE_API_KEY
  const googleCx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CUSTOM_SEARCH_CX || process.env.GOOGLE_CX

  if (!newsApiKey) {
    return NextResponse.json({ error: "NewsAPI key is not configured" }, { status: 500 })
  }

  try {
    // --- EXECUTIVE PERSONA (Innovation Radar) ---
    if (persona === 'Executive' && focusArea && googleKey && googleCx) {
      console.log(`Fetching Innovation Radar for ${focusArea}`)
      const queries = [
        `"${focusArea}" (patent OR "new startup" OR "research breakthrough" OR "disruptive technology") -stock -market`,
        `"${focusArea}" future trends forecast 2025`
      ]

      const promises = queries.map(async q => {
        const url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCx}&q=${encodeURIComponent(q)}&num=5&dateRestrict=m1`
        const res = await fetch(url)
        if (!res.ok) return []
        const data = await res.json()
        return data.items || []
      })

      const results = (await Promise.all(promises)).flat()

      const articles: NewsArticle[] = results.map((item: any) => ({
        title: item.title,
        description: item.snippet,
        url: item.link,
        urlToImage: item.pagemap?.cse_image?.[0]?.src || null,
        publishedAt: new Date().toISOString(), // Google Search doesn't always give precise dates in snippet
        source: { name: item.displayLink },
        content: item.snippet,
        category: "Innovation",
        region: "Global",
        significance: 8, // High default for executive intel
        sourceReliability: "High"
      }))

      return NextResponse.json({ articles })
    }

    // --- PROFESSIONAL PERSONA (Sector Watch) ---
    if (persona === 'Professional' && focusArea && newsDataKey) {
      console.log(`Fetching Sector Watch for ${focusArea} via NewsData.io`)
      // NewsData.io allows category/q. We'll use 'q' for the focus area.
      const url = `https://newsdata.io/api/1/news?apikey=${newsDataKey}&q=${encodeURIComponent(focusArea)}&language=en`
      const res = await fetch(url)

      if (res.ok) {
        const data = await res.json()
        const articles: NewsArticle[] = data.results.map((item: any) => ({
          title: item.title,
          description: item.description,
          url: item.link,
          urlToImage: item.image_url,
          publishedAt: item.pubDate,
          source: { name: item.source_id },
          content: item.content,
          category: focusArea,
          region: "Global", // NewsData has country fields, could map later
          significance: 7,
          sourceReliability: "Medium"
        }))
        return NextResponse.json({ articles })
      } else {
        console.warn("NewsData.io failed, falling back to NewsAPI")
      }
    }

    // --- FALLBACK / CITIZEN / GLOBAL ---
    // If specific persona fetching failed or wasn't requested, use standard NewsAPI logic
    // But if focusArea is present (fallback for Pro), use it as query

    let topics = ["military", "defense", "economics", "diplomacy", "technology", "energy"]
    if (focusArea) {
      topics = [focusArea] // Narrow down to focus area if provided
    }

    const fromDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]

    const promises = topics.map(async (topic) => {
      const intelligentQuery = await generateSearchQuery(topic)
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        intelligentQuery,
      )}&from=${fromDate}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${newsApiKey}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`NewsAPI error for topic ${topic}:`, await response.text())
        return []
      }

      const data = await response.json()
      return data.articles.map((article: any) => ({
        ...article,
        category: topic,
      }))
    })

    const results = await Promise.all(promises)
    const allArticles = results.flat()
    const uniqueArticles = Array.from(new Map(allArticles.map((article) => [article.url, article])).values())
    const reliabilityLevels: NewsArticle['sourceReliability'][] = ['High', 'Medium', 'Low', 'Opinion', 'Satire']

    const articlesWithRegion = uniqueArticles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: {
        name: article.source.name,
      },
      content: article.content,
      category: article.category,
      significance: undefined,
      region: detectRegion(article),
      sourceReliability: reliabilityLevels[Math.floor(Math.random() * reliabilityLevels.length)],
    }))

    // If it's a specific focus area, we don't need to balance regions as strictly
    if (focusArea) {
      return NextResponse.json({ articles: articlesWithRegion.slice(0, 20) })
    }

    // Balance articles across regions for Global Feed
    const regionGroups = new Map<string, typeof articlesWithRegion>()
    articlesWithRegion.forEach((article) => {
      if (!regionGroups.has(article.region)) {
        regionGroups.set(article.region, [])
      }
      regionGroups.get(article.region)!.push(article)
    })

    const balancedArticles: typeof articlesWithRegion = []
    const articlesPerRegion = 2
    regionGroups.forEach((regionArticles) => {
      const sorted = regionArticles.sort(
        (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
      )
      balancedArticles.push(...sorted.slice(0, articlesPerRegion))
    })

    const articles: NewsArticle[] = balancedArticles
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
      .slice(0, 10)

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
