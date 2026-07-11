import React, { useState, useEffect, useCallback } from 'react';
import {
	Box, Grid, Typography, Avatar, Chip, TextField, InputAdornment,
	MenuItem, Select, FormControl, InputLabel, Button,
	Card, CardContent, Skeleton, Divider, Stack,
	alpha, useTheme
} from '@mui/material';
import {
	Search as SearchIcon,
	Email as EmailIcon,
	LocationOn as LocationIcon,
	Work as WorkIcon,
	Badge as BadgeIcon,
	Close as CloseIcon,
	PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import HRLayout from '../../components/hr/HRLayout';
import { hrEmployeeApi, hrDepartmentApi } from '../../services/hrService';
import type { HREmployeeListItem, HRDepartmentListItem, EmployeeStatus } from '../../models/hr';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS, WORK_LOCATION_LABELS } from '../../models/hr';
import useToast from '../../hooks/useToast';

// ---------------------------------------------------------------------------
// Employee Card
// ---------------------------------------------------------------------------

interface EmployeeCardProps {
	employee: HREmployeeListItem;
	onClick: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
	const theme = useTheme();
	const initials = (employee.full_name || employee.email || '?')
		.split(' ')
		.map((n) => n[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

	return (
		<Card
			onClick={onClick}
			sx={{
				cursor: 'pointer',
				border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
				transition: 'all 0.18s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
					borderColor: alpha(theme.palette.primary.main, 0.3),
				},
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
					<Avatar
						src={employee.avatar || undefined}
						sx={{
							width: 52, height: 52,
							bgcolor: alpha(theme.palette.primary.main, 0.15),
							color: 'primary.main',
							fontWeight: 700,
							fontSize: '1rem',
						}}
					>
						{initials}
					</Avatar>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Typography variant="subtitle2" fontWeight={700} noWrap>
								{employee.full_name || '—'}
							</Typography>
							<Chip
								label={EMPLOYEE_STATUS_LABELS[employee.employee_status]}
								color={EMPLOYEE_STATUS_COLORS[employee.employee_status]}
								size="small"
								sx={{ height: 20, fontSize: '0.65rem', ml: 1, flexShrink: 0 }}
							/>
						</Box>
						<Typography variant="caption" color="text.secondary" noWrap display="block">
							{employee.designation_name || employee.role || '—'}
						</Typography>
						<Typography variant="caption" color="text.disabled" noWrap display="block">
							{employee.department_name || 'No Department'}
						</Typography>
					</Box>
				</Box>

				<Divider sx={{ my: 1.5 }} />

				<Stack spacing={0.75}>
					{employee.employee_id && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<BadgeIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
							<Typography variant="caption" color="text.secondary" fontFamily="monospace">
								{employee.employee_id}
							</Typography>
						</Box>
					)}
					{employee.email && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<EmailIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
							<Typography variant="caption" color="text.secondary" noWrap>
								{employee.email}
							</Typography>
						</Box>
					)}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<LocationIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							{WORK_LOCATION_LABELS[employee.work_location]}
						</Typography>
						<Box sx={{ mx: 0.5, color: 'text.disabled' }}>·</Box>
						<WorkIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							{EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
						</Typography>
					</Box>
					{employee.date_of_joining && (
						<Typography variant="caption" color="text.disabled">
							Joined {new Date(employee.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
						</Typography>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
const CardSkeleton: React.FC = () => (
	<Card>
		<CardContent sx={{ p: 2.5 }}>
			<Box sx={{ display: 'flex', gap: 2 }}>
				<Skeleton variant="circular" width={52} height={52} />
				<Box sx={{ flex: 1 }}>
					<Skeleton width="70%" height={20} />
					<Skeleton width="50%" height={16} />
				</Box>
			</Box>
			<Skeleton sx={{ mt: 2 }} height={60} />
		</CardContent>
	</Card>
);

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const EmployeeDirectoryPage: React.FC = () => {
	const theme = useTheme();
	const { error } = useToast();

	const [employees, setEmployees] = useState<HREmployeeListItem[]>([]);
	const [departments, setDepartments] = useState<HRDepartmentListItem[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);

	// Filters
	const [search, setSearch] = useState('');
	const [deptFilter, setDeptFilter] = useState<number | ''>('');
	const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');

	const fetchEmployees = useCallback(async () => {
		setLoading(true);
		try {
			const params = {
				...(search && { search }),
				...(deptFilter && { department_id: deptFilter as number }),
				...(statusFilter && { employee_status: statusFilter }),
				limit: 100,
			};
			const res = await hrEmployeeApi.list(params);
			setEmployees(res.items);
			setTotal(res.total);
		} catch {
			error('Failed to load employees');
		} finally {
			setLoading(false);
		}
	}, [search, deptFilter, statusFilter]);

	useEffect(() => {
		hrDepartmentApi.list().then(setDepartments).catch(() => {});
	}, []);

	useEffect(() => {
		const t = setTimeout(fetchEmployees, search ? 350 : 0);
		return () => clearTimeout(t);
	}, [fetchEmployees, search]);

	const statusOptions: Array<{ value: EmployeeStatus | ''; label: string }> = [
		{ value: '', label: 'All Statuses' },
		{ value: 'active', label: 'Active' },
		{ value: 'probation', label: 'Probation' },
		{ value: 'on_notice', label: 'On Notice' },
		{ value: 'on_leave', label: 'On Leave' },
		{ value: 'resigned', label: 'Resigned' },
		{ value: 'terminated', label: 'Terminated' },
	];

	const headerActions = (
		<Button
			variant="contained"
			startIcon={<PersonAddIcon />}
			size="small"
			sx={{ fontWeight: 600 }}
		>
			Add Employee
		</Button>
	);

	return (
		<HRLayout
			title="Employee Directory"
			subtitle={`${total} employee${total !== 1 ? 's' : ''} in your organization`}
			actions={headerActions}
		>
			{/* Filters bar */}
			<Box
				sx={{
					display: 'flex',
					gap: 2,
					mb: 3,
					flexWrap: 'wrap',
					alignItems: 'center',
				}}
			>
				<TextField
					placeholder="Search by name or email…"
					size="small"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ fontSize: '1.1rem', color: 'text.disabled' }} />
							</InputAdornment>
						),
					}}
					sx={{ minWidth: 260, flex: 1, maxWidth: 400 }}
				/>

				<FormControl size="small" sx={{ minWidth: 180 }}>
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
						{statusOptions.map((o) => (
							<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
						))}
					</Select>
				</FormControl>

				{(search || deptFilter || statusFilter) && (
					<Button
						size="small"
						variant="text"
						color="inherit"
						onClick={() => { setSearch(''); setDeptFilter(''); setStatusFilter(''); }}
						startIcon={<CloseIcon sx={{ fontSize: '0.9rem' }} />}
					>
						Clear filters
					</Button>
				)}
			</Box>

			{/* Employee Grid */}
			{loading ? (
				<Grid container spacing={2}>
					{Array.from({ length: 9 }).map((_, i) => (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
							<CardSkeleton />
						</Grid>
					))}
				</Grid>
			) : employees.length === 0 ? (
				<Box
					sx={{
						textAlign: 'center',
						py: 10,
						px: 2,
						borderRadius: 3,
						border: `2px dashed ${alpha(theme.palette.divider, 0.6)}`,
					}}
				>
					<PersonAddIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" fontWeight={600} gutterBottom>
						No employees found
					</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						{search || deptFilter || statusFilter
							? 'Try adjusting your filters'
							: 'Add your first employee to get started with the HR module'}
					</Typography>
					{!search && !deptFilter && !statusFilter && (
						<Button variant="contained" startIcon={<PersonAddIcon />}>
							Add First Employee
						</Button>
					)}
				</Box>
			) : (
				<Grid container spacing={2}>
					{employees.map((emp) => (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={emp.public_id}>
							<EmployeeCard
								employee={emp}
								onClick={() => {/* navigate to profile */}}
							/>
						</Grid>
					))}
				</Grid>
			)}
		</HRLayout>
	);
};

export default EmployeeDirectoryPage;
