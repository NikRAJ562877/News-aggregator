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

        // Fetch topics and top headlines in parallel
        const [topicResults, headlinesRes] = await Promise.all([
            Promise.all(selectedTopics.map(async (topic) => {
                const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&language=en&pageSize=3&apiKey=${apiKey}`
                try {
                    const res = await fetch(url)
                    if (!res.ok) return { topic, articles: [] }
                    const data = await res.json()
                    return { topic, articles: data.articles || [] }
                } catch (err) {
                    return { topic, articles: [] }
                }
            })),
            fetch(`https://newsapi.org/v2/top-headlines?language=en&pageSize=60&apiKey=${apiKey}`)
        ])

        // Process Headlines for Sources
        let sources: { name: string, count: number }[] = []
        if (headlinesRes.ok) {
            const data = await headlinesRes.json()
            const sourceCounts: Record<string, number> = {}
            data.articles?.forEach((a: any) => {
                if (a.source?.name && a.source.name !== "[Removed]") {
                    sourceCounts[a.source.name] = (sourceCounts[a.source.name] || 0) + 1
                }
            })
            sources = Object.entries(sourceCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
        }

        return NextResponse.json({ topics: topicResults, sources })
    } catch (error) {
        console.error("Dashboard data fetch failed:", error)
        return NextResponse.json({ error: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
    }
}
