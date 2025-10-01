import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";
import type { NewsArticle } from "@/lib/types";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function generateSearchQuery(topic: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Using a faster model for query generation
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

    // Map to our NewsArticle type
    const articles: NewsArticle[] = uniqueArticles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: {
        name: article.source.name,
      },
      content: article.content,
      category: article.category, // The category we tagged earlier
      significance: undefined,
      region: undefined, // Region will be populated by analysis
    }))

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
