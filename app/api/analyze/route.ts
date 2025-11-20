import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { NewsArticle } from "@/lib/types"

export const dynamic = 'force-dynamic';

// Support multiple Gemini API keys for load distribution
// Discover any env var that starts with `GEMINI_API_KEY` (GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_FOO, ...)
const geminiApiKeys: string[] = Object.keys(process.env)
  .filter((k) => k.startsWith("GEMINI_API_KEY"))
  .map((k) => process.env[k] as string)
  .filter(Boolean)

let currentKeyIndex = 0

function getNextGenAI(): GoogleGenerativeAI {
  if (geminiApiKeys.length === 0) {
    throw new Error("No Gemini API keys configured")
  }
  const key = geminiApiKeys[currentKeyIndex % geminiApiKeys.length]
  currentKeyIndex++
  return new GoogleGenerativeAI(key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { article, keyIndex }: { article: NewsArticle; keyIndex?: number } = body || {}

    if (!article) {
      return NextResponse.json({ error: "Article content required" }, { status: 400 })
    }

    // If a specific keyIndex is provided and valid, use that key explicitly to guarantee distribution
    let genAI: GoogleGenerativeAI
    if (typeof keyIndex === 'number' && keyIndex >= 0 && keyIndex < geminiApiKeys.length) {
      genAI = new GoogleGenerativeAI(geminiApiKeys[keyIndex])
    } else {
      genAI = getNextGenAI()
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

    const prompt = `
      You are a concise, factual geopolitical analyst. Analyze the article below.
      Return STRICTLY a JSON object with these fields:
      - "significance": integer 1-10 (1 = low, 10 = critical)
      - "category": one of ("Military","Diplomacy","Trade","Energy","Environment","Security","Other")
      - "region": one of ("Europe","Asia Pacific","Middle East","Africa","Americas","Arctic","Global")
      - "analysis": 1-3 sentence factual summary tied to the article content.
      - "timeline": Array of objects { "date": "string", "event": "string" } (Extract 3-4 key dates/events leading up to this).
      - "scenarios": Array of objects { "outcome": "Best Case" | "Worst Case" | "Most Likely", "probability": "High" | "Medium" | "Low", "description": "string" } (Predict 3 distinct future scenarios).
      - "graph_data": {
          "nodes": [{ "id": "EntityName", "type": "Country" | "Person" | "Organization" | "Event" }],
          "links": [{ "source": "EntityName", "target": "EntityName", "label": "relationship" }]
        }
        (Extract 3-5 key entities and their relationships for a knowledge graph. Ensure source/target match node ids exactly.)

      Use facts from the title, description, and content. Do not hallucinate.
      Article Title: ${article.title}
      Article Description: ${article.description || ''}
      Article Content: ${article.content || ''}
      Return ONLY the JSON object.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean the response to ensure it's valid JSON
    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim()

    // If empty response, return a clear fallback
    if (!text || text.length === 0) {
      console.error("Gemini returned empty response")
      return NextResponse.json(
        {
          significance: 3,
          category: "Other",
          region: "Global",
          analysis: "Unable to generate analysis at this time.",
        },
        { status: 200 },
      )
    }

    // Try to parse JSON; if that fails, attempt to extract a JSON substring from the model output
    let analysis: any = null
    const tryParse = (s: string) => {
      try {
        return JSON.parse(s)
      } catch (e) {
        return null
      }
    }

    analysis = tryParse(jsonText)
    if (!analysis) {
      // Attempt to locate the first JSON object in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/m)
      if (jsonMatch) {
        analysis = tryParse(jsonMatch[0])
      }
    }

    // If still no structured JSON, attempt to extract simple fields heuristically
    if (!analysis) {
      console.error("Failed to parse JSON from Gemini response, returning safe fallback. Raw response:", text)
      // Attempt to extract a significance number from the text
      const sigMatch = text.match(/(significance\D{0,10})(\d{1,2})/i) || text.match(/"significance"\s*:\s*(\d{1,2})/i)
      const significance = sigMatch ? Number(sigMatch[sigMatch.length - 1]) : 3
      // Try to find category/region words
      const categoryMatch = text.match(/(Military|Diplomacy|Trade|Energy|Environment|Security|Other)/i)
      const regionMatch = text.match(/(Europe|Asia Pacific|Middle East|Africa|Americas|Arctic|Global)/i)

      return NextResponse.json(
        {
          significance: significance,
          category: categoryMatch ? categoryMatch[0] : "Other",
          region: regionMatch ? regionMatch[0] : "Global",
          analysis: "Article analyzed based on available content.",
        },
        { status: 200 },
      )
    }

    // Normalize and validate fields
    const normalized = {
      significance: typeof analysis.significance === 'number' ? Math.max(1, Math.min(10, Math.round(analysis.significance))) : (analysis.significance ? Number(analysis.significance) || 3 : 3),
      category: (analysis.category && String(analysis.category).trim()) || "Other",
      region: (analysis.region && String(analysis.region).trim()) || "Global",
      analysis: (analysis.analysis && String(analysis.analysis).trim()) || "Article analyzed successfully.",
      timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
      scenarios: Array.isArray(analysis.scenarios) ? analysis.scenarios : [],
      graph_data: analysis.graph_data || { nodes: [], links: [] },
    }

    // Ensure significance is a sensible integer
    if (!Number.isFinite(normalized.significance) || normalized.significance < 1 || normalized.significance > 10) {
      normalized.significance = 3
    }

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze article" }, { status: 500 })
  }
}
