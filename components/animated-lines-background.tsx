"use client"

import { useEffect, useState } from "react"

interface AnimatedLine {
    id: number
    from: { x: number; y: number }
    to: { x: number; y: number }
    duration: number
    delay: number
}

interface AnimatedLinesBackgroundProps {
    worldMapUrl?: string
}

export function AnimatedLinesBackground({ worldMapUrl }: AnimatedLinesBackgroundProps) {
    const [mounted, setMounted] = useState(false)
    const [lines, setLines] = useState<AnimatedLine[]>([])

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (!mounted) return

        const createRandomLine = (id: number): AnimatedLine => {
            const x = Math.random() * 100
            const y = Math.random() * 100
            const offset = 20 + Math.random() * 20
            const direction = Math.random() * Math.PI * 2
            const toX = x + Math.cos(direction) * offset
            const toY = y + Math.sin(direction) * offset

            return {
                id,
                from: { x, y },
                to: { x: Math.min(100, Math.max(0, toX)), y: Math.min(100, Math.max(0, toY)) },
                duration: 3 + Math.random() * 3,
                delay: Math.random() * 2,
            }
        }

        const refreshLines = () => {
            // 3–5 random lines
            const count = 3 + Math.floor(Math.random() * 3)
            setLines(Array.from({ length: count }, (_, i) => createRandomLine(i)))
        }

        refreshLines()
        const interval = setInterval(refreshLines, 5000)
        return () => clearInterval(interval)
    }, [mounted])

    if (!mounted) return null

    const mapUrl =
        worldMapUrl ||
        "https://cdn.dribbble.com/userupload/25633128/file/original-b8beb57df8ebbbc0462aa7fd20f62bea.gif"

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden">
            {/* 🌍 Background Map */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${mapUrl})`,
                    filter: "brightness(0.65) contrast(1.05)",
                    transform: "scale(1)",
                }}
            />
            <div className="absolute inset-0 bg-slate-950/65" />

        </div>
    )
}
