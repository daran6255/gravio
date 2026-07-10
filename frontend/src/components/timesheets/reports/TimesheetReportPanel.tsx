import React, { useState, useEffect } from 'react';
import {
	Paper,
	Typography,
	Grid,
	Card,
	CardContent,
	Button,
	TextField,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TablePagination,
	useTheme
} from '@mui/material';
import { Download as ExportIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTimesheetReport } from '../../../store/slices/timesheetSlice';
import { fetchProjects } from '../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../store/slices/crmSlice';
import { DatePicker } from '../../common/form';
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
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();

	const currentUser = useAppSelector((state) => state.auth.user);
	const { projects } = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);
	const { reportRows, reportRowsLoading } = useAppSelector((state) => state.timesheets);

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
	}, [dispatch, hasProjectModule]);

	const loadReport = () => {
		dispatch(
			fetchTimesheetReport({
				start_date: startDate,
				end_date: endDate,
				project_id: projectId || null,
				user_id: userId || null,
				billing_type: billingType || null
			})
		);
		setPage(0);
	};

	useEffect(() => {
		loadReport();
	}, [startDate, endDate, projectId, userId, billingType]);

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

	const handleChangePage = (_: any, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const paginatedRows = reportRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<Stack spacing={4}>
			{/* Filters Box */}
			<Paper
				elevation={0}
				sx={{
					p: 3,
					border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
					borderRadius: '12px',
					bgcolor: isDark ? '#141822' : '#ffffff'
				}}
			>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
					Report Filters
				</Typography>
				<Grid container spacing={2} alignItems="center">
					<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
						<DatePicker
							label="From Date"
							value={startDate || null}
							onChange={(value) => setStartDate(value)}
							fullWidth
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
						<DatePicker
							label="To Date"
							value={endDate || null}
							onChange={(value) => setEndDate(value)}
							fullWidth
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
					<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
						<TextField
							select
							label="User"
							value={userId}
							onChange={(e) => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
							fullWidth
						>
							<MenuItem value="">All Team Members</MenuItem>
							{owners.map((o) => (
								<MenuItem key={o.id} value={o.id}>
									{o.full_name || o.email}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, sm: 4 }}>
					<Card elevation={0} sx={{ border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`, borderRadius: '12px', bgcolor: isDark ? '#141822' : '#ffffff' }}>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
								Total Logged Hours
							</Typography>
							<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'primary.main' }}>
								{summaryStats.total} hrs
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<Card elevation={0} sx={{ border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`, borderRadius: '12px', bgcolor: isDark ? '#141822' : '#ffffff' }}>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
								Billable Hours
							</Typography>
							<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'success.main' }}>
								{summaryStats.billable} hrs
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<Card elevation={0} sx={{ border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`, borderRadius: '12px', bgcolor: isDark ? '#141822' : '#ffffff' }}>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
								Non-Billable Hours
							</Typography>
							<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.secondary' }}>
								{summaryStats.nonBillable} hrs
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Details Table */}
			<Paper
				elevation={0}
				sx={{
					border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
					borderRadius: '12px',
					overflow: 'hidden',
					bgcolor: isDark ? '#141822' : '#ffffff'
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, borderBottom: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}` }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
						Report Details
					</Typography>
					<Button
						variant="outlined"
						startIcon={<ExportIcon />}
						onClick={() => exportReportToCSV(reportRows)}
						disabled={reportRows.length === 0}
						sx={{ borderRadius: '6px', fontWeight: 600 }}
					>
						Export CSV
					</Button>
				</Stack>

				<TableContainer>
					<Table>
						<TableHead>
							<TableRow sx={{ bgcolor: isDark ? '#1C212E' : '#F8FAFC' }}>
								<TableCell sx={{ fontWeight: 700 }}>User Name</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Task / Category</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Billing Type</TableCell>
								<TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Total Hours</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{reportRowsLoading ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 6 }}>
										<Typography variant="body2" color="text.secondary">
											Loading report data...
										</Typography>
									</TableCell>
								</TableRow>
							) : paginatedRows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 6 }}>
										<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
											No logs found matching selected filters.
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								paginatedRows.map((row, idx) => (
									<TableRow key={idx}>
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
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>

				<TablePagination
					rowsPerPageOptions={[10, 25, 50]}
					component="div"
					count={reportRows.length}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
				/>
			</Paper>
		</Stack>
	);
};

export default TimesheetReportPanel;
