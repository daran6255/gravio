import React, { useState, useEffect } from 'react';
import {
	Paper,
	Typography,
	Grid,
	Button,
	TextField,
	MenuItem,
	Stack,
	TableRow,
	TableCell,
	useTheme
} from '@mui/material';
import { Download as ExportIcon, Schedule as TotalHoursIcon, AttachMoney as BillableIcon, MoneyOff as NonBillableIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTimesheetReport } from '../../../store/slices/timesheetSlice';
import { fetchProjects } from '../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../store/slices/crmSlice';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import { responsiveStyles } from '../../../theme';
import { DatePicker } from '../../common/form';
import { StatCard } from '../../common/stats/StatCard';
import { DataTable, type ColumnDefinition } from '../../common/table';
import type { TimesheetReportRow } from '../../../models/timesheet';

// CSV exporter helper
const exportReportToCSV = (rows: TimesheetReportRow[]) => {
	const headers = ['User Name', 'Project Name', 'Task Title', 'Category Name', 'Billing Type', 'Total Hours'];
	const csvContent = [
		headers.join(','),
		...rows.map((r) => [
			`"${(r.user_name || '').replace(/"/g, '""')}"`,
			`"${(r.project_name || 'General').replace(/"/g, '""')}"`,
			`"${(r.task_title || '').replace(/"/g, '""')}"`,
			`"${(r.category_name || '').replace(/"/g, '""')}"`,
			`"${r.billing_type}"`,
			r.total_hours
		].join(','))
	].join('\r\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', `timesheet_export_${new Date().toISOString().split('T')[0]}.csv`);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

const TimesheetReportPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const theme = useTheme();

	const currentUser = useAppSelector((state) => state.auth.user);
	const { projects } = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);
	const { users: allUsers } = useAppSelector((state) => state.users);
	const { reportRows, reportRowsLoading } = useAppSelector((state) => state.timesheets);

	const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

	// Project Management is a separate plan add-on -- skip the (otherwise 403'ing)
	// projects fetch for orgs that don't have it; the filter just stays "All Projects".
	const hasProjectModule = React.useMemo(() => {
		if (currentUser?.is_superuser) return true;
		const org = currentUser?.organization;
		if (!org) return false;
		if (org.subscription_status === 'trial') return true;
		return org.plan?.enabled_modules?.includes('project_management') ?? false;
	}, [currentUser]);

	// Report filter states
	const [startDate, setStartDate] = useState(
		new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
	);
	const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
	const [projectId, setProjectId] = useState<number | ''>('');
	const [userId, setUserId] = useState<number | ''>('');
	const [billingType, setBillingType] = useState<string | ''>('');

	// Pagination states
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		if (hasProjectModule) {
			dispatch(fetchProjects({ pageSize: 100 }));
		}
		dispatch(fetchOwners());
		dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
	}, [dispatch, hasProjectModule]);

	// Filter user options in the dropdown
	const userOptions = React.useMemo(() => {
		if (!currentUser) return [];

		// Create a map of email -> TeamMember to easily lookup reporting_manager_id
		const memberMap = new Map<string, typeof allUsers[0]>();
		allUsers.forEach((u) => memberMap.set(u.email.toLowerCase(), u));

		if (currentUser.role === 'admin') {
			return owners;
		}

		if (currentUser.role === 'manager') {
			return owners.filter((o) => {
				if (o.id === currentUser.id) return true;
				const member = memberMap.get(o.email.toLowerCase());
				return member?.reporting_manager_id === currentUser.id;
			});
		}

		// Otherwise (regular employee)
		return owners.filter((o) => o.id === currentUser.id);
	}, [owners, allUsers, currentUser]);

	const loadReport = () => {
		dispatch(
			fetchTimesheetReport({
				start_date: startDate,
				end_date: endDate,
				project_id: projectId || null,
				user_id: isManagerOrAdmin ? (userId || null) : (currentUser?.id || null),
				billing_type: billingType || null
			})
		);
		setPage(0);
	};

	useEffect(() => {
		loadReport();
	}, [startDate, endDate, projectId, userId, billingType, currentUser]);

	// Summaries
	const summaryStats = React.useMemo(() => {
		let total = 0;
		let billable = 0;
		let nonBillable = 0;

		reportRows.forEach((r) => {
			total += r.total_hours;
			if (r.billing_type === 'billable') {
				billable += r.total_hours;
			} else {
				nonBillable += r.total_hours;
			}
		});

		return { total, billable, nonBillable };
	}, [reportRows]);

	const handleChangePage = (_: unknown, newPage: number) => {
		setPage(newPage);
	};

	const paginatedRows = reportRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const columns: ColumnDefinition<TimesheetReportRow>[] = [
		{ id: 'user_name', label: 'User Name' },
		{ id: 'project_name', label: 'Project' },
		{ id: 'task_title', label: 'Task / Category' },
		{ id: 'billing_type', label: 'Billing Type' },
		{ id: 'total_hours', label: 'Total Hours', align: 'right' }
	];

	const renderRow = (row: TimesheetReportRow) => (
		<TableRow key={`${row.user_name}-${row.project_name || 'general'}-${row.task_title || row.category_name || 'none'}-${row.billing_type}-${row.total_hours}`}>
			<TableCell>{row.user_name}</TableCell>
			<TableCell>{row.project_name || 'General'}</TableCell>
			<TableCell>{row.task_title || row.category_name || '—'}</TableCell>
			<TableCell sx={{ textTransform: 'uppercase', fontWeight: 700, color: row.billing_type === 'billable' ? 'success.main' : 'text.secondary', fontSize: '0.75rem' }}>
				{row.billing_type === 'billable' ? 'Billable' : 'Non-Billable'}
			</TableCell>
			<TableCell align="right" sx={{ pr: 3, fontWeight: 700 }}>
				{row.total_hours} hrs
			</TableCell>
		</TableRow>
	);

	return (
		<Stack spacing={4}>
			{/* Filters Box */}
			<Paper
				elevation={0}
				sx={{
					p: 3,
					border: 1,
					borderColor: 'divider',
					borderRadius: 6,
					bgcolor: 'background.paper'
				}}
			>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
					Report Filters
				</Typography>
				<Grid container spacing={2} alignItems="center">
					<Grid size={{ xs: 12, sm: 6, md: isManagerOrAdmin ? 2.4 : 3 }}>
						<DatePicker
							label="From Date"
							value={startDate || null}
							onChange={(value) => setStartDate(value)}
							fullWidth
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: isManagerOrAdmin ? 2.4 : 3 }}>
						<DatePicker
							label="To Date"
							value={endDate || null}
							onChange={(value) => setEndDate(value)}
							fullWidth
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: isManagerOrAdmin ? 2.4 : 3 }}>
						<TextField
							select
							label="Project"
							value={projectId}
							onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
							fullWidth
						>
							<MenuItem value="">All Projects</MenuItem>
							{projects.map((p) => (
								<MenuItem key={p.id} value={p.id}>
									{p.name}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					{isManagerOrAdmin && (
						<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
							<TextField
								select
								label="User"
								value={userId}
								onChange={(e) => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
								fullWidth
							>
								<MenuItem value="">All Team Members</MenuItem>
								{userOptions.map((o) => (
									<MenuItem key={o.id} value={o.id}>
										{o.full_name || o.email}
									</MenuItem>
								))}
							</TextField>
						</Grid>
					)}
					<Grid size={{ xs: 12, sm: 6, md: isManagerOrAdmin ? 2.4 : 3 }}>
						<TextField
							select
							label="Billing Type"
							value={billingType}
							onChange={(e) => setBillingType(e.target.value)}
							fullWidth
						>
							<MenuItem value="">All Billing Types</MenuItem>
							<MenuItem value="billable">Billable Only</MenuItem>
							<MenuItem value="non_billable">Non-Billable Only</MenuItem>
						</TextField>
					</Grid>
				</Grid>
			</Paper>

			{/* KPI Summary Cards */}
			<Grid container spacing={responsiveStyles.statsGridSpacing}>
				<Grid size={{ xs: 12, sm: 4 }}>
					<StatCard
						title="TOTAL LOGGED HOURS"
						value={`${summaryStats.total} hrs`}
						icon={<TotalHoursIcon sx={{ fontSize: 24 }} />}
						color={theme.palette.primary.main}
						tooltip="Total hours logged across all matching entries for the selected filters"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<StatCard
						title="BILLABLE HOURS"
						value={`${summaryStats.billable} hrs`}
						icon={<BillableIcon sx={{ fontSize: 24 }} />}
						color={theme.palette.success.main}
						tooltip="Hours logged as billable within the selected filters"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<StatCard
						title="NON-BILLABLE HOURS"
						value={`${summaryStats.nonBillable} hrs`}
						icon={<NonBillableIcon sx={{ fontSize: 24 }} />}
						color={theme.palette.text.secondary}
						tooltip="Hours logged as non-billable within the selected filters"
					/>
				</Grid>
			</Grid>

			<DataTable<TimesheetReportRow>
				columns={columns}
				data={paginatedRows}
				loading={reportRowsLoading}
				totalCount={reportRows.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handleChangePage}
				onRowsPerPageChange={(newRows) => { setRowsPerPage(newRows); setPage(0); }}
				searchTerm=""
				headerActions={
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							Report Details
						</Typography>
						<Button
							variant="outlined"
							startIcon={<ExportIcon />}
							onClick={() => exportReportToCSV(reportRows)}
							disabled={reportRows.length === 0}
							sx={{ borderRadius: 3, fontWeight: 600 }}
						>
							Export CSV
						</Button>
					</Stack>
				}
				renderRow={renderRow}
				emptyMessage="No logs found matching selected filters."
			/>
		</Stack>
	);
};

export default TimesheetReportPanel;
