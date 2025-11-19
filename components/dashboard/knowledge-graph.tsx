"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface Node {
    id: string
    type: "Country" | "Person" | "Organization" | "Event"
    x?: number
    y?: number
}

interface Link {
    source: string
    target: string
    label: string
}

interface KnowledgeGraphProps {
    data: {
        nodes: Node[]
        links: Link[]
    }
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [nodes, setNodes] = useState<Node[]>([])

    // Simple force-directed layout simulation (simplified for demo)
    useEffect(() => {
        if (!data?.nodes?.length) return

        const width = 600
        const height = 400
        const centerX = width / 2
        const centerY = height / 2

        // Initialize positions in a circle
        const newNodes = data.nodes.map((node, i) => {
            const angle = (i / data.nodes.length) * 2 * Math.PI
            const radius = 120
            return {
                ...node,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            }
        })

        setNodes(newNodes)
    }, [data])

    if (!data?.nodes?.length) {
        return (
            <div className="flex items-center justify-center h-64 bg-muted/10 rounded border border-dashed">
                <p className="text-muted-foreground text-sm">Select an article to generate Knowledge Graph</p>
            </div>
        )
    }

    const getNodeColor = (type: string) => {
        switch (type) {
            case "Country": return "#10b981" // emerald-500
            case "Person": return "#3b82f6" // blue-500
            case "Organization": return "#f59e0b" // amber-500
            case "Event": return "#ef4444" // red-500
            default: return "#6b7280"
        }
    }

    return (
        <div className="w-full h-[400px] bg-card rounded border relative overflow-hidden">
            <div className="absolute top-2 left-2 z-10 flex gap-2 text-xs">
                {["Country", "Person", "Organization", "Event"].map(type => (
                    <div key={type} className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded shadow-sm backdrop-blur">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(type) }} />
                        <span>{type}</span>
                    </div>
                ))}
            </div>

            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 600 400" className="w-full h-full">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                    </marker>
                </defs>

                {/* Links */}
                {data.links.map((link, i) => {
                    const sourceNode = nodes.find(n => n.id === link.source)
                    const targetNode = nodes.find(n => n.id === link.target)
                    if (!sourceNode || !targetNode) return null

                    return (
                        <g key={i}>
                            <line
                                x1={sourceNode.x}
                                y1={sourceNode.y}
                                x2={targetNode.x}
                                y2={targetNode.y}
                                stroke="#e5e7eb"
                                strokeWidth="1.5"
                                markerEnd="url(#arrowhead)"
                                className="dark:stroke-gray-700"
                            />
                            <text
                                x={(sourceNode.x! + targetNode.x!) / 2}
                                y={(sourceNode.y! + targetNode.y!) / 2 - 5}
                                textAnchor="middle"
                                fill="#6b7280"
                                fontSize="10"
                                className="bg-background"
                            >
                                {link.label}
                            </text>
                        </g>
                    )
                })}

                {/* Nodes */}
                {nodes.map((node, i) => (
                    <motion.g
                        key={node.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            fill={getNodeColor(node.type)}
                            className="cursor-pointer hover:opacity-80 transition-opacity shadow-lg"
                            stroke="white"
                            strokeWidth="2"
                        />
                        <text
                            x={node.x}
                            y={node.y! + 35}
                            textAnchor="middle"
                            className="text-xs font-medium fill-foreground pointer-events-none"
                        >
                            {node.id}
                        </text>
                    </motion.g>
                ))}
            </svg>
        </div>
    )
}
