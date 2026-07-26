import React, { useEffect, useRef, useState } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface RevealProps {
	children: React.ReactNode;
	/** Stagger delay in ms, applied via transition-delay */
	delay?: number;
	sx?: SxProps<Theme>;
}

/**
 * Fades + slides content in once when it enters the viewport. Reads
 * prefers-reduced-motion once on mount (module-level, no live media
 * listener needed for a single fade-in) and renders content statically
 * visible for users who requested reduced motion.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, sx }) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [visible, setVisible] = useState(prefersReducedMotion());

	useEffect(() => {
		if (visible) return;
		const node = ref.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
		);
		observer.observe(node);
		return () => observer.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Box
			ref={ref}
			sx={{
				opacity: visible ? 1 : 0,
				transform: visible ? 'translateY(0)' : 'translateY(24px)',
				transition: `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`,
				...sx,
			}}
		>
			{children}
		</Box>
	);
};

export default Reveal;
