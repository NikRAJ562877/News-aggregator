"use client"

import { useAuth } from "@/components/AuthProvider"
import { StrategicDashboard } from "@/components/dashboard/strategic-dashboard"

export function DashboardView() {
    const auth = useAuth()

    if (!auth.user) return null

    return (
        <div className="container mx-auto px-4 py-8">
            <StrategicDashboard />
        </div>
    )
}
