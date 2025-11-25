"use client"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { redirect } from "next/navigation"

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <OnboardingFlow onComplete={() => window.location.href = '/dashboard'} />
        </div>
    )
}
