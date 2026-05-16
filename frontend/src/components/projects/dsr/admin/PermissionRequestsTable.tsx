import React from 'react';
import {
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Chip,
	Button,
	Typography,
	Box,
	Paper,
	CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { useAppSelector } from '../../../../store/hooks';

import type { DSRPermissionRequest } from '../../../../models/dsr';
import DSRAdminTableHeader from './DSRAdminTableHeader';
import CustomTablePagination from '../../../common/table/CustomTablePagination';
import FilterDrawer from '../../../common/drawer/FilterDrawer';

interface PermissionRequestsTableProps {
	requests: DSRPermissionRequest[];
	total: number;
	loading: boolean;
	onHandle: (publicId: string, status: 'granted' | 'rejected') => void;
	onRefresh: () => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onRowsPerPageSelectChange: (rows: number) => void;
	statusFilter: string | null;
	onStatusFilterChange: (value: string | null) => void;
	filterDrawerOpen: boolean;
	onFilterDrawerOpen: (open: boolean) => void;
}

const PermissionRequestsTable: React.FC<PermissionRequestsTableProps> = ({
	requests,
	total,
	loading,
	onHandle,
	onRefresh,
	searchTerm,
	onSearchChange,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	onRowsPerPageSelectChange,
	statusFilter,
	onStatusFilterChange,
	filterDrawerOpen,
	onFilterDrawerOpen
}) => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';
	const displayRequests = requests;

	const handleApplyFilters = () => {
		onFilterDrawerOpen(false);
		onRefresh();
	};

	const handleClearFilters = () => {
		onStatusFilterChange(null);
		onRefresh();
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => onFilterDrawerOpen(false)}
				fields={[
					{
						key: 'status',
						label: 'Status',
						type: 'single-select',
						options: [
							{ label: 'Pending', value: 'pending' },
							{ label: 'Granted', value: 'granted' },
							{ label: 'Rejected', value: 'rejected' }
						]
					}
				]}
				activeFilters={{
					status: statusFilter
				}}
				onFilterChange={(key, value) => {
					if (key === 'status') onStatusFilterChange(value);
				}}
				onApplyFilters={handleApplyFilters}
				onClearFilters={handleClearFilters}
			/>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="h6" sx={{ fontWeight: 700, color: '#232f3e' }}>
					Permission Requests
				</Typography>
			</Box>
			<Paper sx={{ border: '1px solid #d5dbdb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
				<DSRAdminTableHeader
					searchTerm={searchTerm}
					onSearchChange={onSearchChange}
					onRefresh={onRefresh}
					placeholder="Search by requester or reason..."
					onFilterOpen={() => onFilterDrawerOpen(true)}
					activeFilterCount={statusFilter ? 1 : 0}
				/>

				<TableContainer>
					<Table sx={{ minWidth: 650 }}>
						<TableHead>
							<TableRow sx={{ bgcolor: '#fafafa' }}>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Employee</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Requested Date</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Reason</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Status</TableCell>
								<TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 4 }}>
										<CircularProgress size={24} />
										<Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading requests...</Typography>
									</TableCell>
								</TableRow>
							) : !displayRequests || displayRequests.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 4 }}>
										<Typography variant="body2" color="text.secondary">
											{searchTerm ? 'No matches found for your search.' : 'No pending permission requests.'}
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								displayRequests.map((req) => (
									<TableRow
										key={req.public_id}
										sx={{
											'&:hover': { bgcolor: '#f5f8fa' },
											'&:last-child td': { borderBottom: 0 }
										}}
									>
										<TableCell sx={{ fontWeight: 500 }}>{req.user?.full_name || 'User'}</TableCell>
										<TableCell>{dayjs(req.report_date).format('DD/MMM/YYYY')}</TableCell>
										<TableCell>
											<Box sx={{ py: 1 }}>
												<Typography 
													variant="body2" 
													sx={{ 
														maxWidth: 400,
														wordBreak: 'break-word',
														lineHeight: 1.5,
														color: 'text.primary'
													}}
												>
													{req.reason}
												</Typography>
											</Box>
										</TableCell>
										<TableCell>
											<Chip
												label={req.status.toUpperCase()}
												size="small"
												color={req.status === 'pending' ? 'warning' : req.status === 'granted' ? 'success' : 'error'}
												variant="outlined"
												sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}
											/>
										</TableCell>
										<TableCell align="right">
											{req.status === 'pending' && isAdmin && (
												<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
													<Button
														size="small"
														variant="contained"
														color="success"
														onClick={() => onHandle(req.public_id, 'granted')}
														sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
													>
														Approve
													</Button>
													<Button
														size="small"
														variant="outlined"
														color="error"
														onClick={() => onHandle(req.public_id, 'rejected')}
														sx={{ textTransform: 'none', fontWeight: 700 }}
													>
														Reject
													</Button>
												</Box>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>

				<CustomTablePagination
					count={total}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={onPageChange}
					onRowsPerPageChange={onRowsPerPageChange}
					onRowsPerPageSelectChange={onRowsPerPageSelectChange}
				/>
			</Paper>
		</Box>
	);
};

export default React.memo(PermissionRequestsTable);
