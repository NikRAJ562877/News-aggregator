"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import * as React from "react"

const MotionCard = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Card>>(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
      className
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    {...props}
  />
))

MotionCard.displayName = "MotionCard"

export { MotionCard }
