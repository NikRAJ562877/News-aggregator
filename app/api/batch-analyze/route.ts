import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { NewsArticle } from "@/lib/types"

// Discover all Gemini API keys
const geminiApiKeys: string[] = Object.keys(process.env)
  .filter((k) => k.startsWith("GEMINI_API_KEY"))
  .map((k) => process.env[k] as string)
  .filter(Boolean)

// Distribute articles evenly across available keys
async function analyzeArticlesWithKeyDistribution(articles: NewsArticle[]): Promise<any[]> {
  if (geminiApiKeys.length === 0) {
    throw new Error("No Gemini API keys configured")
  }

  const numKeys = geminiApiKeys.length
  const articlesPerKey = Math.ceil(articles.length / numKeys)

  // Create groups of articles, one group per key
  const articleGroups: NewsArticle[][] = []
  for (let i = 0; i < numKeys; i++) {
    const start = i * articlesPerKey
    const end = Math.min(start + articlesPerKey, articles.length)
    if (start < articles.length) {
      articleGroups.push(articles.slice(start, end))
    }
  }

  console.log(`Distributing ${articles.length} articles across ${numKeys} keys: ${articlesPerKey} articles per key`)

  // Analyze each group using its assigned key
  const analysisPromises = articleGroups.map((group, keyIndex) => analyzeGroupWithKey(group, keyIndex))
  const results = await Promise.all(analysisPromises)

  // Flatten results
  return results.flat()
}

async function analyzeGroupWithKey(group: NewsArticle[], keyIndex: number): Promise<any[]> {
  const genAI = new GoogleGenerativeAI(geminiApiKeys[keyIndex])
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

  const analysisResults = []

  for (const article of group) {
    try {
      const prompt = `
        Analyze the following news article for its geopolitical and strategic significance.
        Based on the content, provide a structured JSON output with the following fields:
        - "significance": A numerical score from 1 to 10, where 1 is low significance and 10 is critical.
        - "category": The primary geopolitical category (e.g., "Military", "Diplomacy", "Trade", "Energy", "Environment", "Security").
        - "region": The primary affected geographical region (e.g., "Europe", "Asia Pacific", "Middle East", "Africa", "Americas", "Arctic", "Global").
        - "analysis": A concise, 2-3 sentence strategic analysis explaining the importance of the event.

        Article Title: ${article.title}
        Article Description: ${article.description}

        Return ONLY the JSON object.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim()

      if (!text || text.length === 0) {
        console.error(`Key ${keyIndex}: Empty response for article: ${article.title}`)
        analysisResults.push({
          url: article.url,
          significance: 5,
          category: "Uncategorized",
          region: "Global",
          analysis: "AI analysis could not be completed for this article.",
        })
        continue
      }

      try {
        const analysis = JSON.parse(jsonText)
        if (!analysis.significance || !analysis.category || !analysis.region) {
          console.error(`Key ${keyIndex}: Missing required fields for article: ${article.title}`, analysis)
        }
        analysisResults.push({
          url: article.url,
          significance: analysis.significance ?? 5,
          category: analysis.category ?? "Uncategorized",
          region: analysis.region ?? "Global",
          analysis: analysis.analysis ?? "Partial analysis provided.",
        })
      } catch (e) {
        console.error(`Key ${keyIndex}: Failed to parse JSON:`, jsonText, e)
        analysisResults.push({
          url: article.url,
          significance: 5,
          category: "Uncategorized",
          region: "Global",
          analysis: "AI analysis could not be completed for this article.",
        })
      }
    } catch (error) {
      console.error(`Key ${keyIndex}: Error analyzing article ${article.title}:`, error)
      analysisResults.push({
        url: article.url,
        significance: 5,
        category: "Uncategorized",
        region: "Global",
        analysis: "AI analysis could not be completed for this article.",
      })
    }
  }

  return analysisResults
}

export async function POST(request: NextRequest) {
  try {
    const { articles }: { articles: NewsArticle[] } = await request.json()

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: "Articles array required" }, { status: 400 })
    }

    console.log(`Batch analyze request for ${articles.length} articles`)

    const results = await analyzeArticlesWithKeyDistribution(articles)

    return NextResponse.json({ analyses: results })
  } catch (error) {
    console.error("Batch analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze articles" }, { status: 500 })
  }
}
