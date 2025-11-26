import { NextResponse } from "next/server"

// Report how many Gemini keys are configured so clients can adapt concurrency/distribution
export async function GET() {
  try {
    const geminiApiKeys = Object.keys(process.env).filter((k) => k.startsWith("GEMINI_API_KEY")).length
    const demoNewsKeys = Object.keys(process.env).filter((k) => k.startsWith("DEMO_NEWS_")).length

    return NextResponse.json({ count: geminiApiKeys, demoCount: demoNewsKeys })
  } catch (error) {
    console.error('key-info error:', error)
    return NextResponse.json({ count: 0 })
  }
}
