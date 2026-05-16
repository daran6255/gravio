import React from 'react';
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableRow,
	LinearProgress,
	Tooltip,
	alpha
} from '@mui/material';

interface DistributionMetricTableProps {
	title: string;
	data: Record<string, number>;
	icon: React.ReactNode;
	color: string;
	formatHours: (hours: number) => string;
}

const DistributionMetricTable: React.FC<DistributionMetricTableProps> = ({ 
	title, 
	data, 
	icon, 
	color,
	formatHours 
}) => {
	const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
	const maxHours = Math.max(...entries.map(([, h]) => h), 1);

	return (
		<Paper
			elevation={0}
			variant="outlined"
			sx={{
				p: 2.5,
				height: '100%',
				borderRadius: 2,
				borderColor: 'divider',
				bgcolor: 'background.paper',
				transition: 'all 0.2s',
				'&:hover': {
					borderColor: color,
					boxShadow: `0 4px 20px ${alpha(color, 0.08)}`
				}
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
				<Box sx={{
					color: 'common.white',
					bgcolor: color,
					p: 0.8,
					borderRadius: 1.5,
					display: 'flex',
					boxShadow: `0 2px 8px ${alpha(color, 0.3)}`
				}}>
					{React.cloneElement(icon as React.ReactElement<any>, { fontSize: 'small' })}
				</Box>
				<Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="text.primary">
					{title}
				</Typography>
			</Box>

			{entries.length === 0 ? (
				<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
					No records found for this category
				</Typography>
			) : (
				<Table size="small">
					<TableBody>
						{entries.map(([name, hours]) => {
							const percentage = (hours / maxHours) * 100;
							return (
								<TableRow key={name} sx={{ '&:last-child td': { border: 0 } }}>
									<TableCell sx={{ border: 'none', py: 1.2, pl: 0, width: '60%' }}>
										<Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
											{name}
										</Typography>
										<Tooltip title={`${Math.round(percentage)}% of max`} arrow placement="top">
											<LinearProgress
												variant="determinate"
												value={percentage}
												sx={{
													height: 4,
													borderRadius: 2,
													bgcolor: alpha(color, 0.08),
													'& .MuiLinearProgress-bar': {
														bgcolor: color,
														borderRadius: 2
													}
												}}
											/>
										</Tooltip>
									</TableCell>
									<TableCell align="right" sx={{ border: 'none', py: 1.2, pr: 0 }}>
										<Typography variant="body2" sx={{ fontWeight: 700 }} color="text.primary">
											{formatHours(hours)}
										</Typography>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</Paper>
	);
};

export default DistributionMetricTable;
