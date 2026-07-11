import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TableRow, TableCell, Chip, Stack, alpha, useTheme } from '@mui/material';
import {
	AccountTreeOutlined as DeptIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	PeopleAlt as PeopleIcon,
	WorkOutlined as DesignationIcon,
	PersonOutlined as HODIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchDepartments, deleteDepartment } from '../../../../store/slices/hrSlice';
import type { HRDepartmentListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import { ConfirmationDialog } from '../../../common/dialogbox';
import DepartmentDialog from './DepartmentDialog';

export const DepartmentsPanel: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const { departments, departmentsLoading: loading } = useAppSelector((state) => state.hr);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDepartmentListItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HRDepartmentListItem | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		dispatch(fetchDepartments(true));
	}, [dispatch]);

	const filtered = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return departments;
		return departments.filter((d) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
	}, [departments, searchTerm]);

	const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteDepartment(deleteTarget.id)).unwrap();
			success('Department deleted');
			setDeleteTarget(null);
		} catch {
			error('Failed to delete department');
		} finally {
			setDeleting(false);
		}
	};

	const columns: ColumnDefinition<HRDepartmentListItem>[] = [
		{ id: 'name', label: 'Department' },
		{ id: 'employee_count', label: 'Employees', align: 'center' },
		{ id: 'designation_count', label: 'Designations', align: 'center' },
		{ id: 'head_user_name', label: 'Head of Department' },
		{ id: 'is_active', label: 'Status', align: 'center' },
		{ id: 'actions', label: '', align: 'right' },
	];

	const renderRow = (dept: HRDepartmentListItem) => {
		const actions: TableMenuAction<HRDepartmentListItem>[] = [
			{ label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => { setEditTarget(dept); setDialogOpen(true); } },
			{ label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error.main', onClick: () => setDeleteTarget(dept) },
		];

		return (
			<TableRow key={dept.id} hover>
				<TableCell>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<Box
							sx={{
								width: 36, height: 36, borderRadius: 2.5, flexShrink: 0,
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main',
							}}
						>
							<DeptIcon sx={{ fontSize: '1.05rem' }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="body2" fontWeight={700} noWrap>{dept.name}</Typography>
							{dept.description && (
								<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 280 }}>
									{dept.description}
								</Typography>
							)}
						</Box>
					</Stack>
				</TableCell>
				<TableCell align="center">
					<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
						<PeopleIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
						<Typography variant="body2" fontWeight={600}>{dept.employee_count ?? 0}</Typography>
					</Stack>
				</TableCell>
				<TableCell align="center">
					<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
						<DesignationIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
						<Typography variant="body2" fontWeight={600}>{dept.designation_count ?? 0}</Typography>
					</Stack>
				</TableCell>
				<TableCell>
					{dept.head_user_name ? (
						<Stack direction="row" spacing={0.75} alignItems="center">
							<HODIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
							<Typography variant="body2">{dept.head_user_name}</Typography>
						</Stack>
					) : (
						<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>Unassigned</Typography>
					)}
				</TableCell>
				<TableCell align="center">
					<Chip
						label={dept.is_active ? 'Active' : 'Inactive'}
						size="small"
						color={dept.is_active ? 'success' : 'default'}
						sx={{ fontWeight: 700, borderRadius: 2 }}
					/>
				</TableCell>
				<TableCell align="right" sx={{ pr: 3 }} onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={dept} actions={actions} tooltipTitle="Department Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<Box>
			<DataTable<HRDepartmentListItem>
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
				searchPlaceholder="Search departments…"
				canCreate
				createButtonText="New Department"
				onCreateClick={() => { setEditTarget(null); setDialogOpen(true); }}
				renderRow={renderRow}
				emptyMessage="No departments yet — create your first one to structure your organization."
			/>

			<DepartmentDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Department"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</Box>
	);
};

export default DepartmentsPanel;
