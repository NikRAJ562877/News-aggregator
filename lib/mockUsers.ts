import { UserProfile } from "@/Types/user"

export const mockUsers: UserProfile[] = [
  {
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    avatar: "",
    stats: {
      totalArticlesViewed: 12,
      articlesAnalyzed: 3,
      favoriteArticles: 1,
      totalTimeSpent: 45,
      lastLoginTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    preferences: {
      theme: "light",
      emailNotifications: true,
      favoriteCategories: ["Diplomacy", "Trade"],
    },
  },
]
