import React, { useState, useEffect, useCallback } from 'react';
import {
	Box, Typography, TableRow, TableCell, Chip, Stack, Grid,
	MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Work as WorkIcon, Send as InviteIcon, Edit as EditIcon, CalendarMonth as LeaveIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchEmployees, fetchDepartments, fetchDesignations, fetchHeadcountReport } from '../../../../../store/slices/hrSlice';
import type { EmployeeStatus, HREmployeeListItem } from '../../../../../models/hr';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS, WORK_LOCATION_LABELS } from '../../../../../models/hr';
import useToast from '../../../../../hooks/useToast';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../../common/table';
import EnterpriseAvatar from '../../../../common/avatar/Avatar';
import EmployeeDialog from './EmployeeDialog';
import InviteEmployeeDialog from './InviteEmployeeDialog';
import LeaveEntitlementsDialog from './LeaveEntitlementsDialog';
import DepartmentBreakdownCard from './DepartmentBreakdownCard';
import InviteCoverageCard from './InviteCoverageCard';

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
	const { employees, employeesTotal, employeesLoading: loading, departments, designations, headcountReport } = useAppSelector((state) => state.hr);

	const [search, setSearch] = useState('');
	const [deptFilter, setDeptFilter] = useState<number | ''>('');
	const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HREmployeeListItem | null>(null);
	const [inviteTarget, setInviteTarget] = useState<HREmployeeListItem | null>(null);
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
	const [leaveTarget, setLeaveTarget] = useState<HREmployeeListItem | null>(null);

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

	const handleRosterChanged = useCallback(() => {
		loadEmployees();
		dispatch(fetchHeadcountReport());
	}, [loadEmployees, dispatch]);

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
		dispatch(fetchDesignations(undefined));
		dispatch(fetchHeadcountReport());
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
		{ id: 'employee_id', label: 'Emp ID' },
		{ id: 'department_name', label: 'Department' },
		{ id: 'designation_name', label: 'Designation' },
		{ id: 'employment_type', label: 'Employment' },
		{ id: 'employee_status', label: 'Status', align: 'center' },
		{ id: 'actions', label: '', align: 'right' },
	];

	const renderRow = (emp: HREmployeeListItem) => {
		const actions: TableMenuAction<HREmployeeListItem>[] = [
			{ label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => { setEditTarget(emp); setDialogOpen(true); } },
			{
				label: 'Leave Entitlements',
				icon: <LeaveIcon fontSize="small" />,
				onClick: () => { setLeaveTarget(emp); setLeaveDialogOpen(true); },
				disabled: !emp.user_id,
			},
			{ label: 'Invite to Gravit', icon: <InviteIcon fontSize="small" />, onClick: () => setInviteTarget(emp), hidden: emp.is_invited },
		];

		return (
			<TableRow key={emp.public_id} hover>
				<TableCell>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<EnterpriseAvatar name={emp.full_name || emp.email || '?'} size={36} />
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="body2" fontWeight={700} noWrap>{emp.full_name || '—'}</Typography>
							<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
								{emp.email}
							</Typography>
							{!emp.is_invited && (
								<Chip
									label="Not invited"
									size="small"
									variant="outlined"
									sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
								/>
							)}
						</Box>
					</Stack>
				</TableCell>
				<TableCell>
					<Typography variant="body2" color="text.secondary">{emp.employee_id || '—'}</Typography>
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
				<TableCell align="right" sx={{ pr: 3 }} onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={emp} actions={actions} tooltipTitle="Employee Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<>
		<Grid container spacing={2.5}>
			{headcountReport && headcountReport.total_count > 0 && (
				<Grid size={{ xs: 12, lg: 4 }}>
					<Stack spacing={2.5}>
						<DepartmentBreakdownCard distribution={headcountReport.department_distribution} total={headcountReport.total_count} />
						<InviteCoverageCard total={headcountReport.total_count} invitedCount={headcountReport.invited_count} />
					</Stack>
				</Grid>
			)}

			<Grid size={{ xs: 12, lg: headcountReport && headcountReport.total_count > 0 ? 8 : 12 }}>
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
					onCreateClick={() => { setEditTarget(null); setDialogOpen(true); }}
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
			</Grid>
		</Grid>

		<EmployeeDialog
			open={dialogOpen}
			onClose={() => { setDialogOpen(false); setEditTarget(null); }}
			onSaved={handleRosterChanged}
			departments={departments}
			designations={designations}
			existingUserIds={employees.map((e) => e.user_id).filter((id): id is number => id !== null)}
			existing={editTarget}
		/>

		<InviteEmployeeDialog
			open={!!inviteTarget}
			employee={inviteTarget}
			onClose={() => setInviteTarget(null)}
			onInvited={handleRosterChanged}
		/>

		<LeaveEntitlementsDialog
			open={leaveDialogOpen}
			employee={leaveTarget}
			onClose={() => { setLeaveDialogOpen(false); setLeaveTarget(null); }}
		/>
		</>
	);
};

export default EmployeesPanel;
