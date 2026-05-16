import React from 'react';
import {
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Chip,
	Box,
	Paper,
	CircularProgress,
	Typography,
	IconButton,
	Tooltip
} from '@mui/material';
import { Visibility, SettingsBackupRestore as RevokeIcon } from '@mui/icons-material';
import CustomTablePagination from '../../../common/table/CustomTablePagination';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	TextField,
	DialogActions,
	Button
} from '@mui/material';
import type { DSREntry } from '../../../../models/dsr';
import DSRAdminTableHeader from './DSRAdminTableHeader';
import FilterDrawer from '../../../common/drawer/FilterDrawer';
import DSRSubmissionDialog from '../forms/DSRSubmissionDialog';
import dayjs from 'dayjs';

interface AllSubmissionsTableProps {
	entries: DSREntry[];
	total: number;
	loading: boolean;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onRowsPerPageSelectChange: (rows: number) => void;
	onRefresh: () => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	statusFilter: string | null;
	onStatusFilterChange: (status: string | null) => void;
	dateFrom: string | null;
	onDateFromChange: (value: string | null) => void;
	dateTo: string | null;
	onDateToChange: (value: string | null) => void;
	filterDrawerOpen: boolean;
	onFilterDrawerOpen: (open: boolean) => void;
	onRevoke?: (publicId: string, reason?: string) => void;
}

