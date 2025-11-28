import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Support multiple Gemini API keys for load distribution (round-robin)
const geminiApiKeys: string[] = Object.keys(process.env)
  .filter((k) => k.startsWith("PERSONA_EVAL_"))
  .map((k) => process.env[k] as string)
  .filter(Boolean)

let currentKeyIndex = 0
function getNextGenAI(): GoogleGenerativeAI {
  if (geminiApiKeys.length === 0) {
    throw new Error("No Gemini API keys configured for Persona Eval")
  }
  const key = geminiApiKeys[currentKeyIndex % geminiApiKeys.length]
  currentKeyIndex++
  return new GoogleGenerativeAI(key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetCountry, article } = body || {}

    if (!targetCountry || !article) {
      return NextResponse.json({ error: 'targetCountry and article are required' }, { status: 400 })
    }

    const genAI = getNextGenAI()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const prompt = `
      You are a Geopolitical Strategist advising the government of ${targetCountry}.
      Analyze the following news article and its impact specifically on ${targetCountry}.

      Article Title: ${article.title}
      Article Description: ${article.description}
      Article Content: ${article.content}

      Return STRICTLY a JSON object with these fields:
      - "impact": "positive" | "negative" | "neutral"
      - "confidence": integer 0-100
      - "diplomatic_leverage": "High" | "Medium" | "Low" (Current standing regarding this issue)
      - "economic_exposure": "High" | "Medium" | "Low" (Financial risk/opportunity)
      - "goodFor": Array of strings (Who benefits? e.g. specific industries, allies)
      - "badFor": Array of strings (Who loses? e.g. competitors, specific sectors)
      - "allies_impact": string (1 sentence on how this affects ${targetCountry}'s allies)
      - "adversaries_impact": string (1 sentence on how this affects ${targetCountry}'s adversaries)
      - "competitive_countries": Array of objects { "country": "string", "impact_type": "Opportunity" | "Threat" | "Neutral", "reason": "string" } (Identify 2-3 key competitor nations and the specific impact on them)
      - "recommendation": string (1-2 sentences strategic advice)
      - "steps": Array of strings (3 concrete, actionable policy steps ${targetCountry} should take immediately)

      Ensure the analysis is realistic and grounded in current geopolitics.
      Return ONLY the JSON object.
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
    parsed.competitive_countries = Array.isArray(parsed.competitive_countries) ? parsed.competitive_countries : []

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('persona-evaluate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
