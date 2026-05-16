import React from 'react';
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	useTheme,
	alpha
} from '@mui/material';
import { Badge as TrainerIcon } from '@mui/icons-material';

interface TrainerContributionsProps {
	trainerData: Record<string, { total: number; sessions: Record<string, { hours: number; type: string }> }>;
	formatHours: (hours: number) => string;
}

const TrainerContributions: React.FC<TrainerContributionsProps> = ({ trainerData, formatHours }) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			variant="outlined"
			sx={{
				p: 3,
				borderColor: 'divider',
				bgcolor: alpha(theme.palette.background.paper, 0.5),
				borderRadius: 2,
				height: '100%'
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
				<Box sx={{ p: 1, bgcolor: theme.palette.secondary.light, borderRadius: 2, color: 'common.white', display: 'flex' }}>
					<TrainerIcon />
				</Box>
				<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Trainer Contributions</Typography>
			</Box>

			{Object.entries(trainerData).length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 4 }}>
					<Typography variant="body2" color="text.secondary">
						No trainer assignments detected in this period.
					</Typography>
				</Box>
			) : (
				<TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
					<Table size="small">
						<TableBody>
							{Object.entries(trainerData)
								.sort((a, b) => b[1].total - a[1].total)
								.map(([name, data]) => (
									<React.Fragment key={name}>
										<TableRow sx={{ bgcolor: alpha(theme.palette.secondary.light, 0.05) }}>
											<TableCell sx={{ py: 1.5 }}>
												<Typography variant="body2" sx={{ fontWeight: 700 }} color="secondary.light">
													{name}
												</Typography>
											</TableCell>
											<TableCell align="right" sx={{ py: 1.5 }}>
												<Typography variant="body2" sx={{ fontWeight: 800 }} color="secondary.light">
													{formatHours(data.total)}
												</Typography>
											</TableCell>
										</TableRow>
										{Object.entries(data.sessions)
											.sort((a, b) => b[1].hours - a[1].hours)
											.map(([sessionName, sessionData]) => (
												<TableRow key={sessionName} sx={{ '&:last-child td': { borderBottom: '1px solid', borderColor: 'divider' } }}>
													<TableCell sx={{ py: 1, pl: 4 }}>
														<Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
															{sessionName}
														</Typography>
														<Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8, textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 700 }}>
															{sessionData.type.replace('_', ' ')}
														</Typography>
													</TableCell>
													<TableCell align="right" sx={{ py: 1 }}>
														<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
															{formatHours(sessionData.hours)}
														</Typography>
													</TableCell>
												</TableRow>
											))}
									</React.Fragment>
								))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Paper>
	);
};

export default TrainerContributions;
