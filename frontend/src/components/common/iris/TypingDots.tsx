import React from 'react';
import { Box, Stack, keyframes } from '@mui/material';

const BRAND = '#8B7CF6';

const dotPulse = keyframes`
	0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
	40% { opacity: 1; transform: scale(1); }
`;

const noMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } } as const;

/** Three-dot "IRIS is working" pulse -- the AI-native pattern the design system calls for
 * instead of a generic spinner, reused both standalone (status row) and inline (a message
 * still streaming with no tokens yet). Shared across every IRIS chat surface (ChatDrawer +
 * the per-module panels) so they all read as the same product. */
export const TypingDots: React.FC<{ color?: string }> = ({ color = BRAND }) => (
	<Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.25, py: 0.5 }}>
		{[0, 1, 2].map((i) => (
			<Box
				key={i}
				sx={{
					width: 5,
					height: 5,
					borderRadius: '50%',
					bgcolor: color,
					animation: `${dotPulse} 1.2s ease-in-out infinite`,
					animationDelay: `${i * 0.16}s`,
					...noMotion,
				}}
			/>
		))}
	</Stack>
);

export default TypingDots;
