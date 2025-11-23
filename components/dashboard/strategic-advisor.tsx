"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Sparkles } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { TypingAnimator } from "@/components/typing-animator"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function StrategicAdvisor() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Commander, I am analyzing your Mission Dossier. How can I assist with your strategic assessment today?" }
    ])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg = input
        setInput("")
        setMessages(prev => [...prev, { role: "user", content: userMsg }])
        setIsTyping(true)

        // Mock AI Response Logic
        setTimeout(() => {
            let response = "I'm processing that intel..."
            const savedCount = user?.savedArticles.length || 0

            if (userMsg.toLowerCase().includes("summary") || userMsg.toLowerCase().includes("brief")) {
                if (savedCount === 0) {
                    response = "Your dossier is currently empty, Commander. Save some articles from the feed so I can generate a briefing."
                } else {
                    const topics = Array.from(new Set(user?.savedArticles.map(a => a.category || "General")))
                    response = `You have ${savedCount} classified documents in your dossier, focusing mainly on ${topics.slice(0, 3).join(", ")}. The situation appears volatile.`
                }
            } else if (userMsg.toLowerCase().includes("risk") || userMsg.toLowerCase().includes("threat")) {
                response = "Based on current global indicators, the risk level is ELEVATED. Monitor the Middle East and Eastern Europe sectors closely."
            } else {
                response = "Understood. I've updated the strategic log. Is there anything specific regarding the saved intelligence you need me to cross-reference?"
            }

            setMessages(prev => [...prev, { role: "assistant", content: response }])
            setIsTyping(false)
        }, 1500)
    }

    return (
        <Card className="h-[600px] flex flex-col border-none shadow-xl ring-1 ring-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <Bot className="h-6 w-6 text-primary" />
                    Strategic Advisor
                    <Badge variant="secondary" className="ml-auto text-xs">AI Online</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                {m.role === "assistant" && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted/50 border border-border/50 rounded-tl-none"
                                    }`}>
                                    {m.content}
                                </div>
                                {m.role === "user" && (
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <div className="bg-muted/50 border border-border/50 rounded-lg rounded-tl-none p-3 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/40 bg-muted/10">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
                        <Input
                            placeholder="Ask for a briefing or risk assessment..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            className="bg-background/50"
                        />
                        <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}

import { Badge } from "@/components/ui/badge"
