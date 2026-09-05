import { useReducedMotion } from 'motion/react'

export function useUiMotion() {
  const prefersReducedMotion = useReducedMotion() === true

  return {
    prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 0.22,
  }
}
