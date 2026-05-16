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
import { Info as InfoIcon } from '@mui/icons-material';

interface AdditionalSessionsProps {
	unassignedData: Record<string, { hours: number; type: string }>;
	formatHours: (hours: number) => string;
}

const AdditionalSessions: React.FC<AdditionalSessionsProps> = ({ unassignedData, formatHours }) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			variant="outlined"
			sx={{
				p: 3,
				borderColor: 'divider',
				bgcolor: alpha(theme.palette.background.paper, 0.4),
				borderRadius: 2,
				height: '100%',
				borderLeft: '4px solid',
				borderLeftColor: 'text.secondary'
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
					<Box sx={{ p: 1, bgcolor: theme.palette.text.secondary, borderRadius: 2, color: 'common.white', display: 'flex' }}>
						<InfoIcon />
					</Box>
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="text.primary">Additional Sessions</Typography>
				</Box>
				<Typography variant="caption" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.08), color: 'text.secondary', px: 1, borderRadius: 1, fontWeight: 700 }}>
					Independent
				</Typography>
			</Box>

			<TableContainer sx={{ maxHeight: 320, overflowY: 'auto' }}>
				<Table size="small">
					<TableBody>
						{Object.entries(unassignedData)
							.sort((a, b) => b[1].hours - a[1].hours)
							.map(([name, data]) => (
								<TableRow key={name} sx={{ '&:last-child td': { border: 0 } }}>
									<TableCell sx={{ py: 1.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>
											{data.type.replace('_', ' ')}
										</Typography>
									</TableCell>
									<TableCell align="right" sx={{ py: 1.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 600 }} color="text.primary">
											{formatHours(data.hours)}
										</Typography>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default AdditionalSessions;
