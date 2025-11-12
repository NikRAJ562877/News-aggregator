export interface UserStats {
  totalArticlesViewed: number
  articlesAnalyzed: number
  favoriteArticles: number
  totalTimeSpent: number
  lastLoginTime: string
  createdAt: string
}

export interface UserActivity {
  id: string
  type: "view" | "analyze" | "favorite" | "search"
  articleTitle: string
  timestamp: string
  details?: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  stats: UserStats
  preferences: {
    theme: "light" | "dark"
    emailNotifications: boolean
    favoriteCategories: string[]
  }
}
