import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TableRow, TableCell, Chip, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchDesignations, deleteDesignation, fetchDepartments } from '../../../../store/slices/hrSlice';
import type { HRDesignationListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import { ConfirmationDialog } from '../../../common/dialogbox';
import DesignationDialog from './DesignationDialog';

export const DesignationsPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const { error, success } = useToast();
	const { designations, designationsLoading: loading, departments } = useAppSelector((state) => state.hr);

	const [searchTerm, setSearchTerm] = useState('');
	const [deptFilter, setDeptFilter] = useState<number | ''>('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDesignationListItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HRDesignationListItem | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchDesignations(deptFilter as number | undefined)).unwrap().catch(() => error('Failed to load designations'));
		setPage(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, deptFilter]);

	const filtered = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return designations;
		return designations.filter((d) => d.name.toLowerCase().includes(q) || d.grade?.toLowerCase().includes(q));
	}, [designations, searchTerm]);

	const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteDesignation(deleteTarget.id)).unwrap();
			success('Designation deleted');
			setDeleteTarget(null);
		} catch {
			error('Failed to delete designation');
		} finally {
			setDeleting(false);
		}
	};

	const columns: ColumnDefinition<HRDesignationListItem>[] = [
		{ id: 'name', label: 'Designation' },
		{ id: 'department_name', label: 'Department' },
		{ id: 'grade', label: 'Grade' },
		{ id: 'is_active', label: 'Status', align: 'center' },
		{ id: 'actions', label: '', align: 'right' },
	];

	const renderRow = (d: HRDesignationListItem) => {
		const actions: TableMenuAction<HRDesignationListItem>[] = [
			{ label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => { setEditTarget(d); setDialogOpen(true); } },
			{ label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error.main', onClick: () => setDeleteTarget(d) },
		];

		return (
			<TableRow key={d.id} hover>
				<TableCell>
					<Typography variant="body2" fontWeight={700}>{d.name}</Typography>
				</TableCell>
				<TableCell>
					{d.department_name ? (
						<Chip label={d.department_name} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
					) : (
						<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>—</Typography>
					)}
				</TableCell>
				<TableCell>
					<Typography variant="body2" color="text.secondary">{d.grade || '—'}</Typography>
				</TableCell>
				<TableCell align="center">
					<Chip
						label={d.is_active ? 'Active' : 'Inactive'}
						size="small"
						color={d.is_active ? 'success' : 'default'}
						sx={{ fontWeight: 700, borderRadius: 2 }}
					/>
				</TableCell>
				<TableCell align="right" sx={{ pr: 3 }} onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={d} actions={actions} tooltipTitle="Designation Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<Box>
			<DataTable<HRDesignationListItem>
				columns={columns}
				data={paginated}
				loading={loading}
				totalCount={filtered.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
				searchTerm={searchTerm}
				onSearchChange={(v) => { setSearchTerm(v); setPage(0); }}
				searchPlaceholder="Search designations…"
				canCreate
				createButtonText="New Designation"
				onCreateClick={() => { setEditTarget(null); setDialogOpen(true); }}
				headerActions={
					<FormControl size="small" sx={{ minWidth: 180 }}>
						<InputLabel>Department</InputLabel>
						<Select
							value={deptFilter}
							label="Department"
							onChange={(e) => setDeptFilter(e.target.value as number | '')}
						>
							<MenuItem value="">All Departments</MenuItem>
							{departments.map((dep) => <MenuItem key={dep.id} value={dep.id}>{dep.name}</MenuItem>)}
						</Select>
					</FormControl>
				}
				renderRow={renderRow}
				emptyMessage={deptFilter ? 'No designations in this department.' : 'No designations yet — define job designations to assign to employees.'}
			/>

			<DesignationDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Designation"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</Box>
	);
};

export default DesignationsPanel;
