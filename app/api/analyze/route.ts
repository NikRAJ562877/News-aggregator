import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { article } = await request.json()

    if (!article) {
      return NextResponse.json({ error: "Article content required" }, { status: 400 })
    }

    // AI analysis for geopolitical significance
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Analyze this news article for strategic and geopolitical significance. 
      
      Article: "${article.title} - ${article.description}"
      
      Please provide:
      1. Significance score (1-10, where 10 is highest strategic importance)
      2. Primary geopolitical category (Military, Diplomacy, Trade, Energy, Environment, Security, etc.)
      3. Affected region (Europe, Asia Pacific, Middle East, Africa, Americas, Arctic, Global)
      4. Brief strategic analysis (2-3 sentences)
      
      Format your response as JSON with keys: significance, category, region, analysis`,
    })

    // Parse AI response
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch {
      // Fallback if AI doesn't return valid JSON
      analysis = {
        significance: 5,
        category: "General",
        region: "Global",
        analysis: "Strategic analysis pending further review.",
      }
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze article" }, { status: 500 })
  }
}
