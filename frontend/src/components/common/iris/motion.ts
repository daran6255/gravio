/** Matches the module-local check Reveal.tsx uses for landing-page motion, promoted to a
 * shared export now that every IRIS chat surface (TypingDots, StatusLabel, useIrisChatPanel)
 * needs the same check. */
export const prefersReducedMotion = (): boolean =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
