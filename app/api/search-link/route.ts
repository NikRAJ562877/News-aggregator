import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
        return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    // Try to find the API key and CX from various likely env var names
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH || process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY
    const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CUSTOM_SEARCH_CX || process.env.GOOGLE_CX

    if (!apiKey || !cx) {
        console.warn("Missing Google Search API credentials")
        return NextResponse.json({ error: "API configuration missing" }, { status: 503 })
    }

    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=1`

        const res = await fetch(url)
        const data = await res.json()

        if (!res.ok) {
            console.error("Google API Error:", data)
            return NextResponse.json({ error: data.error?.message || "Google API failed" }, { status: res.status })
        }

        if (data.items && data.items.length > 0) {
            const item = data.items[0]
            return NextResponse.json({
                url: item.link,
                title: item.title,
                source: item.displayLink
            })
        } else {
            return NextResponse.json({ error: "No results found" }, { status: 404 })
        }

    } catch (error) {
        console.error("Search API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
