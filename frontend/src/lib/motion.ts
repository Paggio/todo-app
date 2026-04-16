/** True when the user prefers reduced motion. Evaluated once at module load. */
export const prefersReducedMotion: boolean =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Returns 0 when reduced motion is preferred, otherwise the given duration. */
export function motionDuration(ms: number): number {
  return prefersReducedMotion ? 0 : ms
}
