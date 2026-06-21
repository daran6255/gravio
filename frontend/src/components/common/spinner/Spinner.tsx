import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

const DEFAULT_MESSAGES = [
	'Establishing secure console connection...',
	'Loading your workspace configuration...',
	'Syncing organization data...',
	'Preparing your personalized dashboard...',
	'Almost there — just a moment...',
];

interface SpinnerProps {
	text?: string;
	/** Pass a custom first message or leave blank to use the built-in cycling set */
	subtext?: string;
	size?: number;
	/** Interval in ms between subtext transitions (default 2500) */
	subtextInterval?: number;
	/**
	 * fullPage — renders the full-screen loading experience:
	 * dark radial-gradient background, ambient aurora glows, and
	 * the Gravit wordmark logo above the spinner.
	 * Use this in AuthInitializer / ProtectedRoute so Phase-1 (index.html)
	 * and Phase-2 (React) look identical with no jarring flash.
	 */
	fullPage?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
	text,
	subtext,
	size = 48,
	subtextInterval = 2500,
	fullPage = false,
}) => {
	// Build the cycling list: if a custom subtext is provided, use it as the
	// first message and append the rest of the defaults.
	const messages = useRef<string[]>(
		subtext
			? [subtext, ...DEFAULT_MESSAGES.filter((m) => m !== subtext)]
			: DEFAULT_MESSAGES,
	);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const cycle = setInterval(() => {
			setVisible(false);
			setTimeout(() => {
				setCurrentIndex((prev) => (prev + 1) % messages.current.length);
				setVisible(true);
			}, 400);
		}, subtextInterval);

		return () => clearInterval(cycle);
	}, [subtextInterval]);

	/** Core spinner content — shared between inline and full-page modes */
	const content = (
		<Box
			sx={{
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 10,
			}}
		>
			{/* Dual-ring SVG spinner */}
			<Box
				component="img"
				src="/assets/img/spinner/gravit-spinner-G2-dual-ring.svg"
				alt="Loading..."
				sx={{
					width: size,
					height: size,
					filter: 'drop-shadow(0 0 10px rgba(139, 124, 246, 0.35))',
					marginBottom: text || fullPage ? '24px' : 0,
				}}
			/>

			{/* Primary label */}
			{text && (
				<Typography
					variant="caption"
					sx={{
						color: '#F4F5F7',
						fontSize: '13px',
						fontWeight: 600,
						letterSpacing: '0.1em',
						textTransform: 'uppercase',
						opacity: 0.85,
						textShadow: '0 2px 8px rgba(0,0,0,0.5)',
						animation: 'pulseText 1.5s infinite ease-in-out',
						'@keyframes pulseText': {
							'0%, 100%': { opacity: 0.6 },
							'50%': { opacity: 0.95 },
						},
					}}
				>
					{text}
				</Typography>
			)}

			{/* Dynamic cycling subtext */}
			<Typography
				variant="caption"
				sx={{
					color: '#64748B',
					fontSize: '11px',
					fontWeight: 500,
					marginTop: text ? '8px' : 0,
					letterSpacing: '0.05em',
					minHeight: '16px',
					textAlign: 'center',
					maxWidth: '300px',
					opacity: visible ? 1 : 0,
					transition: 'opacity 0.4s ease-in-out',
				}}
			>
				{messages.current[currentIndex]}
			</Typography>
		</Box>
	);

	if (!fullPage) return content;

	/** Full-page wrapper — mirrors the index.html root-loader exactly */
	return (
		<Box
			sx={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'radial-gradient(circle at 50% 50%, #0c0f1d 0%, #030407 100%)',
				zIndex: 9999,
				overflow: 'hidden',
			}}
		>
			{/* Ambient aurora — top-left */}
			<Box
				sx={{
					position: 'absolute',
					top: '-20%',
					left: '-20%',
					width: '60vw',
					height: '60vw',
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(139, 124, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
					filter: 'blur(80px)',
					animation: 'drift 20s infinite alternate ease-in-out',
					pointerEvents: 'none',
					'@keyframes drift': {
						'0%': { transform: 'translate(0, 0) scale(1)' },
						'100%': { transform: 'translate(10%, 10%) scale(1.1)' },
					},
				}}
			/>
			{/* Ambient aurora — bottom-right */}
			<Box
				sx={{
					position: 'absolute',
					bottom: '-20%',
					right: '-20%',
					width: '50vw',
					height: '50vw',
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(78, 168, 255, 0.06) 0%, rgba(0,0,0,0) 70%)',
					filter: 'blur(60px)',
					animation: 'drift 15s infinite alternate-reverse ease-in-out',
					pointerEvents: 'none',
				}}
			/>

			{content}
		</Box>
	);
};

export default Spinner;
