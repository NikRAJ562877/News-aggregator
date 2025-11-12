"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { mockUsers } from "@/lib/mockUsers"
import type { UserActivity, UserProfile, UserStats } from "@/Types/user"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  user: UserProfile | null
  users: UserProfile[]
  activities: UserActivity[]
  login: (email: string) => Promise<UserProfile | null>
  register: (name: string, email: string) => Promise<UserProfile>
  logout: () => void
  addActivity: (activity: Omit<UserActivity, "id" | "timestamp">) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const raw = localStorage.getItem("mock_users")
      return raw ? JSON.parse(raw) : mockUsers
    } catch {
      return mockUsers
    }
  })

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem("current_user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [activities, setActivities] = useState<UserActivity[]>(() => {
    try {
      const raw = localStorage.getItem("activities")
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("mock_users", JSON.stringify(users))
    } catch {}
  }, [users])

  useEffect(() => {
    try {
      localStorage.setItem("current_user", JSON.stringify(user))
    } catch {}
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem("activities", JSON.stringify(activities))
    } catch {}
  }, [activities])

  const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

  const login = async (email: string) => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
    if (found) {
      setUser(found)
      return found
    }
    return null
  }

  const register = async (name: string, email: string) => {
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
    if (exists) {
      throw new Error("User already exists")
    }
    const now = new Date().toISOString()
    const newUser: UserProfile = {
      id: generateId(),
      name,
      email,
      avatar: "",
      stats: {
        totalArticlesViewed: 0,
        articlesAnalyzed: 0,
        favoriteArticles: 0,
        totalTimeSpent: 0,
        lastLoginTime: now,
        createdAt: now,
      },
      preferences: {
        theme: "light",
        emailNotifications: false,
        favoriteCategories: [],
      },
    }
    setUsers((s) => [newUser, ...s])
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    setUser(null)
    router.push("/")
  }

  const addActivity = (activity: Omit<UserActivity, "id" | "timestamp">) => {
    const toAdd: UserActivity = { id: generateId(), timestamp: new Date().toISOString(), ...activity }
    setActivities((s) => [toAdd, ...s])

    // also update user's stats if logged in
    if (user) {
      const newStats: UserStats = {
        ...user.stats,
        totalArticlesViewed: user.stats.totalArticlesViewed + (activity.type === "view" ? 1 : 0),
        articlesAnalyzed: user.stats.articlesAnalyzed + (activity.type === "analyze" ? 1 : 0),
        favoriteArticles: user.stats.favoriteArticles + (activity.type === "favorite" ? 1 : 0),
        totalTimeSpent: user.stats.totalTimeSpent + (activity.type === "view" ? 1 : 0),
        lastLoginTime: user.stats.lastLoginTime,
        createdAt: user.stats.createdAt,
      }
      const updatedUser = { ...user, stats: newStats }
      setUser(updatedUser)
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
    }
  }

  const value: AuthContextValue = {
    user,
    users,
    activities,
    login,
    register,
    logout,
    addActivity,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
