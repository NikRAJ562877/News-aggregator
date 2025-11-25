"use client"

import { useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User, Briefcase, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react"

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
    const { user, updateUser } = useAuth()
    const [step, setStep] = useState(1)
    const [persona, setPersona] = useState<"Citizen" | "Professional" | "Executive">("Citizen")
    const [focusArea, setFocusArea] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        // Simulate API call or direct update if using local state
        if (user) {
            const updatedUser = { ...user, persona, focusArea: persona === 'Citizen' ? undefined : focusArea }
            // In a real app, you'd await an API call here
            // await fetch('/api/user/update', ...)
            updateUser(updatedUser)
        }
        setTimeout(() => {
            setLoading(false)
            onComplete()
        }, 800)
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Sentinel</h1>
                <p className="text-muted-foreground">Calibrate your intelligence feed.</p>
            </div>

            <Card className="border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle>Select Your Profile</CardTitle>
                    <CardDescription>How do you want to use Sentinel?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <RadioGroup value={persona} onValueChange={(v: any) => setPersona(v)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <RadioGroupItem value="Citizen" id="citizen" className="peer sr-only" />
                            <Label
                                htmlFor="citizen"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                            >
                                <User className="mb-3 h-8 w-8 text-blue-500" />
                                <div className="text-center space-y-1">
                                    <div className="font-semibold text-lg">Citizen</div>
                                    <p className="text-xs text-muted-foreground font-normal">
                                        "I just want to know what's happening in the world."
                                    </p>
                                </div>
                                {persona === 'Citizen' && <CheckCircle2 className="mt-3 h-5 w-5 text-primary" />}
                            </Label>
                        </div>

                        <div>
                            <RadioGroupItem value="Professional" id="professional" className="peer sr-only" />
                            <Label
                                htmlFor="professional"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                            >
                                <Briefcase className="mb-3 h-8 w-8 text-green-500" />
                                <div className="text-center space-y-1">
                                    <div className="font-semibold text-lg">Professional</div>
                                    <p className="text-xs text-muted-foreground font-normal">
                                        "I work in a specific sector and need to track markets."
                                    </p>
                                </div>
                                {persona === 'Professional' && <CheckCircle2 className="mt-3 h-5 w-5 text-primary" />}
                            </Label>
                        </div>

                        <div>
                            <RadioGroupItem value="Executive" id="executive" className="peer sr-only" />
                            <Label
                                htmlFor="executive"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                            >
                                <TrendingUp className="mb-3 h-8 w-8 text-purple-500" />
                                <div className="text-center space-y-1">
                                    <div className="font-semibold text-lg">Executive</div>
                                    <p className="text-xs text-muted-foreground font-normal">
                                        "I need to beat the competition and spot disruption."
                                    </p>
                                </div>
                                {persona === 'Executive' && <CheckCircle2 className="mt-3 h-5 w-5 text-primary" />}
                            </Label>
                        </div>
                    </RadioGroup>

                    {persona !== 'Citizen' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="focus-area">
                                    {persona === 'Professional' ? 'Target Sector' : 'Strategic Industry'}
                                </Label>
                                <Select value={focusArea} onValueChange={setFocusArea}>
                                    <SelectTrigger id="focus-area">
                                        <SelectValue placeholder="Select an area..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Technology">Technology & SaaS</SelectItem>
                                        <SelectItem value="Finance">Finance & Markets</SelectItem>
                                        <SelectItem value="Energy">Energy & Renewables</SelectItem>
                                        <SelectItem value="Healthcare">Healthcare & Biotech</SelectItem>
                                        <SelectItem value="Defense">Defense & Security</SelectItem>
                                        <SelectItem value="Automotive">Automotive & EV</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    This will calibrate your {persona === 'Professional' ? 'Sector Watch' : 'Innovation Radar'} feed.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={loading || (persona !== 'Citizen' && !focusArea)}
                            className="w-full md:w-auto"
                        >
                            {loading ? "Calibrating..." : "Initialize Dashboard"}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
