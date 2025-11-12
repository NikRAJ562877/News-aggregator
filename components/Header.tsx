"use client"

import React, { useState } from "react"
import { useAuth } from "./AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export default function Header() {
  const { user, login, register, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams?.get("view")

  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const landing = pathname === "/"

  const handleLogin = async () => {
    setError(null)
    const u = await login(email)
    if (!u) {
      setError("No user found with that email. Try registering.")
      return
    }
    setShowLogin(false)
    router.push("/demo")
  }

  const handleRegister = async () => {
    setError(null)
    try {
      await register(name, email)
      setShowRegister(false)
      router.push("/demo")
    } catch (err: any) {
      setError(err?.message ?? "Registration failed")
    }
  }

  const goToMain = () => {
    router.push("/demo")
  }

  const goToDashboard = () => {
    router.push("/demo?view=dashboard")
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href={user ? "/demo" : "/"} className="font-bold text-xl">
            Strategic Intelligence Hub
          </a>

          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <Button size="sm" variant={view === "dashboard" ? "ghost" : "default"} onClick={goToMain}>
                Main
              </Button>
              <Button size="sm" variant={view === "dashboard" ? "default" : "ghost"} onClick={goToDashboard}>
                Dashboard
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="text-sm">
                {user.name} <span className="text-muted-foreground">({user.email})</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/demo")}>Demo</Button>
              <Button variant="outline" size="sm" onClick={() => { logout() }}>Logout</Button>
            </>
          ) : (
            landing && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowLogin((s) => !s)}>Login</Button>
                <Button variant="default" size="sm" onClick={() => setShowRegister((s) => !s)}>Register</Button>
              </>
            )
          )}
        </div>
      </div>

      {showLogin && landing && (
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-md">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleLogin}>Login</Button>
              <Button variant="ghost" onClick={() => setShowLogin(false)}>Cancel</Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      )}

      {showRegister && landing && (
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-md">
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="mb-2" />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleRegister}>Create account</Button>
              <Button variant="ghost" onClick={() => setShowRegister(false)}>Cancel</Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </header>
  )
}
