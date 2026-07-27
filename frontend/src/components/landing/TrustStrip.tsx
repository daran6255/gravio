import React from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { VpnKey as VpnKeyIcon, Speed as SpeedIcon, Storage as StorageIcon, Dns as DnsIcon } from '@mui/icons-material';

const TRUST_POINTS = [
	{ icon: VpnKeyIcon, label: 'JWT authentication & strict CORS' },
	{ icon: SpeedIcon, label: 'Redis-backed rate limiting' },
	{ icon: DnsIcon, label: 'Load-balanced, async-first infrastructure' },
	{ icon: StorageIcon, label: 'Isolated per-tenant PostgreSQL data' },
];

const TrustStrip: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" id="security" sx={{ bgcolor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, py: 3.5 }}>
			<Container maxWidth="lg">
				<Stack direction="row" flexWrap="wrap" justifyContent="center" rowGap={2} columnGap={{ xs: 3, sm: 5 }}>
					{TRUST_POINTS.map((point) => (
						<Stack key={point.label} direction="row" alignItems="center" spacing={1}>
							<point.icon sx={{ fontSize: 18, color: theme.palette.accent.dark }} />
							<Typography sx={{ fontSize: theme.typography.body2.fontSize, fontWeight: 600, color: theme.palette.text.secondary }}>
								{point.label}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Container>
		</Box>
	);
};

export default TrustStrip;
