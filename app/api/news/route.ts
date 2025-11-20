import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";
import type { NewsArticle } from "@/lib/types";

export const dynamic = 'force-dynamic';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function generateSearchQuery(topic: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" }) // Using a faster model for query generation
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
  const apiKey = process.env.NEWSAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "NewsAPI key is not configured" }, { status: 500 })
  }

  // Refined, objective categories
  const topics = ["military", "defense", "economics", "diplomacy", "technology", "energy"]
  const fromDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0] // 7 days ago

  try {
    const promises = topics.map(async (topic) => {
      const intelligentQuery = await generateSearchQuery(topic)
      console.log(`Generated Query for ${topic}: ${intelligentQuery}`) // For debugging

      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        intelligentQuery,
      )}&from=${fromDate}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`NewsAPI error for topic ${topic}:`, await response.text())
        return [] // Return empty array on error for this topic
      }

      const data = await response.json()
      // Tag each article with the topic it was fetched for
      return data.articles.map((article: any) => ({
        ...article,
        category: topic, // Assign the original, simple topic as the category
      }))
    })

    const results = await Promise.all(promises)
    const allArticles = results.flat()

    // Deduplicate articles based on URL
    const uniqueArticles = Array.from(new Map(allArticles.map((article) => [article.url, article])).values())

    // Add placeholder reliability data for demonstration
    const reliabilityLevels: NewsArticle['sourceReliability'][] = ['High', 'Medium', 'Low', 'Opinion', 'Satire']

    // Map to our NewsArticle type with region detection
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

    // Balance articles across regions - aim for ~10 total with 1-2 per region
    const regionGroups = new Map<string, typeof articlesWithRegion>()
    articlesWithRegion.forEach((article) => {
      if (!regionGroups.has(article.region)) {
        regionGroups.set(article.region, [])
      }
      regionGroups.get(article.region)!.push(article)
    })

    // Select up to 2 articles per region, aiming for ~10 total
    const balancedArticles: typeof articlesWithRegion = []
    const articlesPerRegion = 2
    regionGroups.forEach((regionArticles) => {
      // Sort by publishedAt (newest first) and take top 2
      const sorted = regionArticles.sort(
        (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
      )
      balancedArticles.push(...sorted.slice(0, articlesPerRegion))
    })

    // Sort final list by published date and limit to 10
    const articles: NewsArticle[] = balancedArticles
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
      .slice(0, 10)

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
