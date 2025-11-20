import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

// Lightweight country → continent map (expandable)
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Asia
  China: "Asia",
  India: "Asia",
  Indonesia: "Asia",
  Pakistan: "Asia",
  Bangladesh: "Asia",
  Japan: "Asia",
  "South Korea": "Asia",
  Thailand: "Asia",
  // Europe
  Russia: "Europe",
  Germany: "Europe",
  France: "Europe",
  Italy: "Europe",
  "United Kingdom": "Europe",
  Poland: "Europe",
  Turkey: "Europe",
  // North America
  "United States": "North America",
  Canada: "North America",
  Mexico: "North America",
  // South America
  Brazil: "South America",
  Argentina: "South America",
  Colombia: "South America",
  Chile: "South America",
  Venezuela: "South America",
  // Africa
  Nigeria: "Africa",
  Ethiopia: "Africa",
  Egypt: "Africa",
  Kenya: "Africa",
  "South Africa": "Africa",
  Algeria: "Africa",
  // Middle East
  Iran: "Middle East",
  Israel: "Middle East",
  Qatar: "Middle East",
  "Saudi Arabia": "Middle East",
  "United Arab Emirates": "Middle East",
  // Oceania
  Australia: "Oceania",
  "New Zealand": "Oceania",
}

const HIGH_POPULATION_BASELINE = new Set([
  "China",
  "India",
  "United States",
  "Indonesia",
  "Pakistan",
  "Brazil",
  "Nigeria",
  "Bangladesh",
  "Russia",
  "Mexico",
])

const ARMY_POWER_BASELINE = new Set([
  "United States",
  "China",
  "Russia",
  "India",
  "United Kingdom",
  "France",
  "Turkey",
  "Japan",
  "South Korea",
  "Israel",
  "Saudi Arabia",
])

const STRENGTH_PARAMS = [
  "High Population",
  "Army Strong",
  "Political Shift",
  "Diplomatic Strong",
]

function normalizeText(value: string): string {
  return value.toLowerCase()
}

function buildCountryRegex(country: string): RegExp {
  // word boundary around country name; allow spaces
  const pattern = `\\b${country.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`
  return new RegExp(pattern, "i")
}

function scoreArticlesForCountries(articles: any[]) {
  const scores: Record<string, { population: number; army: number; political: number; diplomatic: number }> = {}

  const politicalKw = /(election|vote|parliament|coup|protest|unrest|government|policy|reform|sanction|impeach|coalition)/i
  const diplomaticKw = /(summit|talks|dialogue|agreement|treaty|alliance|diplomatic|foreign minister|ambassador|negotiation)/i
  const armyKw = /(military|army|defen[cs]e|missile|air force|navy|drill|exercise|weapon|arms|troop|tank)/i

  const textOf = (a: any) => [a.title, a.description, a.content, a.source?.name, a.url].filter(Boolean).join(" ")

  const allCountries = Object.keys(COUNTRY_TO_CONTINENT)
  const compiled = allCountries.map((c) => ({ country: c, regex: buildCountryRegex(c) }))

  for (const article of articles) {
    const text = textOf(article)
    const textLc = normalizeText(text)
    const isPolitical = politicalKw.test(text)
    const isDiplomatic = diplomaticKw.test(text)
    const isArmy = armyKw.test(text)

    for (const { country, regex } of compiled) {
      if (!regex.test(text)) continue
      if (!scores[country]) {
        scores[country] = { population: 0, army: 0, political: 0, diplomatic: 0 }
      }
      // Base weight for mention
      scores[country].population += 1
      if (isArmy) scores[country].army += 2
      if (isPolitical) scores[country].political += 2
      if (isDiplomatic) scores[country].diplomatic += 2
    }
  }

  // Baseline boosts
  for (const c of HIGH_POPULATION_BASELINE) {
    if (!scores[c]) scores[c] = { population: 0, army: 0, political: 0, diplomatic: 0 }
    scores[c].population += 3
  }
  for (const c of ARMY_POWER_BASELINE) {
    if (!scores[c]) scores[c] = { population: 0, army: 0, political: 0, diplomatic: 0 }
    scores[c].army += 3
  }

  return scores
}

function pickTopForContinent(
  scores: Record<string, { population: number; army: number; political: number; diplomatic: number }>,
  continent: string,
  limit = 6,
) {
  const entries = Object.entries(scores).filter(([c]) => COUNTRY_TO_CONTINENT[c] === continent)

  const byPopulation = [...entries].sort((a, b) => b[1].population - a[1].population).slice(0, limit).map(([c]) => c)
  const byArmy = [...entries].sort((a, b) => b[1].army - a[1].army).slice(0, limit).map(([c]) => c)
  const byPolitical = [...entries].sort((a, b) => b[1].political - a[1].political).slice(0, limit).map(([c]) => c)
  const byDiplomatic = [...entries].sort((a, b) => b[1].diplomatic - a[1].diplomatic).slice(0, limit).map(([c]) => c)

  return {
    "High Population": byPopulation,
    "Army Strong": byArmy,
    "Political Shift": byPolitical,
    "Diplomatic Strong": byDiplomatic,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const continent = searchParams.get("continent") || "Global"

    // Fetch latest articles from our news endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/news`, { cache: 'no-store' })
    if (!res.ok) {
      // Fallback: try relative (important when base url is missing in dev)
      const res2 = await fetch(`${req.nextUrl.origin}/api/news`, { cache: 'no-store' })
      if (!res2.ok) {
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
      }
      const data2 = await res2.json()
      const scores2 = scoreArticlesForCountries(data2.articles || [])
      const result2 = pickTopForContinent(scores2, continent)
      return NextResponse.json({ continent, parameters: result2, params: STRENGTH_PARAMS })
    }

    const data = await res.json()
    const scores = scoreArticlesForCountries(data.articles || [])
    const result = pickTopForContinent(scores, continent)
    return NextResponse.json({ continent, parameters: result, params: STRENGTH_PARAMS })
  } catch (e) {
    console.error('strong-countries error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


