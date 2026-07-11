import React from 'react';
import {
	Typography,
	TableRow,
	TableCell,
	Stack,
	Button,
	Chip,
	TextField
} from '@mui/material';
import { useWeekUnlockRequests } from './hooks/useWeekUnlockRequests';
import { BaseDialog } from '../../common/dialogbox';
import { DataTable, type ColumnDefinition } from '../../common/table';
import type { TimesheetWeekUnlockRequest } from '../../../models/timesheet';

interface WeekUnlockRequestsPanelProps {
	requests: TimesheetWeekUnlockRequest[];
	loading: boolean;
	onApprove: (requestId: number) => void;
	onDeny: (requestId: number, note?: string) => void;
}

const statusChipColor: Record<string, 'warning' | 'success' | 'error'> = {
	pending: 'warning',
	approved: 'success',
	denied: 'error'
};

const WeekUnlockRequestsPanel: React.FC<WeekUnlockRequestsPanelProps> = ({ requests, loading, onApprove, onDeny }) => {
	const {
		denyTarget, setDenyTarget,
		denyNote, setDenyNote,
		pendingPage, setPendingPage,
		pendingRowsPerPage, setPendingRowsPerPage,
		resolvedPage, setResolvedPage,
		resolvedRowsPerPage, setResolvedRowsPerPage,
		pending,
		resolved,
		paginatedPending,
		paginatedResolved,
		handleOpenDeny,
		handleConfirmDeny
	} = useWeekUnlockRequests({ requests, onDeny });

	const columns = (showActions: boolean): ColumnDefinition<TimesheetWeekUnlockRequest>[] => [
		{ id: 'user_id', label: 'Team Member' },
		{ id: 'week_start_date', label: 'Week' },
		{ id: 'reason', label: 'Reason' },
		{ id: 'status', label: 'Status', align: 'center' },
		{ id: 'actions', label: showActions ? 'Actions' : 'Resolution', align: 'right' }
	];

	const renderRow = (req: TimesheetWeekUnlockRequest, showActions: boolean) => (
		<TableRow key={req.id}>
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 700 }}>
					{req.user?.full_name || req.user?.email || `User #${req.user_id}`}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{req.user?.email}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2">{req.week_start_date} — {req.week_end_date}</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{req.reason || '—'}
				</Typography>
			</TableCell>
			<TableCell align="center">
				<Chip
					label={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
					color={statusChipColor[req.status]}
					size="small"
					sx={{ fontWeight: 700 }}
				/>
			</TableCell>
			<TableCell align="right" sx={{ pr: 3 }}>
				{showActions ? (
					<Stack direction="row" spacing={1} justifyContent="flex-end">
						<Button
							variant="contained"
							color="success"
							size="small"
							onClick={() => onApprove(req.id)}
							disabled={loading}
							sx={{ borderRadius: 3, fontWeight: 700 }}
						>
							Approve
						</Button>
						<Button
							variant="outlined"
							color="error"
							size="small"
							onClick={() => handleOpenDeny(req)}
							disabled={loading}
							sx={{ borderRadius: 3, fontWeight: 700 }}
						>
							Deny
						</Button>
					</Stack>
				) : (
					<Typography variant="caption" color="text.secondary">
						{req.resolution_note || (req.status === 'approved' ? 'Granted' : 'No note')}
					</Typography>
				)}
			</TableCell>
		</TableRow>
	);

	const renderRequestTable = (
		rows: TimesheetWeekUnlockRequest[],
		totalCount: number,
		showActions: boolean,
		page: number,
		rowsPerPage: number,
		onPageChange: (event: unknown, newPage: number) => void,
		onRowsPerPageChange: (rows: number) => void,
		title: string
	) => (
		<DataTable<TimesheetWeekUnlockRequest>
			columns={columns(showActions)}
			data={rows}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm=""
			headerActions={
				<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
					{title}
				</Typography>
			}
			renderRow={(req) => renderRow(req, showActions)}
			emptyMessage={loading ? "Loading..." : "Nothing here."}
		/>
	);

	return (
		<Stack spacing={4}>
			{renderRequestTable(
				paginatedPending,
				pending.length,
				true,
				pendingPage,
				pendingRowsPerPage,
				(_, newPage) => setPendingPage(newPage),
				(rows) => { setPendingRowsPerPage(rows); setPendingPage(0); },
				'Pending Requests'
			)}

			{renderRequestTable(
				paginatedResolved,
				resolved.length,
				false,
				resolvedPage,
				resolvedRowsPerPage,
				(_, newPage) => setResolvedPage(newPage),
				(rows) => { setResolvedRowsPerPage(rows); setResolvedPage(0); },
				'Resolved Requests'
			)}

			<BaseDialog
				open={!!denyTarget}
				onClose={() => setDenyTarget(null)}
				title="Deny Unlock Request"
				maxWidth="xs"
				actions={
					<>
						<Button onClick={() => setDenyTarget(null)} variant="outlined" sx={{ borderRadius: 3 }}>
							Cancel
						</Button>
						<Button onClick={handleConfirmDeny} variant="contained" color="error" sx={{ borderRadius: 3, fontWeight: 700 }}>
							Deny Request
						</Button>
					</>
				}
			>
				<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
					Optionally let {denyTarget?.user?.full_name || denyTarget?.user?.email || 'the team member'} know why this week won't be unlocked.
				</Typography>
				<TextField
					label="Note (optional)"
					multiline
					rows={3}
					value={denyNote}
					onChange={(e) => setDenyNote(e.target.value)}
					fullWidth
					autoFocus
				/>
			</BaseDialog>
		</Stack>
	);
};

export default WeekUnlockRequestsPanel;
