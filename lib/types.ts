// lib/types.ts

export interface NewsArticle {
    title: string
    description: string | null
    url: string
    urlToImage: string | null
    publishedAt: string
    source: {
        name: string
    }
    content: string | null

    // These will be populated by your AI analysis
    significance?: number
    sourceReliability?: 'High' | 'Medium' | 'Low' | 'Opinion' | 'Satire'
    category?: string
    region?: string
    analysis?: string
    // Persona-specific analysis results (optional)
    personaAnalysis?: any
}