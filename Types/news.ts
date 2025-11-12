export type Provider = "newsapi" | "newsdata" | "gnews"

export type Article = {
  id: string
  title: string
  description?: string
  url: string
  imageUrl?: string
  source: string
  author?: string
  publishedAt?: string
  provider: Provider
}
