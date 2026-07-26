import React from 'react';
import { Box, Container, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Illustrative placeholder marks only — no real customers yet. Kept as a plain
// array of {mark, name} so real logos can be swapped in later without touching layout.
const PLACEHOLDER_LOGOS = [
	{ mark: '◆', name: 'Northline IT' },
	{ mark: '▲', name: 'Vantage Consulting' },
	{ mark: '●', name: 'Brightfield Staffing' },
	{ mark: '■', name: 'Solace Group' },
	{ mark: '◈', name: 'Kinetic Services' },
];

const LogosStrip: React.FC = () => {
	const theme = useTheme();

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
				<Stack direction="row" flexWrap="wrap" justifyContent="center" rowGap={2} columnGap={{ xs: 4, sm: 6 }}>
					{PLACEHOLDER_LOGOS.map((logo) => (
						<Stack key={logo.name} direction="row" alignItems="center" spacing={1} sx={{ opacity: 0.55 }}>
							<Typography sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary, lineHeight: 1 }}>{logo.mark}</Typography>
							<Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: '-0.01em' }}>
								{logo.name}
							</Typography>
						</Stack>
					))}
				</Stack>
				<Typography sx={{ textAlign: 'center', fontSize: '0.7rem', color: alpha(theme.palette.text.secondary, 0.7), mt: 2.5, fontStyle: 'italic' }}>
					Sample marks shown for illustration
				</Typography>
			</Container>
		</Box>
	);
};

export default LogosStrip;
