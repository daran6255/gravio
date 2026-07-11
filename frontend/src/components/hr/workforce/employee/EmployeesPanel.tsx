import React, { useState, useEffect, useCallback } from 'react';
import {
	Box, Grid, Typography, TextField, InputAdornment,
	MenuItem, Select, FormControl, InputLabel, Button,
	Card, CardContent, Skeleton, alpha, useTheme
} from '@mui/material';
import {
	Search as SearchIcon,
	Close as CloseIcon,
	PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEmployees, fetchDepartments } from '../../../../store/slices/hrSlice';
import type { EmployeeStatus } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import EmployeeCard from './EmployeeCard';

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
	const theme = useTheme();
	const { error } = useToast();
	const dispatch = useAppDispatch();
	const { employees, employeesLoading: loading, departments } = useAppSelector((state) => state.hr);

	const [search, setSearch] = useState('');
	const [deptFilter, setDeptFilter] = useState<number | ''>('');
	const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');

	const loadEmployees = useCallback(() => {
		const params = {
			...(search && { search }),
			...(deptFilter && { department_id: deptFilter as number }),
			...(statusFilter && { employee_status: statusFilter }),
			limit: 100,
		};
		dispatch(fetchEmployees(params)).unwrap().catch(() => error('Failed to load employees'));
	}, [dispatch, search, deptFilter, statusFilter]);

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	useEffect(() => {
		const t = setTimeout(loadEmployees, search ? 350 : 0);
		return () => clearTimeout(t);
	}, [loadEmployees, search]);

	return (
		<Box>
			<Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
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
							{STATUS_OPTIONS.map((o) => (
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

				<Button
					variant="contained"
					startIcon={<PersonAddIcon />}
					size="small"
					sx={{ fontWeight: 600, flexShrink: 0 }}
				>
					Add Employee
				</Button>
			</Box>

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
		</Box>
	);
};

export default EmployeesPanel;
