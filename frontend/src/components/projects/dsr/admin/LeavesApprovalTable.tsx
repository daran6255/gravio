import React, { useState } from 'react';
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
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField
} from '@mui/material';
import dayjs from 'dayjs';
import { useAppSelector } from '../../../../store/hooks';

import type { DSRLeaveApplication } from '../../../../models/dsr';
import DSRAdminTableHeader from './DSRAdminTableHeader';
import CustomTablePagination from '../../../common/table/CustomTablePagination';
import FilterDrawer from '../../../common/drawer/FilterDrawer';

interface LeavesApprovalTableProps {
	leaves: DSRLeaveApplication[];
	total: number;
	loading: boolean;
	onHandle: (publicId: string, status: 'approved' | 'rejected', admin_notes?: string) => void;
	onRefresh: () => void;
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

const LeavesApprovalTable: React.FC<LeavesApprovalTableProps> = ({
	leaves,
	total,
	loading,
	onHandle,
	onRefresh,
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
	const isAdmin = user?.role === 'admin' || user?.role === 'manager';
	
	const [actionDialog, setActionDialog] = useState<{
		open: boolean;
		publicId: string;
		status: 'approved' | 'rejected';
		notes: string;
	}>({
		open: false,
		publicId: '',
		status: 'approved',
		notes: ''
	});

	const handleApplyFilters = () => {
		onFilterDrawerOpen(false);
		onRefresh();
	};

	const handleClearFilters = () => {
		onStatusFilterChange(null);
		onRefresh();
	};

	const openActionDialog = (publicId: string, status: 'approved' | 'rejected') => {
		setActionDialog({
			open: true,
			publicId,
			status,
			notes: ''
		});
	};

	const handleActionConfirm = () => {
		onHandle(actionDialog.publicId, actionDialog.status, actionDialog.notes);
		setActionDialog({ ...actionDialog, open: false });
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
							{ label: 'Approved', value: 'approved' },
							{ label: 'Rejected', value: 'rejected' },
							{ label: 'Cancelled', value: 'cancelled' }
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
					Leave Applications
				</Typography>
			</Box>
			<Paper sx={{ border: '1px solid #d5dbdb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
				<DSRAdminTableHeader
					searchTerm=""
					onSearchChange={() => {}}
					onRefresh={onRefresh}
					placeholder="Search leaves..."
					onFilterOpen={() => onFilterDrawerOpen(true)}
					activeFilterCount={statusFilter ? 1 : 0}
					hideSearch
				/>

				<TableContainer>
					<Table sx={{ minWidth: 650 }}>
						<TableHead>
							<TableRow sx={{ bgcolor: '#fafafa' }}>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Employee</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Dates</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Type/Reason</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Status</TableCell>
								<TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 4 }}>
										<CircularProgress size={24} />
										<Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading leaves...</Typography>
									</TableCell>
								</TableRow>
							) : !leaves || leaves.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 4 }}>
										<Typography variant="body2" color="text.secondary">
											No leave applications found.
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								leaves.map((leave) => (
									<TableRow
										key={leave.public_id}
										sx={{
											'&:hover': { bgcolor: '#f5f8fa' },
											'&:last-child td': { borderBottom: 0 }
										}}
									>
										<TableCell sx={{ fontWeight: 500 }}>
											{leave.user?.full_name || leave.user?.username || `User ${leave.user_id}`}
										</TableCell>
										<TableCell>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{dayjs(leave.start_date).format('DD MMM')} - {dayjs(leave.end_date).format('DD MMM YYYY')}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1} day(s)
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>{leave.leave_type}</Typography>
											<Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300 }} noWrap title={leave.reason || ''}>
												{leave.reason || ''}
											</Typography>
										</TableCell>
										<TableCell>
											<Chip
												label={leave.status.toUpperCase()}
												size="small"
												color={
													leave.status === 'pending' ? 'warning' : 
													leave.status === 'approved' ? 'success' : 
													leave.status === 'rejected' ? 'error' : 'default'
												}
												variant="outlined"
												sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}
											/>
										</TableCell>
										<TableCell align="right">
											{leave.status === 'pending' && isAdmin && (
												<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
													<Button
														size="small"
														variant="contained"
														color="success"
														onClick={() => openActionDialog(leave.public_id, 'approved')}
														sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
													>
														Approve
													</Button>
													<Button
														size="small"
														variant="outlined"
														color="error"
														onClick={() => openActionDialog(leave.public_id, 'rejected')}
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

			<Dialog open={actionDialog.open} onClose={() => setActionDialog({ ...actionDialog, open: false })}>
				<DialogTitle>
					{actionDialog.status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
				</DialogTitle>
				<DialogContent sx={{ minWidth: 400, pt: 1 }}>
					<TextField
						fullWidth
						multiline
						rows={3}
						label="Admin Notes"
						placeholder="Add any internal notes..."
						value={actionDialog.notes}
						onChange={(e) => setActionDialog({ ...actionDialog, notes: e.target.value })}
						sx={{ mt: 1 }}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setActionDialog({ ...actionDialog, open: false })}>
						Cancel
					</Button>
					<Button 
						variant="contained" 
						color={actionDialog.status === 'approved' ? 'success' : 'error'}
						onClick={handleActionConfirm}
						sx={{ fontWeight: 700, boxShadow: 'none' }}
					>
						Confirm {actionDialog.status === 'approved' ? 'Approval' : 'Rejection'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default React.memo(LeavesApprovalTable);
