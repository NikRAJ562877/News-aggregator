"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/AuthProvider"
import { Mail, User, LogIn, UserPlus, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, register, user } = useAuth()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setIsLoading(true)
    const u = await login(email)
    setIsLoading(false)
    if (!u) return setError("No user found with that email")

    if (!u.persona) {
      router.push("/onboarding")
    } else {
      router.push("/demo")
    }
  }

  const handleRegister = async () => {
    setError(null)
    setIsLoading(true)
    try {
      await register(name, email)
      router.push("/onboarding")
    } catch (err: any) {
      setError(err?.message ?? "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (user) {
    if (!user.persona) {
      router.replace("/onboarding")
    } else {
      router.replace("/demo")
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your account or create a new one</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Login Section */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              Sign In
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              <Button
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                onClick={handleLogin}
                disabled={isLoading || !email}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center px-8">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-slate-500 font-medium">
                or create an account
              </span>
            </div>
          </div>

          {/* Register Section */}
          <div className="p-8 pt-4 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Create Account
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 h-11 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                onClick={handleRegister}
                disabled={isLoading || !name || !email}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}