const AllSubmissionsTable: React.FC<AllSubmissionsTableProps> = ({
	entries,
	total,
	loading,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	onRowsPerPageSelectChange,
	onRefresh,
	searchTerm,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	dateFrom,
	onDateFromChange,
	dateTo,
	onDateToChange,
	filterDrawerOpen,
	onFilterDrawerOpen,
	onRevoke
}) => {
	const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
	const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);
	const [revokeTargetId, setRevokeTargetId] = React.useState<string | null>(null);
	const [revokeReason, setRevokeReason] = React.useState('');
	const displayEntries = entries;

	const activeFilterCount = [statusFilter, dateFrom, dateTo].filter(Boolean).length;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="h6" sx={{ fontWeight: 700, color: '#232f3e' }}>
					Submission History
				</Typography>
			</Box>
			<Paper sx={{ border: '1px solid #d5dbdb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
				<DSRAdminTableHeader
					searchTerm={searchTerm}
					onSearchChange={onSearchChange}
					onRefresh={onRefresh}
					placeholder="Search by employee..."
					activeFilterCount={activeFilterCount}
					onFilterOpen={() => onFilterDrawerOpen(true)}
				/>

				<TableContainer>
					<Table sx={{ minWidth: 650 }}>
						<TableHead>
							<TableRow sx={{ bgcolor: '#fafafa' }}>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Employee</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Report Date</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Status</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Hours</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Submitted At</TableCell>
								<TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={6} align="center" sx={{ py: 4 }}>
										<CircularProgress size={24} />
										<Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading submissions...</Typography>
									</TableCell>
								</TableRow>
							) : !displayEntries || displayEntries.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} align="center" sx={{ py: 4 }}>
										<Typography variant="body2" color="text.secondary">
											{searchTerm ? 'No records match your search.' : 'No submissions found.'}
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								displayEntries.map((entry) => (
									<TableRow
										key={entry.public_id}
										sx={{
											'&:hover': { bgcolor: '#f5f8fa' },
											'&:last-child td': { borderBottom: 0 }
										}}
									>
										<TableCell sx={{ fontWeight: 500 }}>{entry.user?.full_name || entry.user?.username}</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#232f3e' }}>
											{dayjs(entry.report_date).format('DD/MMM/YYYY')}
										</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Chip
													label={entry.status.toUpperCase()}
													size="small"
													variant="outlined"
													sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.65rem' }}
												/>
												{entry.is_leave && (
													<Chip
														label={entry.leave_type || 'LEAVE'}
														size="small"
														color="warning"
														sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.65rem' }}
													/>
												)}
											</Box>
										</TableCell>
										<TableCell sx={{ fontWeight: 500 }}>
											{entry.is_leave ? '—' : `${entry.items.reduce((s: number, i: any) => s + (i.hours || 0), 0).toFixed(1)} h`}
										</TableCell>
										<TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
											{entry.submitted_at ? dayjs(entry.submitted_at).format('DD/MMM/YYYY, h:mm:ss A') : 'N/A'}
										</TableCell>
										<TableCell align="right">
											<Tooltip title="View Details">
												<IconButton
													size="small"
													onClick={() => setSelectedEntryId(entry.public_id)}
													sx={{ color: '#232f3e' }}
												>
													<Visibility fontSize="small" />
												</IconButton>
											</Tooltip>
											{(entry.status === 'submitted' || entry.status === 'approved') && onRevoke && (
												<Tooltip title="Revoke to Draft">
													<IconButton
														size="small"
														onClick={() => {
															setRevokeTargetId(entry.public_id);
															setRevokeDialogOpen(true);
														}}
														sx={{ color: '#d97706' }}
													>
														<RevokeIcon fontSize="small" />
													</IconButton>
												</Tooltip>
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
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={onPageChange}
					onRowsPerPageChange={onRowsPerPageChange}
					onRowsPerPageSelectChange={onRowsPerPageSelectChange}
				/>
			</Paper>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => onFilterDrawerOpen(false)}
				onApplyFilters={() => {
					onFilterDrawerOpen(false);
					onRefresh();
				}}
				onClearFilters={() => {
					onStatusFilterChange(null);
					onDateFromChange(null);
					onDateToChange(null);
					onRefresh();
				}}
				activeFilters={{
					status: statusFilter,
					date_from: dateFrom,
					date_to: dateTo
				}}
				onFilterChange={(key, value) => {
					if (key === 'status') onStatusFilterChange(value);
					if (key === 'date_from') onDateFromChange(value);
					if (key === 'date_to') onDateToChange(value);
				}}
				fields={[
					{
						key: 'status',
						label: 'Status',
						type: 'single-select',
						options: [
							{ label: 'Submitted', value: 'submitted' },
							{ label: 'Approved', value: 'approved' },
							{ label: 'Draft', value: 'draft' },
							{ label: 'Leave Requested', value: 'leave_pending' },
							{ label: 'Leave Approved', value: 'leave_approved' }
						]
					},
					{
						key: 'date_from',
						label: 'Date From',
						type: 'date'
					},
					{
						key: 'date_to',
						label: 'Date To',
						type: 'date'
					}
				]}
			/>

			{selectedEntryId && (
				<DSRSubmissionDialog
					open={Boolean(selectedEntryId)}
					onClose={() => setSelectedEntryId(null)}
					entryId={selectedEntryId}
					readOnly={true}
				/>
			)}

			{/* Revoke Confirmation Dialog */}
			<Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>Revoke Timesheet</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2 }}>
						This action will move the timesheet back to <strong>DRAFT</strong> state. The user will be able to edit and re-submit it.
						{entries.find(e => e.public_id === revokeTargetId)?.status === 'approved' && (
							<Box component="span" sx={{ display: 'block', mt: 1, color: 'error.main', fontWeight: 600 }}>
								Warning: This will also reverse the logged hours from project totals.
							</Box>
						)}
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						label="Reason for Revocation (Optional)"
						type="text"
						fullWidth
						variant="outlined"
						value={revokeReason}
						onChange={(e) => setRevokeReason(e.target.value)}
						placeholder="e.g. Accidental submission, missing details..."
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button onClick={() => setRevokeDialogOpen(false)} sx={{ fontWeight: 700, color: '#545b64' }}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							if (revokeTargetId && onRevoke) {
								onRevoke(revokeTargetId, revokeReason);
							}
							setRevokeDialogOpen(false);
							setRevokeReason('');
						}}
						variant="contained"
						color="warning"
						sx={{ fontWeight: 700, textTransform: 'none' }}
					>
						Confirm Revoke
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default React.memo(AllSubmissionsTable);
