import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    const apiKey = process.env.NEWSAPI_KEY
    if (!apiKey) {
        console.error("[DashboardAPI] NEWSAPI_KEY is missing")
        return NextResponse.json({ error: "NewsAPI key is not configured" }, { status: 500 })
    }

    // Curated list of high-interest topics
    const topics = [
        "Cybersecurity",
        "Artificial Intelligence",
        "Global Trade",
        "Energy Crisis",
        "Space Exploration",
        "Climate Policy",
        "Military Technology",
        "Crypto Regulation"
    ]

    // Select 2 random topics
    const shuffled = topics.sort(() => 0.5 - Math.random())
    const selectedTopics = shuffled.slice(0, 2)

    try {
        console.log(`[DashboardAPI] Selected topics: ${selectedTopics.join(", ")}`)

        const promises = selectedTopics.map(async (topic) => {
            // Fetch top 3 articles for each topic
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&language=en&pageSize=3&apiKey=${apiKey}`
            console.log(`[DashboardAPI] Fetching for topic: ${topic}`)

            try {
                const res = await fetch(url)
                if (!res.ok) {
                    const errText = await res.text()
                    console.error(`[DashboardAPI] NewsAPI error for ${topic}: ${res.status} ${res.statusText}`, errText)
                    return { topic, articles: [] }
                }

                const data = await res.json()
                return {
                    topic,
                    articles: data.articles || []
                }
            } catch (err) {
                console.error(`[DashboardAPI] Fetch error for ${topic}:`, err)
                return { topic, articles: [] }
            }
        })

        const results = await Promise.all(promises)
        console.log(`[DashboardAPI] Returning ${results.length} topics. Articles found: ${results.map(r => r.articles.length).join(', ')}`)
        return NextResponse.json({ topics: results })
    } catch (error) {
        console.error("Dashboard data fetch failed:", error)
        return NextResponse.json({ error: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
    }
}
