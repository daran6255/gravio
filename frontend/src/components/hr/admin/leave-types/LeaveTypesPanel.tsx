import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, Chip, Switch, Tooltip, TableRow, TableCell, alpha, useTheme } from '@mui/material';
import {
	EditOutlined as EditIcon,
	DeleteOutline as DeleteIcon,
	EventNoteOutlined as LeaveTypeIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchLeaveTypes, deleteLeaveType, updateLeaveType } from '../../../../store/slices/hrSlice';
import type { HRLeaveTypeListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import { ConfirmationDialog } from '../../../common/dialogbox';
import { AddButton } from '../../../common/button';
import ContextMenu, { type ActionMenuItem } from '../../../common/action-menu/ContextMenu';
import { DataTable, type ColumnDefinition } from '../../../common/table';
import LeaveTypeDialog from './LeaveTypeDialog';

export const LeaveTypesPanel: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const { leaveTypes, leaveTypesLoading } = useAppSelector((state) => state.hr);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRLeaveTypeListItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HRLeaveTypeListItem | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);

	useEffect(() => {
		dispatch(fetchLeaveTypes(true)).unwrap().catch(() => error("Failed to load leave types"));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	const paginated = leaveTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteLeaveType(deleteTarget.id)).unwrap();
			success('Leave type deleted');
			setDeleteTarget(null);
		} catch (e: any) {
			error(e || 'Failed to delete leave type');
		} finally {
			setDeleting(false);
		}
	};

	const handleToggleActive = async (lt: HRLeaveTypeListItem, active: boolean) => {
		try {
			await dispatch(updateLeaveType({ id: lt.id, payload: { is_active: active } })).unwrap();
			success(active ? 'Leave type reactivated' : 'Leave type deactivated');
		} catch (e: any) {
			error(e || 'Failed to update leave type');
		}
	};

	const columns: ColumnDefinition<HRLeaveTypeListItem>[] = [
		{ id: 'name', label: 'Leave Type' },
		{ id: 'default_allocation', label: 'Yearly Allocation', align: 'center' },
		{ id: 'is_carry_forward', label: 'Carry Forward', align: 'center' },
		{ id: 'is_active', label: 'Active', align: 'center' },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (lt: HRLeaveTypeListItem) => {
		const menuActions: ActionMenuItem[] = [
			{ label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => { setEditTarget(lt); setDialogOpen(true); } },
			{ label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: theme.palette.error.main, onClick: () => setDeleteTarget(lt) },
		];

		return (
			<TableRow key={lt.id} hover>
				<TableCell>
					<Stack direction="row" spacing={1.25} alignItems="center">
						<Box sx={{
							width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
							bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', flexShrink: 0,
						}}>
							<LeaveTypeIcon sx={{ fontSize: '1rem' }} />
						</Box>
						<Box>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Typography variant="body2" fontWeight={800}>{lt.name}</Typography>
								<Chip label={lt.code} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
								{lt.is_lop && (
									<Chip label="LOP" size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
								)}
							</Stack>
							{lt.description && (
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 360 }}>
									{lt.description}
								</Typography>
							)}
						</Box>
					</Stack>
				</TableCell>
				<TableCell align="center">
					<Typography variant="body2" fontWeight={700}>
						{lt.is_lop ? 'Unlimited' : `${lt.default_allocation}d / yr`}
					</Typography>
				</TableCell>
				<TableCell align="center">
					{lt.is_carry_forward ? (
						<Tooltip title={`Up to ${lt.max_carry_forward} days carry forward into next year`}>
							<Chip label={`Up to ${lt.max_carry_forward}d`} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
						</Tooltip>
					) : (
						<Typography variant="caption" color="text.disabled">Not carried forward</Typography>
					)}
				</TableCell>
				<TableCell align="center">
					<Switch checked={lt.is_active} onChange={(e) => handleToggleActive(lt, e.target.checked)} size="small" />
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<ContextMenu actions={menuActions} triggerTooltip="Leave Type Actions" size="small" />
				</TableCell>
			</TableRow>
		);
	};

	return (
		<Box>
			<DataTable<HRLeaveTypeListItem>
				columns={columns}
				data={paginated}
				loading={leaveTypesLoading}
				totalCount={leaveTypes.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(newRows) => { setRowsPerPage(newRows); setPage(0); }}
				searchTerm=""
				headerActions={
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							Leave Types
						</Typography>
						<AddButton size="small" onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
							New Leave Type
						</AddButton>
					</Stack>
				}
				renderRow={renderRow}
				emptyMessage="No leave types configured yet -- create one so employees can request leave."
			/>

			<LeaveTypeDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Leave Type"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? Existing balances and requests referencing it will be affected.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</Box>
	);
};

export default LeaveTypesPanel;
