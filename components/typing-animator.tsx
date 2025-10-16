'use client'

import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

interface TypingAnimatorProps {
  text: string
  className?: string
}

export function TypingAnimator({ text, className }: TypingAnimatorProps) {
  const textArray = Array.from(text)

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.04 * i },
    }),
  }

  const child = {
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: -20,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <motion.div
      className={cn("flex justify-center", className)}
      style={{ overflow: 'hidden' }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {textArray.map((letter, index) => (
        <motion.span variants={child} key={index}>
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.div>
  )
}