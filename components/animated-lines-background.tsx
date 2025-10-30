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
            const offset = 6 + Math.random() * 10
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
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1600px-World_map_-_low_resolution.svg.png"

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden">
            {/* 🌍 Background Map */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${mapUrl})`,
                    filter: "brightness(0.55) contrast(1.05)",
                    transform: "scale(1.03)",
                }}
            />
            <div className="absolute inset-0 bg-slate-950/65" />

            {/* ✨ Animated Lines Layer */}
            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00ffa6" stopOpacity="0" />
                        <stop offset="40%" stopColor="#00ffa6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#00ffa6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {lines.map((line) => {
                    const dx = line.to.x - line.from.x
                    const dy = line.to.y - line.from.y
                    const midX = (line.from.x + line.to.x) / 2
                    const midY =
                        (line.from.y + line.to.y) / 2 - Math.sqrt(dx * dx + dy * dy) * (0.6 + Math.random() * 0.4)

                    const path = `M ${line.from.x} ${line.from.y} Q ${midX} ${midY} ${line.to.x} ${line.to.y}`

                    return (
                        <g key={line.id}>
                            {/* Invisible guide path for animation */}
                            <path id={`path-${line.id}`} d={path} fill="none" stroke="none" />

                            {/* Animated glowing line */}
                            <path
                                d={path}
                                stroke="url(#lineGradient)"
                                strokeWidth="0.08"
                                strokeLinecap="round"
                                fill="none"
                                style={{
                                    opacity: 0.9,
                                    filter: "drop-shadow(0 0 3px rgba(0,255,166,0.6)) drop-shadow(0 0 6px rgba(0,255,166,0.3))",
                                }}
                            >
                                <animate
                                    attributeName="stroke-dasharray"
                                    values="0,100;10,0;0,100"
                                    dur={`${line.duration}s`}
                                    repeatCount="indefinite"
                                    begin={`${line.delay}s`}
                                />
                            </path>

                            {/* Optional small glow dot traveling along the path */}
                            <circle r="0.12" fill="#00ffa6" opacity={0.8}>
                                <animateMotion dur={`${line.duration}s`} repeatCount="indefinite" begin={`${line.delay}s`}>
                                    <mpath href={`#path-${line.id}`} />
                                </animateMotion>
                            </circle>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}
