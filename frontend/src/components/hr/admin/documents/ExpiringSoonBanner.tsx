import React, { useMemo } from 'react';
import { Box, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import { EventBusyOutlined as ExpiringIcon } from '@mui/icons-material';
import type { HREmployeeDocument } from '../../../../models/hr';

interface ExpiringSoonBannerProps {
	documents: HREmployeeDocument[];
}

const ExpiringSoonBanner: React.FC<ExpiringSoonBannerProps> = ({ documents }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const expiring = useMemo(() => {
		const today = new Date();
		const in30Days = new Date();
		in30Days.setDate(today.getDate() + 30);
		return documents
			.filter((d) => {
				if (!d.expiry_date) return false;
				const exp = new Date(d.expiry_date);
				return exp >= today && exp <= in30Days;
			})
			.sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime());
	}, [documents]);

	if (expiring.length === 0) return null;

	return (
		<Box
			sx={{
				p: 2,
				borderRadius: '16px',
				border: '1px solid',
				borderColor: alpha(theme.palette.error.main, 0.3),
				bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.05),
			}}
		>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
				<ExpiringIcon sx={{ fontSize: '1.1rem', color: 'error.main' }} />
				<Typography variant="subtitle2" fontWeight={800} color="error.main">
					{expiring.length} document{expiring.length !== 1 ? 's' : ''} expiring within 30 days
				</Typography>
			</Stack>
			<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
				{expiring.slice(0, 8).map((doc) => (
					<Chip
						key={doc.id}
						label={`${doc.employee_name} · ${doc.document_type} · ${new Date(doc.expiry_date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
						size="small"
						sx={{ bgcolor: theme.palette.background.paper, fontWeight: 600, fontSize: '0.72rem' }}
					/>
				))}
				{expiring.length > 8 && (
					<Chip label={`+${expiring.length - 8} more`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
				)}
			</Stack>
		</Box>
	);
};

export default ExpiringSoonBanner;
