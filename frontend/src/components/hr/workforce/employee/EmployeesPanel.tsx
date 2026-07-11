import React, { useState, useEffect, useCallback } from 'react';
import {
	Box, Typography, TableRow, TableCell, Chip, Stack,
	MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Work as WorkIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEmployees, fetchDepartments, fetchDesignations } from '../../../../store/slices/hrSlice';
import type { EmployeeStatus, HREmployeeListItem } from '../../../../models/hr';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS, WORK_LOCATION_LABELS } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import { DataTable, type ColumnDefinition } from '../../../common/table';
import EnterpriseAvatar from '../../../common/avatar/Avatar';
import EmployeeDialog from './EmployeeDialog';

const STATUS_OPTIONS: Array<{ value: EmployeeStatus | ''; label: string }> = [
	{ value: '', label: 'All Statuses' },
	{ value: 'active', label: 'Active' },
	{ value: 'probation', label: 'Probation' },
	{ value: 'on_notice', label: 'On Notice' },
	{ value: 'on_leave', label: 'On Leave' },
	{ value: 'resigned', label: 'Resigned' },
	{ value: 'terminated', label: 'Terminated' },
];

export const EmployeesPanel: React.FC = () => {
	const { error } = useToast();
	const dispatch = useAppDispatch();
	const { employees, employeesTotal, employeesLoading: loading, departments, designations } = useAppSelector((state) => state.hr);

	const [search, setSearch] = useState('');
	const [deptFilter, setDeptFilter] = useState<number | ''>('');
	const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [dialogOpen, setDialogOpen] = useState(false);

	const loadEmployees = useCallback(() => {
		const params = {
			...(search && { search }),
			...(deptFilter && { department_id: deptFilter as number }),
			...(statusFilter && { employee_status: statusFilter }),
			skip: page * rowsPerPage,
			limit: rowsPerPage,
		};
		dispatch(fetchEmployees(params)).unwrap().catch(() => error('Failed to load employees'));
	}, [dispatch, search, deptFilter, statusFilter, page, rowsPerPage]);

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
		dispatch(fetchDesignations(undefined));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	useEffect(() => {
		const t = setTimeout(loadEmployees, search ? 350 : 0);
		return () => clearTimeout(t);
	}, [loadEmployees, search]);

	// Filter/search changes should reset back to page 1
	useEffect(() => {
		setPage(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, deptFilter, statusFilter]);

	const columns: ColumnDefinition<HREmployeeListItem>[] = [
		{ id: 'full_name', label: 'Employee' },
		{ id: 'department_name', label: 'Department' },
		{ id: 'designation_name', label: 'Designation' },
		{ id: 'employment_type', label: 'Employment' },
		{ id: 'employee_status', label: 'Status', align: 'center' },
	];

	const renderRow = (emp: HREmployeeListItem) => (
		<TableRow key={emp.public_id} hover>
			<TableCell>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<EnterpriseAvatar name={emp.full_name || emp.email || '?'} size={36} />
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="body2" fontWeight={700} noWrap>{emp.full_name || '—'}</Typography>
						<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
							{emp.email}
						</Typography>
					</Box>
				</Stack>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">{emp.department_name || '—'}</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">{emp.designation_name || emp.role || '—'}</Typography>
			</TableCell>
			<TableCell>
				<Stack direction="row" spacing={0.75} alignItems="center">
					<WorkIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
					<Typography variant="body2" color="text.secondary">
						{EMPLOYMENT_TYPE_LABELS[emp.employment_type]} · {WORK_LOCATION_LABELS[emp.work_location]}
					</Typography>
				</Stack>
			</TableCell>
			<TableCell align="center">
				<Chip
					label={EMPLOYEE_STATUS_LABELS[emp.employee_status]}
					color={EMPLOYEE_STATUS_COLORS[emp.employee_status]}
					size="small"
					sx={{ fontWeight: 700, borderRadius: 2 }}
				/>
			</TableCell>
		</TableRow>
	);

	return (
		<>
		<DataTable<HREmployeeListItem>
			columns={columns}
			data={employees}
			loading={loading}
			totalCount={employeesTotal}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={(_, newPage) => setPage(newPage)}
			onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
			searchTerm={search}
			onSearchChange={setSearch}
			searchPlaceholder="Search by name or email…"
			canCreate
			createButtonText="Add Employee"
			onCreateClick={() => setDialogOpen(true)}
			headerActions={
				<Stack direction="row" spacing={1.5}>
					<FormControl size="small" sx={{ minWidth: 170 }}>
						<InputLabel>Department</InputLabel>
						<Select
							value={deptFilter}
							label="Department"
							onChange={(e) => setDeptFilter(e.target.value as number | '')}
						>
							<MenuItem value="">All Departments</MenuItem>
							{departments.map((d) => (
								<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small" sx={{ minWidth: 160 }}>
						<InputLabel>Status</InputLabel>
						<Select
							value={statusFilter}
							label="Status"
							onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | '')}
						>
							{STATUS_OPTIONS.map((o) => (
								<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
			}
			renderRow={renderRow}
			emptyMessage={search || deptFilter || statusFilter ? 'No employees match your filters.' : 'No employees yet — add your first employee to get started.'}
		/>

		<EmployeeDialog
			open={dialogOpen}
			onClose={() => setDialogOpen(false)}
			onCreated={loadEmployees}
			departments={departments}
			designations={designations}
			existingUserIds={employees.map((e) => e.user_id)}
		/>
		</>
	);
};

export default EmployeesPanel;
