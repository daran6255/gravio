import React from 'react';
import { Box, Container, Stack, Typography, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Illustrative placeholder marks only — no real customers yet. Kept as a plain
// array of {mark, name} so real logos can be swapped in later without touching layout.
const PLACEHOLDER_LOGOS = [
	{ mark: '◆', name: 'Northline IT' },
	{ mark: '▲', name: 'Vantage Consulting' },
	{ mark: '●', name: 'Brightfield Staffing' },
	{ mark: '■', name: 'Solace Group' },
	{ mark: '◈', name: 'Kinetic Services' },
	{ mark: '◎', name: 'Redwood Partners' },
	{ mark: '◇', name: 'Meridian Tech' },
	{ mark: '▶', name: 'Anchorpoint IT' },
];

const scroll = keyframes`
	from { transform: translateX(0); }
	to { transform: translateX(-50%); }
`;

const LogosStrip: React.FC = () => {
	const theme = useTheme();
	// Two copies back-to-back so translating exactly -50% loops seamlessly.
	const track = [...PLACEHOLDER_LOGOS, ...PLACEHOLDER_LOGOS];

	return (
		<Box component="section" sx={{ bgcolor: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.divider}`, py: 5 }}>
			<Container maxWidth="lg">
				<Typography
					sx={{
						textAlign: 'center',
						fontSize: '0.75rem',
						fontWeight: 700,
						letterSpacing: '0.1em',
						textTransform: 'uppercase',
						color: theme.palette.text.secondary,
						mb: 3,
					}}
				>
					Built for growing service businesses
				</Typography>
			</Container>

			<Box
				sx={{
					overflow: 'hidden',
					maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
					WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
					'&:hover .logos-track': { animationPlayState: 'paused' },
				}}
			>
				<Stack
					direction="row"
					className="logos-track"
					spacing={{ xs: 5, sm: 7 }}
					sx={{
						width: 'max-content',
						animation: `${scroll} 32s linear infinite`,
						'@media (prefers-reduced-motion: reduce)': { animation: 'none' },
					}}
				>
					{track.map((logo, i) => (
						<Stack key={`${logo.name}-${i}`} direction="row" alignItems="center" spacing={1} sx={{ opacity: 0.55, flexShrink: 0 }}>
							<Typography sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary, lineHeight: 1 }}>{logo.mark}</Typography>
							<Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
								{logo.name}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Box>

			<Typography sx={{ textAlign: 'center', fontSize: '0.7rem', color: theme.palette.text.secondary, opacity: 0.7, mt: 2.5, fontStyle: 'italic' }}>
				Sample marks shown for illustration
			</Typography>
		</Box>
	);
};

export default LogosStrip;
