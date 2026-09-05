'use no memo'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

// Stable aliases so render does not touch the Motion proxy (React Compiler).
export const MotionButton = motion.button
export const MotionDiv = motion.div
export const MotionLi = motion.li
export const MotionP = motion.p
export const MotionSpan = motion.span
export const MotionUl = motion.ul

const SECTION_STAGGER_SECONDS = 0.06

export function sectionMountDelay(index: number): number {
  return index * SECTION_STAGGER_SECONDS
}

type FadeInOnMountProps = {
  children: ReactNode
  delay: number
}

export function FadeInOnMount({ children, delay }: FadeInOnMountProps) {
  const prefersReducedMotion = useReducedMotion() === true

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </MotionDiv>
  )
}
