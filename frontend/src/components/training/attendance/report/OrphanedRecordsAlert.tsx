import React from 'react';
import { Box, Paper, Typography, Button, Tooltip, useTheme, alpha, Stack } from '@mui/material';
import { WarningAmber as WarningIcon, DeleteForever as DeleteForeverIcon } from '@mui/icons-material';

export interface OrphanedCandidate {
	candidateId: number;
	name: string;
	count: number;
}

interface OrphanedRecordsAlertProps {
	orphanedCandidates: OrphanedCandidate[];
	onClear: (candidate: OrphanedCandidate) => void;
}

const OrphanedRecordsAlert: React.FC<OrphanedRecordsAlertProps> = ({ orphanedCandidates, onClear }) => {
	const theme = useTheme();
	if (orphanedCandidates.length === 0) return null;

	return (
		<Paper
			elevation={0}
			sx={{ 
				mb: 4, 
				border: '1px solid',
				borderColor: 'warning.main', 
				borderRadius: 2, 
				overflow: 'hidden',
				boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.1)}`
			}}
		>
			{/* Header */}
			<Box 
				sx={{ 
					bgcolor: alpha(theme.palette.warning.main, 0.05), 
					px: 3, 
					py: 2, 
					borderBottom: '1px solid',
					borderColor: alpha(theme.palette.warning.main, 0.2), 
					display: 'flex', 
					alignItems: 'center', 
					gap: 2 
				}}
			>
				<WarningIcon sx={{ color: 'warning.main', fontSize: 24 }} />
				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'warning.dark', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
						Orphaned Attendance Records Detected
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.25 }}>
						These candidates have been removed from the batch but retain historical attendance data.
					</Typography>
				</Box>
			</Box>

			{/* Candidate rows */}
			<Stack>
				{orphanedCandidates.map(oc => (
					<Box
						key={oc.candidateId}
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							px: 3,
							py: 1.5,
							borderBottom: '1px solid',
							borderColor: 'divider',
							'&:last-child': { borderBottom: 'none' },
							bgcolor: 'background.paper',
							transition: 'background-color 0.2s',
							'&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.02) }
						}}
					>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
								{oc.name}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
								{oc.count} record{oc.count !== 1 ? 's' : ''} • No longer allocated
							</Typography>
						</Box>
						<Tooltip title={`Clear all ${oc.count} records for ${oc.name}`}>
							<Button
								variant="outlined"
								color="error"
								size="small"
								startIcon={<DeleteForeverIcon />}
								onClick={() => onClear(oc)}
								sx={{ 
									textTransform: 'none', 
									borderRadius: 1.5, 
									fontWeight: 700,
									borderWidth: '1.5px',
									'&:hover': { borderWidth: '1.5px', bgcolor: alpha(theme.palette.error.main, 0.05) }
								}}
							>
								Clear {oc.count} Records
							</Button>
						</Tooltip>
					</Box>
				))}
			</Stack>
		</Paper>
	);
};

export default OrphanedRecordsAlert;
