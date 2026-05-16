import React, { useState, useMemo } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
	Chip,
	Box,
	CircularProgress,
	Tabs,
	Tab
} from '@mui/material';
import { format } from 'date-fns';
import type { DSRPermissionRequest } from '../../../../models/dsr';

interface MyPermissionRequestsProps {
	requests: DSRPermissionRequest[];
	loading: boolean;
}

const getStatusChip = (status: string) => {
	switch (status) {
		case 'granted':
			return <Chip label="Approved" size="small" sx={{ bgcolor: '#e6f4ea', color: '#1e7e34', fontWeight: 700, borderRadius: '2px' }} />;
		case 'rejected':
			return <Chip label="Rejected" size="small" sx={{ bgcolor: '#fdf3f1', color: '#d13212', fontWeight: 700, borderRadius: '2px' }} />;
		default:
			return <Chip label="Pending" size="small" sx={{ bgcolor: '#f1faff', color: '#0067b0', fontWeight: 700, borderRadius: '2px' }} />;
	}
};

const MyPermissionRequests: React.FC<MyPermissionRequestsProps> = ({ requests, loading }) => {
	const [activeTab, setActiveTab] = useState(0);

	const filteredRequests = useMemo(() => {
		switch (activeTab) {
			case 1: // Raised (Pending)
				return requests.filter(r => r.status === 'pending');
			case 2: // Approved (Granted)
				return requests.filter(r => r.status === 'granted');
			case 3: // Rejected
				return requests.filter(r => r.status === 'rejected');
			default:
				return requests;
		}
	}, [requests, activeTab]);

	if (loading && requests.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress size={24} sx={{ color: '#ec7211' }} />
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
				<Tabs
					value={activeTab}
					onChange={(_, v) => setActiveTab(v)}
					sx={{
						minHeight: 40,
						'& .MuiTab-root': {
							textTransform: 'none',
							fontWeight: 700,
							minHeight: 40,
							fontSize: '0.875rem',
							color: '#545b64',
							'&.Mui-selected': { color: '#ec7211' }
						},
						'& .MuiTabs-indicator': { backgroundColor: '#ec7211' }
					}}
				>
					<Tab label="All" />
					<Tab label={`Raised (${requests.filter(r => r.status === 'pending').length})`} />
					<Tab label={`Approved (${requests.filter(r => r.status === 'granted').length})`} />
					<Tab label={`Rejected (${requests.filter(r => r.status === 'rejected').length})`} />
				</Tabs>
			</Box>

			{filteredRequests.length === 0 ? (
				<Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', borderRadius: '2px', borderStyle: 'dashed' }}>
					<Typography variant="body2" sx={{ color: '#545b64' }}>
						No {activeTab === 0 ? '' : activeTab === 1 ? 'pending' : activeTab === 2 ? 'approved' : 'rejected'} permission requests found.
					</Typography>
				</Paper>
			) : (
				<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '2px', borderColor: '#d5dbdb' }}>
					<Table size="small">
						<TableHead sx={{ bgcolor: '#f3f3f3' }}>
							<TableRow>
								<TableCell sx={{ fontWeight: 700, color: '#545b64' }}>Report Date</TableCell>
								<TableCell sx={{ fontWeight: 700, color: '#545b64' }}>Reason</TableCell>
								<TableCell sx={{ fontWeight: 700, color: '#545b64' }}>Status</TableCell>
								<TableCell sx={{ fontWeight: 700, color: '#545b64' }}>Admin Notes</TableCell>
								<TableCell sx={{ fontWeight: 700, color: '#545b64' }}>Requested On</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredRequests.map((req) => (
								<TableRow key={req.public_id} sx={{ '&:hover': { bgcolor: '#fbfbfb' } }}>
									<TableCell sx={{ fontWeight: 500 }}>
										{format(new Date(req.report_date), 'dd MMM yyyy')}
									</TableCell>
									<TableCell sx={{ color: '#232f3e' }}>{req.reason}</TableCell>
									<TableCell>{getStatusChip(req.status)}</TableCell>
									<TableCell sx={{ color: '#545b64', fontStyle: 'italic' }}>
										{req.admin_notes || '-'}
									</TableCell>
									<TableCell sx={{ color: '#545b64', fontSize: '0.75rem' }}>
										{format(new Date(req.created_at), 'dd MMM yyyy, HH:mm')}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default MyPermissionRequests;
