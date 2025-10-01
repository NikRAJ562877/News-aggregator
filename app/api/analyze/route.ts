import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { NewsArticle } from "@/lib/types"

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { article }: { article: NewsArticle } = await request.json()

    if (!article) {
      return NextResponse.json({ error: "Article content required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

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

    // Clean the response to ensure it's valid JSON
    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim()

    let analysis
    try {
      analysis = JSON.parse(jsonText)
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response:", jsonText, e)
      // Provide a fallback in case of parsing failure
      return NextResponse.json(
        {
          significance: 5,
          category: "Uncategorized",
          region: "Global",
          analysis: "AI analysis could not be completed for this article.",
        },
        { status: 200 },
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze article" }, { status: 500 })
  }
}
