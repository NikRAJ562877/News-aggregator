import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetCountry, article } = body || {}

    if (!targetCountry || !article) {
      return NextResponse.json({ error: 'targetCountry and article are required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const prompt = `You are an expert geopolitical analyst. Given a news article and a target country, produce a concise, structured JSON assessment partitioned into who benefits and who is harmed, plus actionable steps the target country should consider.

Input:
- targetCountry: ${targetCountry}
- article.title: ${article.title}
- article.description: ${article.description || ''}
- article.region: ${article.region || ''}
- article.significance: ${article.significance ?? 'unknown'}
- article.category: ${article.category || ''}

Return ONLY valid JSON with these fields:
{
  "impact": "positive" | "negative" | "neutral",
  "goodFor": ["short phrase - actor or group"],        // who benefits from this article/event
  "badFor": ["short phrase - actor or group"],         // who is harmed or disadvantaged
  "competitors": [{ "name": "Country Name", "effect": "benefits" | "harmed" | "neutral", "reason": "short reason" }],
  "recommendation": "One-line clear recommendation for the target country.",
  "steps": ["short actionable step 1", "short actionable step 2"],
  "confidence": number 0-100
}

Guidelines:
- Keep strings concise (<= 300 chars). Use factual reasoning tied to the article (title/description/significance/category).
- If the article has no meaningful external impact, set impact to "neutral" and provide monitoring steps and at least one proactive step.
- Return strictly valid JSON and avoid commentary outside the JSON.
` 

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      console.error('Failed to parse JSON from Gemini response for persona-evaluate:', text, e)
      return NextResponse.json({ error: 'Failed to parse model response', raw: text }, { status: 200 })
    }

    // Basic normalization and safety checks
    if (typeof parsed.confidence === 'number') {
      if (parsed.confidence < 0) parsed.confidence = 0
      if (parsed.confidence > 100) parsed.confidence = 100
    } else {
      parsed.confidence = parsed.confidence ? Number(parsed.confidence) || 0 : 0
    }

    // Ensure arrays exist
    parsed.goodFor = Array.isArray(parsed.goodFor) ? parsed.goodFor : (parsed.goodFor ? [parsed.goodFor] : [])
    parsed.badFor = Array.isArray(parsed.badFor) ? parsed.badFor : (parsed.badFor ? [parsed.badFor] : [])
    parsed.steps = Array.isArray(parsed.steps) ? parsed.steps : (parsed.steps ? [parsed.steps] : [])
    parsed.competitors = Array.isArray(parsed.competitors) ? parsed.competitors : []

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('persona-evaluate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
