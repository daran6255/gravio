import React from 'react';
import { Box, Stack, Typography, LinearProgress, alpha, useTheme } from '@mui/material';
import type { HRLeaveBalanceResponse } from '../../../../models/hr';
import { getAccent } from './accentColors';

interface LeaveTypeLegendProps {
	balances: HRLeaveBalanceResponse[];
}

const LeaveTypeLegend: React.FC<LeaveTypeLegendProps> = ({ balances }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box
			sx={{
				p: 2.5,
				borderRadius: '20px',
				height: '100%',
				bgcolor: theme.palette.background.paper,
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
				boxShadow: isDark
					? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)'
					: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
			}}
		>
			<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2.5 }}>Leave Types</Typography>

			{balances.length === 0 ? (
				<Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
					No leave types allocated yet.
				</Typography>
			) : (
				<Stack spacing={2.25}>
					{balances.map((balance, idx) => {
						const accent = getAccent(theme, idx);
						const usedPct = balance.allocated > 0 ? Math.min(100, Math.round((balance.used / balance.allocated) * 100)) : 0;
						return (
							<Box key={balance.public_id}>
								<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.6 }}>
									<Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
										<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }} />
										<Typography variant="body2" fontWeight={700} noWrap>{balance.leave_type_name}</Typography>
									</Stack>
									<Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ flexShrink: 0 }}>
										{balance.is_lop ? 'LOP' : `${balance.used}/${balance.allocated}`}
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={usedPct}
									sx={{
										height: 6, borderRadius: 3,
										bgcolor: alpha(accent, 0.12),
										'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: accent },
									}}
								/>
							</Box>
						);
					})}
				</Stack>
			)}
		</Box>
	);
};

export default LeaveTypeLegend;
