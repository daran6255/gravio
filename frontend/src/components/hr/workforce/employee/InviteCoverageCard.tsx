import React from 'react';
import { Box, Typography, Stack, LinearProgress, alpha, useTheme } from '@mui/material';

interface InviteCoverageCardProps {
	total: number;
	invitedCount: number;
}

export const InviteCoverageCard: React.FC<InviteCoverageCardProps> = ({ total, invitedCount }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const invitedPct = total ? Math.round((invitedCount / total) * 100) : 0;
	const pendingPct = total ? 100 - invitedPct : 0;
	const pendingCount = total - invitedCount;

	return (
		<Box sx={{
			p: 2.5, borderRadius: '20px',
			bgcolor: theme.palette.background.paper,
			border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
			boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
		}}>
			<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Invite Coverage</Typography>

			<Stack spacing={0.5} sx={{ mb: 2 }}>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="caption" color="text.secondary" fontWeight={600}>Invited to Gravit</Typography>
					<Typography variant="caption" fontWeight={800}>{invitedPct}%</Typography>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={invitedPct}
					sx={{
						height: 6, borderRadius: 3,
						bgcolor: alpha(theme.palette.success.main, 0.12),
						'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'success.main' },
					}}
				/>
			</Stack>

			<Stack spacing={0.5}>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="caption" color="text.secondary" fontWeight={600}>Not Invited Yet</Typography>
					<Typography variant="caption" fontWeight={800}>{pendingPct}%</Typography>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={pendingPct}
					sx={{
						height: 6, borderRadius: 3,
						bgcolor: alpha(theme.palette.warning.main, 0.12),
						'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'warning.main' },
					}}
				/>
			</Stack>

			<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
				{pendingCount} of {total} employees are still waiting on a Gravit login invite.
			</Typography>
		</Box>
	);
};

export default InviteCoverageCard;
