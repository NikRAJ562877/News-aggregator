import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { NewsArticle } from "@/lib/types"

export const dynamic = 'force-dynamic';

// Support multiple Gemini API keys for load distribution
const demoNewsKeys: string[] = Object.keys(process.env).filter((k) => k.startsWith("DEMO_NEWS_")).map((k) => process.env[k] as string).filter(Boolean)
const ddaKeys: string[] = Object.keys(process.env).filter((k) => k.startsWith("DDA_")).map((k) => process.env[k] as string).filter(Boolean)

let currentDemoKeyIndex = 0
let currentDdaKeyIndex = 0

function getNextGenAI(type: 'demo' | 'dda'): GoogleGenerativeAI {
  const keys = type === 'dda' ? ddaKeys : demoNewsKeys
  let index = type === 'dda' ? currentDdaKeyIndex : currentDemoKeyIndex

  if (keys.length === 0) {
    // Fallback to the other pool if one is empty, or error
    const fallbackKeys = type === 'dda' ? demoNewsKeys : ddaKeys
    if (fallbackKeys.length > 0) {
      console.warn(`No keys found for ${type}, falling back to alternate pool`)
      return new GoogleGenerativeAI(fallbackKeys[0])
    }
    throw new Error(`No Gemini API keys configured for ${type}`)
  }

  const key = keys[index % keys.length]
  if (type === 'dda') currentDdaKeyIndex++
  else currentDemoKeyIndex++

  return new GoogleGenerativeAI(key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { article, keyIndex, analysisType, graph_data } = body || {}

    if (!article) {
      return NextResponse.json({ error: "Article content required" }, { status: 400 })
    }

    // Determine which key pool to use
    // Deep Dive (graph_data requested) -> DDA Keys
    // Standard Analysis -> Demo News Keys
    const isDeepDive = !!graph_data
    const genAI = getNextGenAI(isDeepDive ? 'dda' : 'demo')

    // Use Pro model for analysis tasks
    // Use Pro model for analysis tasks
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

    let prompt = ""

    // --- HYBRID DEEP DIVE (Pro + Flash) ---
    if (isDeepDive) {
      // 1. PRO MODEL: Heavy Strategic Analysis (No Timeline)
      prompt = `
        You are a Senior Geopolitical Intelligence Analyst. Provide a high-level strategic assessment of the article below.
        
        Return STRICTLY a JSON object with these fields:
        - "significance": integer 1-10 (1 = low, 10 = critical global impact)
        - "category": one of ("Military","Diplomacy","Trade","Energy","Environment","Security","Other")
        - "region": one of ("Europe","Asia Pacific","Middle East","Africa","Americas","Arctic","Global")
        - "analysis": 2-3 sentence executive summary focusing on the "So What?".
        - "strategic_implications": Array of strings (2-3 bullet points on long-term consequences).
        - "key_stakeholders": Array of strings (List 2-3 key players/countries involved).
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

      // 2. FLASH MODEL: Historical Timeline (Concurrent)
      const flashGenAI = getNextGenAI('demo') // Use Demo keys for Flash (lighter load)
      const flashModel = flashGenAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const timelinePrompt = `
        You are a Historian. Based on the news headline below, identify 3-5 key historical events that led to this situation.
        
        Headline: ${article.title}
        Context: ${article.description || ''}

        Return STRICTLY a JSON object with this field:
        - "timeline": Array of objects { "date": "string", "event": "string" }
        
        Rules:
        - Use specific dates (e.g., "Oct 2023", "2014", "Last Month").
        - Events must be factual and directly related to the headline.
        - Return ONLY the JSON object.
      `

      // Run both in parallel
      const [proResult, flashResult] = await Promise.all([
        model.generateContent(prompt),
        flashModel.generateContent(timelinePrompt)
      ])

      const proText = proResult.response.text()
      const flashText = flashResult.response.text()

      // Parse and Merge
      let analysis = parseGeminiJson(proText)
      const timelineData = parseGeminiJson(flashText)

      if (!analysis) analysis = {}

      // Inject Flash's timeline into Pro's analysis
      if (timelineData && Array.isArray(timelineData.timeline)) {
        analysis.timeline = timelineData.timeline
      } else {
        analysis.timeline = []
      }

      return NextResponse.json(normalizeAnalysis(analysis))
    }

    // --- STANDARD ANALYSIS (Single Call) ---
    if (analysisType === 'innovation') {
      prompt = `
        You are a ruthless Venture Capital Analyst. Analyze this article for a founder/investor.
        Return STRICTLY a JSON object with these fields:
        - "significance": integer 1-10 (Disruption Potential)
        - "category": "Deep Tech", "SaaS", "Biotech", "Fintech", "Consumer", "Other"
        - "region": Primary market region
        - "analysis": 2 sentence investment thesis or warning.
        - "founder_lens": {
            "ma_verdict": "Acquire" | "Partner" | "Invest" | "Ignore",
            "synergy_score": 1-10 (Strategic Fit),
            "tech_moat": "High" | "Medium" | "Low" (Defensibility explanation),
            "competitors": ["Comp1", "Comp2"]
        }
        - "timeline": Array of objects { "date": "string", "event": "string" } (Key milestones).
        - "scenarios": Array of objects { "outcome": "Unicorn" | "Acqui-hire" | "Fail", "probability": "High" | "Medium" | "Low", "description": "string" }.
        
        Use facts from the article.
        Article Title: ${article.title}
        Article Description: ${article.description || ''}
        Article Content: ${article.content || ''}
        Return ONLY the JSON object.
        `
    } else if (analysisType === 'sector') {
      prompt = `
        You are a Market Strategist. Analyze this article for a business executive.
        Return STRICTLY a JSON object with these fields:
        - "significance": integer 1-10 (Market Impact)
        - "category": Industry Sector
        - "region": Primary market
        - "analysis": 2 sentence strategic outlook.
        - "market_lens": {
            "entry_signal": "Green Light" | "Yellow Light" | "Red Light",
            "competitive_threat": "High" | "Medium" | "Low",
            "opportunity": "string" (One specific opportunity for the user)
        }
        - "timeline": Array of objects { "date": "string", "event": "string" }.
        - "scenarios": Array of objects { "outcome": "Bull" | "Bear" | "Stagnant", "probability": "High" | "Medium" | "Low", "description": "string" }.

        Use facts from the article.
        Article Title: ${article.title}
        Article Description: ${article.description || ''}
        Article Content: ${article.content || ''}
        Return ONLY the JSON object.
        `
    } else {
      // Default / General Prompt (Demo Page - Simple Click)
      prompt = `
        You are a Senior Geopolitical Intelligence Analyst. Provide a high-level strategic assessment of the article below.
        
        Return STRICTLY a JSON object with these fields:
        - "significance": integer 1-10 (1 = low, 10 = critical global impact)
        - "category": one of ("Military","Diplomacy","Trade","Energy","Environment","Security","Other")
        - "region": one of ("Europe","Asia Pacific","Middle East","Africa","Americas","Arctic","Global")
        - "analysis": 2-3 sentence executive summary focusing on the "So What?".
        - "strategic_implications": Array of strings (2-3 bullet points on long-term consequences).
        - "key_stakeholders": Array of strings (List 2-3 key players/countries involved).
        - "timeline": Array of objects { "date": "string", "event": "string" } (Extract 3-4 key dates/events).
        - "scenarios": Array of objects { "outcome": "Best Case" | "Worst Case" | "Most Likely", "probability": "High" | "Medium" | "Low", "description": "string" } (Predict 3 distinct future scenarios).
        - "graph_data": { "nodes": [], "links": [] }
  
        Use facts from the title, description, and content. Do not hallucinate.
        Article Title: ${article.title}
        Article Description: ${article.description || ''}
        Article Content: ${article.content || ''}
        Return ONLY the JSON object.
      `
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const analysis = parseGeminiJson(text)

    return NextResponse.json(normalizeAnalysis(analysis))

  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze article" }, { status: 500 })
  }
}

// Helper to parse JSON from Gemini response (handles markdown code blocks)
function parseGeminiJson(text: string): any {
  if (!text) return null
  const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim()
  try {
    return JSON.parse(jsonText)
  } catch (e) {
    // Try to find first JSON object
    const match = jsonText.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch (e2) { return null }
    }
    return null
  }
}

// Helper to normalize analysis object
function normalizeAnalysis(analysis: any): any {
  if (!analysis) return {
    significance: 3,
    category: "Other",
    region: "Global",
    analysis: "Analysis failed.",
    timeline: [],
    scenarios: [],
    graph_data: { nodes: [], links: [] }
  }

  return {
    significance: typeof analysis.significance === 'number' ? Math.max(1, Math.min(10, Math.round(analysis.significance))) : (analysis.significance ? Number(analysis.significance) || 3 : 3),
    category: (analysis.category && String(analysis.category).trim()) || "Other",
    region: (analysis.region && String(analysis.region).trim()) || "Global",
    analysis: (analysis.analysis && String(analysis.analysis).trim()) || "Article analyzed successfully.",
    strategic_implications: Array.isArray(analysis.strategic_implications) ? analysis.strategic_implications : [],
    key_stakeholders: Array.isArray(analysis.key_stakeholders) ? analysis.key_stakeholders : [],
    timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
    scenarios: Array.isArray(analysis.scenarios) ? analysis.scenarios : [],
    graph_data: analysis.graph_data || { nodes: [], links: [] },
    founder_lens: analysis.founder_lens || null,
    market_lens: analysis.market_lens || null,
  }
}

