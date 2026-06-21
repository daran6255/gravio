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
}

export const Spinner: React.FC<SpinnerProps> = ({
	text,
	subtext,
	size = 48,
	subtextInterval = 2500,
}) => {
	// Build the cycling list: if a custom subtext is provided, use it as the
	// first message and append the rest of the defaults.
	const messages = useRef<string[]>(
		subtext
			? [subtext, ...DEFAULT_MESSAGES.filter((m) => m !== subtext)]
			: DEFAULT_MESSAGES,
	);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [visible, setVisible] = useState(true); // drives the CSS opacity fade

	useEffect(() => {
		const cycle = setInterval(() => {
			// Fade out
			setVisible(false);

			// After fade-out duration (400 ms), switch text and fade back in
			setTimeout(() => {
				setCurrentIndex((prev) => (prev + 1) % messages.current.length);
				setVisible(true);
			}, 400);
		}, subtextInterval);

		return () => clearInterval(cycle);
	}, [subtextInterval]);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Box
				component="img"
				src="/assets/img/spinner/gravit-spinner-G2-dual-ring.svg"
				alt="Loading..."
				sx={{
					width: size,
					height: size,
					filter: 'drop-shadow(0 0 8px rgba(139, 124, 246, 0.3))',
					marginBottom: text ? '24px' : 0,
				}}
			/>

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
					minHeight: '16px',          // prevents layout jump during transition
					textAlign: 'center',
					maxWidth: '280px',
					opacity: visible ? 1 : 0,
					transition: 'opacity 0.4s ease-in-out',
				}}
			>
				{messages.current[currentIndex]}
			</Typography>
		</Box>
	);
};

export default Spinner;
