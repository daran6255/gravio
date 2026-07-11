import React from 'react';
import {
	Paper,
	Typography,
	Button,
	TextField,
	MenuItem,
	Stack,
	TableRow,
	TableCell,
	Chip,
	Box,
	Divider,
	useTheme,
	alpha
} from '@mui/material';
import {
	Download as ExportIcon,
	Schedule as TotalHoursIcon,
	AttachMoney as BillableIcon,
	MoneyOff as NonBillableIcon,
	ReceiptLongOutlined as EntriesIcon,
	RestartAlt as ResetIcon,
	FolderOpenOutlined as ProjectIcon,
	AssignmentOutlined as TaskIcon
} from '@mui/icons-material';
import { useTimesheetReport } from './hooks/useTimesheetReport';
import { DatePicker } from '../../common/form';
import { DataTable, type ColumnDefinition } from '../../common/table';
import EnterpriseAvatar from '../../common/avatar/Avatar';
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

const defaultStartDate = () => new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
const defaultEndDate = () => new Date().toISOString().split('T')[0];

const TimesheetReportPanel: React.FC = () => {
	const theme = useTheme();

	const {
		startDate, setStartDate,
		endDate, setEndDate,
		projectId, setProjectId,
		userId, setUserId,
		billingType, setBillingType,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		projects,
		reportRows,
		reportRowsLoading,
		isManagerOrAdmin,
		userOptions,
		summaryStats,
		handleChangePage,
		paginatedRows
	} = useTimesheetReport();

	const hasActiveFilters = !!projectId || !!userId || !!billingType
		|| startDate !== defaultStartDate() || endDate !== defaultEndDate();

	const resetFilters = () => {
		setStartDate(defaultStartDate());
		setEndDate(defaultEndDate());
		setProjectId('');
		setUserId('');
		setBillingType('');
	};

	const maxHours = Math.max(1, ...reportRows.map((r) => r.total_hours));

	const metrics = [
		{
			label: 'Total Hours',
			value: `${summaryStats.total}`,
			suffix: 'hrs',
			icon: <TotalHoursIcon sx={{ fontSize: 20 }} />,
			color: theme.palette.primary.main
		},
		{
			label: 'Billable',
			value: `${summaryStats.billable}`,
			suffix: 'hrs',
			detail: summaryStats.total > 0 ? `${Math.round((summaryStats.billable / summaryStats.total) * 100)}% of total` : undefined,
			icon: <BillableIcon sx={{ fontSize: 20 }} />,
			color: theme.palette.success.main
		},
		{
			label: 'Non-Billable',
			value: `${summaryStats.nonBillable}`,
			suffix: 'hrs',
			detail: summaryStats.total > 0 ? `${Math.round((summaryStats.nonBillable / summaryStats.total) * 100)}% of total` : undefined,
			icon: <NonBillableIcon sx={{ fontSize: 20 }} />,
			color: theme.palette.text.secondary
		},
		{
			label: 'Entries',
			value: `${reportRows.length}`,
			suffix: reportRows.length === 1 ? 'row' : 'rows',
			icon: <EntriesIcon sx={{ fontSize: 20 }} />,
			color: '#6c5ce7'
		}
	];

	const columns: ColumnDefinition<TimesheetReportRow>[] = [
		{ id: 'user_name', label: 'Team Member' },
		{ id: 'project_name', label: 'Project' },
		{ id: 'task_title', label: 'Task / Category' },
		{ id: 'billing_type', label: 'Billing Type', align: 'center' },
		{ id: 'total_hours', label: 'Total Hours', align: 'right' }
	];

	const renderRow = (row: TimesheetReportRow) => (
		<TableRow
			key={`${row.user_name}-${row.project_name || 'general'}-${row.task_title || row.category_name || 'none'}-${row.billing_type}-${row.total_hours}`}
			hover
			sx={{ '&:last-child td': { border: 0 } }}
		>
			<TableCell>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<EnterpriseAvatar name={row.user_name || 'Unknown'} size={32} />
					<Typography variant="body2" sx={{ fontWeight: 700 }}>
						{row.user_name}
					</Typography>
				</Stack>
			</TableCell>
			<TableCell>
				<Stack direction="row" spacing={1} alignItems="center">
					<ProjectIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
					<Typography variant="body2">{row.project_name || 'General'}</Typography>
				</Stack>
			</TableCell>
			<TableCell>
				<Stack direction="row" spacing={1} alignItems="center">
					<TaskIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
					<Typography variant="body2" color="text.secondary">
						{row.task_title || row.category_name || '—'}
					</Typography>
				</Stack>
			</TableCell>
			<TableCell align="center">
				<Chip
					label={row.billing_type === 'billable' ? 'Billable' : 'Non-Billable'}
					size="small"
					sx={{
						fontWeight: 700,
						borderRadius: 3,
						bgcolor: row.billing_type === 'billable'
							? alpha(theme.palette.success.main, 0.12)
							: alpha(theme.palette.text.primary, 0.06),
						color: row.billing_type === 'billable' ? 'success.main' : 'text.secondary'
					}}
				/>
			</TableCell>
			<TableCell align="right" sx={{ pr: 3 }}>
				<Stack alignItems="flex-end" spacing={0.5}>
					<Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
						{row.total_hours} hrs
					</Typography>
					<Box sx={{ width: 72, height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), overflow: 'hidden' }}>
						<Box
							sx={{
								width: `${Math.max(6, Math.round((row.total_hours / maxHours) * 100))}%`,
								height: '100%',
								borderRadius: 2,
								bgcolor: 'primary.main'
							}}
						/>
					</Box>
				</Stack>
			</TableCell>
		</TableRow>
	);

	return (
		<Stack spacing={3}>
			{/* Filter Toolbar */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 4,
					bgcolor: alpha(theme.palette.text.primary, 0.02)
				}}
			>
				<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
					<Box sx={{ minWidth: 160 }}>
						<DatePicker label="From Date" value={startDate || null} onChange={(value) => setStartDate(value)} fullWidth textFieldProps={{ size: 'small' }} />
					</Box>
					<Box sx={{ minWidth: 160 }}>
						<DatePicker label="To Date" value={endDate || null} onChange={(value) => setEndDate(value)} fullWidth textFieldProps={{ size: 'small' }} />
					</Box>
					<TextField
						select
						size="small"
						label="Project"
						value={projectId}
						onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
						sx={{ minWidth: 160 }}
					>
						<MenuItem value="">All Projects</MenuItem>
						{projects.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
							</MenuItem>
						))}
					</TextField>
					{isManagerOrAdmin && (
						<TextField
							select
							size="small"
							label="User"
							value={userId}
							onChange={(e) => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
							sx={{ minWidth: 170 }}
						>
							<MenuItem value="">All Team Members</MenuItem>
							{userOptions.map((o) => (
								<MenuItem key={o.id} value={o.id}>
									{o.full_name || o.email}
								</MenuItem>
							))}
						</TextField>
					)}
					<TextField
						select
						size="small"
						label="Billing Type"
						value={billingType}
						onChange={(e) => setBillingType(e.target.value)}
						sx={{ minWidth: 170 }}
					>
						<MenuItem value="">All Billing Types</MenuItem>
						<MenuItem value="billable">Billable Only</MenuItem>
						<MenuItem value="non_billable">Non-Billable Only</MenuItem>
					</TextField>

					{hasActiveFilters && (
						<Button
							size="small"
							startIcon={<ResetIcon fontSize="small" />}
							onClick={resetFilters}
							sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none', ml: { sm: 'auto' } }}
						>
							Reset
						</Button>
					)}
				</Stack>
			</Paper>

			{/* Metric Strip */}
			<Paper
				elevation={0}
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 5,
					overflow: 'hidden',
					bgcolor: 'background.paper'
				}}
			>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
				>
					{metrics.map((metric) => (
						<Stack
							key={metric.label}
							direction="row"
							spacing={1.5}
							alignItems="center"
							sx={{ flex: 1, p: 2.5, borderBottom: { xs: '1px solid', sm: 'none' }, borderColor: 'divider' }}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 40,
									height: 40,
									borderRadius: 3,
									flexShrink: 0,
									bgcolor: alpha(metric.color, 0.12),
									color: metric.color
								}}
							>
								{metric.icon}
							</Box>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}>
									{metric.label}
								</Typography>
								<Stack direction="row" spacing={0.5} alignItems="baseline">
									<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
										{metric.value}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
										{metric.suffix}
									</Typography>
								</Stack>
								{metric.detail && (
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
										{metric.detail}
									</Typography>
								)}
							</Box>
						</Stack>
					))}
				</Stack>
			</Paper>

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
							variant="contained"
							startIcon={<ExportIcon />}
							onClick={() => exportReportToCSV(reportRows)}
							disabled={reportRows.length === 0}
							sx={{ borderRadius: 3, fontWeight: 700, boxShadow: 'none' }}
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
