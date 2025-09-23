import { type NextRequest, NextResponse } from "next/server"

export interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    name: string
  }
  content: string
  significance?: number
  category?: string
  region?: string
}

// Mock news data for demonstration (in production, you'd use a real News API)
const mockNewsData: NewsArticle[] = [
  {
    title: "NATO Announces New Defense Strategy for Eastern Europe",
    description:
      "NATO leaders unveil comprehensive defense plan addressing regional security concerns and military cooperation.",
    url: "https://example.com/nato-defense",
    urlToImage: "/nato-military-meeting.jpg",
    publishedAt: "2024-01-15T10:30:00Z",
    source: { name: "Defense News" },
    content: "NATO has announced a significant shift in its defense strategy...",
    significance: 9,
    category: "Military",
    region: "Europe",
  },
  {
    title: "China-Taiwan Relations: New Diplomatic Developments",
    description: "Recent diplomatic exchanges signal potential changes in cross-strait relations.",
    url: "https://example.com/china-taiwan",
    urlToImage: "/china-taiwan-diplomatic-meeting.jpg",
    publishedAt: "2024-01-15T08:15:00Z",
    source: { name: "Asia Pacific News" },
    content: "Diplomatic sources report new developments in China-Taiwan relations...",
    significance: 8,
    category: "Diplomacy",
    region: "Asia Pacific",
  },
  {
    title: "Middle East Energy Security Summit Concludes",
    description: "Regional leaders discuss energy cooperation and security frameworks.",
    url: "https://example.com/energy-summit",
    urlToImage: "/middle-east-energy-summit.jpg",
    publishedAt: "2024-01-15T06:45:00Z",
    source: { name: "Energy Today" },
    content: "The Middle East Energy Security Summit has concluded with...",
    significance: 7,
    category: "Energy",
    region: "Middle East",
  },
  {
    title: "Arctic Council Meeting Addresses Climate Security",
    description: "Arctic nations discuss climate change implications for regional security.",
    url: "https://example.com/arctic-climate",
    urlToImage: "/arctic-climate-meeting.jpg",
    publishedAt: "2024-01-15T05:20:00Z",
    source: { name: "Arctic News" },
    content: "The Arctic Council convened to address growing concerns...",
    significance: 6,
    category: "Environment",
    region: "Arctic",
  },
  {
    title: "African Union Economic Integration Progress",
    description: "Continental trade agreement shows promising results in first quarter.",
    url: "https://example.com/au-trade",
    urlToImage: "/african-union-trade-meeting.jpg",
    publishedAt: "2024-01-15T04:10:00Z",
    source: { name: "Africa Business" },
    content: "The African Continental Free Trade Agreement has shown...",
    significance: 5,
    category: "Trade",
    region: "Africa",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const region = searchParams.get("region")
  const minSignificance = searchParams.get("minSignificance")

  let filteredNews = mockNewsData

  if (category) {
    filteredNews = filteredNews.filter((article) => article.category?.toLowerCase() === category.toLowerCase())
  }

  if (region) {
    filteredNews = filteredNews.filter((article) => article.region?.toLowerCase() === region.toLowerCase())
  }

  if (minSignificance) {
    const minSig = Number.parseInt(minSignificance)
    filteredNews = filteredNews.filter((article) => (article.significance || 0) >= minSig)
  }

  return NextResponse.json({
    articles: filteredNews,
    totalResults: filteredNews.length,
  })
}
