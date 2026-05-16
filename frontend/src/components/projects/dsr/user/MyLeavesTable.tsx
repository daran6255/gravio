import React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
	IconButton,
	Box,
	Chip,
	Tooltip,
	CircularProgress
} from '@mui/material';
import {
	Cancel as CancelIcon,
	Info as InfoIcon
} from '@mui/icons-material';
import { useMyLeaves } from './hooks/useMyLeaves';
import dayjs from 'dayjs';
import type { DSRLeaveApplication } from '../../../../models/dsr';

const getStatusColor = (status: string) => {
	switch (status) {
		case 'approved': return 'success';
		case 'pending': return 'warning';
		case 'rejected': return 'error';
		case 'cancelled': return 'default';
		default: return 'default';
	}
};

const MyLeavesTable: React.FC = () => {
	const {
		leaves,
		loading,
		handleCancel
	} = useMyLeaves();

	if (loading && leaves.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress size={32} sx={{ color: '#ec7211' }} />
			</Box>
		);
	}

	if (leaves.length === 0) {
		return (
			<Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa' }}>
				<Typography variant="body1" color="text.secondary">
					No leave applications found.
				</Typography>
			</Paper>
		);
	}

	return (
		<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '2px' }}>
			<Table size="small">
				<TableHead sx={{ bgcolor: '#f8f9fa' }}>
					<TableRow>
						<TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Admin Notes</TableCell>
						<TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{leaves.map((leave: DSRLeaveApplication) => (
						<TableRow key={leave.public_id} hover>
							<TableCell sx={{ fontWeight: 600 }}>{leave.leave_type}</TableCell>
							<TableCell>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									{dayjs(leave.start_date).format('MMM DD, YYYY')} - {dayjs(leave.end_date).format('MMM DD, YYYY')}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1} day(s)
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{leave.reason || '-'}
								</Typography>
							</TableCell>
							<TableCell>
								<Chip
									label={leave.status.toUpperCase()}
									size="small"
									color={getStatusColor(leave.status) as any}
									sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
								/>
							</TableCell>
							<TableCell>
								{leave.admin_notes ? (
									<Tooltip title={leave.admin_notes}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', cursor: 'pointer' }}>
											<InfoIcon sx={{ fontSize: 16 }} />
											<Typography variant="caption">View Notes</Typography>
										</Box>
									</Tooltip>
								) : '-'}
							</TableCell>
							<TableCell align="right">
								{leave.status === 'pending' && (
									<Tooltip title="Cancel Leave">
										<IconButton
											size="small"
											color="error"
											onClick={() => handleCancel(leave.public_id)}
											sx={{ '&:hover': { bgcolor: '#fff1f0' } }}
										>
											<CancelIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default MyLeavesTable;
