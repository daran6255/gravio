import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Button,
	Paper,
	Tabs,
	Tab,
	useTheme,
	alpha
} from '@mui/material';
import {
	Add as AddIcon,
	History as HistoryIcon,
	AdminPanelSettings as AdminIcon,
	RequestQuote as RequestIcon,
	EventBusy as LeaveIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import MySubmissionsTable from '../../components/projects/dsr/my-submission/MySubmissionsTable';
import { useDSRHistory } from '../../components/projects/dsr/hooks/useDSRHistory';
import DSRAdminSection from '../../components/projects/dsr/admin/DSRAdminSection';
import { useDSRAdmin } from '../../components/projects/dsr/hooks/useDSRAdmin';
import DSRSubmissionDialog from '../../components/projects/dsr/forms/DSRSubmissionDialog';
import ApplyLeaveDialog from '../../components/projects/dsr/forms/ApplyLeaveDialog';
import PermissionRequestDialog from '../../components/projects/dsr/forms/PermissionRequestDialog';
import DSRModuleLayout from '../../components/projects/dsr/layout/DSRModuleLayout';
import DSRCalendarView from '../../components/projects/dsr/calendar';
import MyLeavesTable from '../../components/projects/dsr/user/MyLeavesTable';
import dayjs from 'dayjs';
import {
	fetchPermissionRequests,
	fetchLeaveStats,
	fetchMyStatsSummary,
	fetchCalendarEntries
} from '../../store/slices/dsrSlice';
import DSRStatsHeader from '../../components/projects/dsr/DSRStatsHeader';
import MyPermissionRequests from '../../components/projects/dsr/user/MyPermissionRequests';
import FilterDrawer from '../../components/common/drawer/FilterDrawer';
import type { FilterField } from '../../components/common/drawer/FilterDrawer';
import { DSRStatusValues } from '../../models/dsr';
// PermissionStatsCards removed

const TabLabel: React.FC<{
	icon: React.ReactNode;
	label: string;
	count?: number;
	active?: boolean;
}> = ({ icon, label, count, active }) => {
	const theme = useTheme();
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
			<Box sx={{
				display: 'flex',
				alignItems: 'center',
				color: active ? 'primary.main' : 'text.secondary',
				transition: 'color 0.2s ease'
			}}>
				{icon}
			</Box>
			<Typography
				variant="inherit"
				sx={{
					fontWeight: active ? 700 : 500,
					fontSize: '0.875rem',
					color: active ? 'text.primary' : 'text.secondary'
				}}
			>
				{label}
			</Typography>
			{count !== undefined && count > 0 && (
				<Box
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						minWidth: 22,
						height: 18,
						px: 0.8,
						borderRadius: '10px',
						bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'action.hover',
						color: active ? 'primary.main' : 'text.secondary',
						fontSize: '0.7rem',
						fontWeight: 800,
						transition: 'all 0.2s ease',
						border: '1px solid',
						borderColor: active ? alpha(theme.palette.primary.main, 0.2) : 'transparent'
					}}
				>
					{count}
				</Box>
			)}
		</Box>
	);
};

const DSRDashboard: React.FC = () => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';
	const isPrivileged = user?.role === 'admin' || user?.role === 'manager';
	const { permissionRequests, loading: dsrLoading } = useAppSelector((state) => state.dsr);
	// permissionStats removed

	const [activeTab, setActiveTab] = useState(0);
	const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
	const [isLeaveOpen, setIsLeaveOpen] = useState(false);
	const [isPermissionRequestOpen, setIsPermissionRequestOpen] = useState(false);
	const [editEntryId, setEditEntryId] = useState<string | null>(null);
	const [isViewOnly, setIsViewOnly] = useState(false);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const history = useDSRHistory();
	const admin = useDSRAdmin();

	const filterFields: FilterField[] = [
		{
			key: 'status',
			label: 'Status',
			type: 'single-select',
			options: [
				{ label: 'Draft', value: DSRStatusValues.DRAFT },
				{ label: 'Submitted', value: DSRStatusValues.SUBMITTED },
				{ label: 'Approved', value: DSRStatusValues.APPROVED },
				{ label: 'Rejected', value: DSRStatusValues.REJECTED }
			]
		},
		{
			key: 'dateFrom',
			label: 'Date From',
			type: 'date'
		},
		{
			key: 'dateTo',
			label: 'Date To',
			type: 'date'
		}
	];

	const activeFilters = {
		status: history.status,
		dateFrom: history.dateFrom,
		dateTo: history.dateTo
	};

	const activeFilterCount = Object.values(activeFilters).filter(v => !!v).length;

	// Fetch initial data
	useEffect(() => {
		if (activeTab === 1) {
			dispatch(fetchPermissionRequests({ skip: 0, limit: 100, user_id: user?.id }));
		} else if (activeTab === 3 && isAdmin) {
			admin.handleRefresh();
		}
		// Always fetch summary stats
		dispatch(fetchMyStatsSummary());
	}, [dispatch, activeTab, user?.id, isPrivileged, isAdmin]);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const handleOpenSubmission = () => {
		setEditEntryId(null);
		setIsViewOnly(false);
		setIsSubmissionOpen(true);
	};

	const handleEditEntry = (id: string) => {
		setEditEntryId(id);
		setIsViewOnly(false);
		setIsSubmissionOpen(true);
	};

	const handleViewEntry = (id: string) => {
		setEditEntryId(id);
		setIsViewOnly(true);
		setIsSubmissionOpen(true);
	};

	const handleSubmissionSuccess = () => {
		setIsSubmissionOpen(false);
		setIsLeaveOpen(false);
		setEditEntryId(null);
		history.fetchHistory();
		dispatch(fetchMyStatsSummary());
	};

	const handleCloseSubmission = () => {
		setIsSubmissionOpen(false);
		setEditEntryId(null);
		setIsViewOnly(false);
		history.fetchHistory();
		if (activeTab === 1) {
			dispatch(fetchPermissionRequests({ skip: 0, limit: 100, user_id: user?.id }));
		} else if (activeTab === 2) {
			dispatch(fetchLeaveStats());
		} else if (activeTab === 3 && isPrivileged) {
			admin.handleRefresh();
		}
	};

	const handlePermissionRequestClose = () => {
		setIsPermissionRequestOpen(false);
		dispatch(fetchPermissionRequests({ skip: 0, limit: 100, user_id: user?.id }));
	};

	return (
		<DSRModuleLayout
			title="Timesheets"
			subtitle="Track work hours, manage submissions, and review team activity."
			headerChildren={<DSRStatsHeader />}
		>
			{() => (
				<Box sx={{ width: '100%', mb: 6 }}>
					<Paper elevation={0} variant="outlined" sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
						<Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
							<Tabs
								value={activeTab}
								onChange={handleTabChange}
								sx={{
									px: 2,
									'& .MuiTabs-indicator': { backgroundColor: 'primary.main', height: 3, borderRadius: '3px 3px 0 0' }
								}}
							>
								<Tab
									label={
										<TabLabel
											icon={<HistoryIcon sx={{ fontSize: 18 }} />}
											label="My Submissions"
											active={activeTab === 0}
										/>
									}
									sx={{ textTransform: 'none', minHeight: 48 }}
								/>
								<Tab
									label={
										<TabLabel
											icon={<RequestIcon sx={{ fontSize: 18 }} />}
											label="My Requests"
											active={activeTab === 1}
										/>
									}
									sx={{ textTransform: 'none', minHeight: 48 }}
								/>
								<Tab
									label={
										<TabLabel
											icon={<LeaveIcon sx={{ fontSize: 18 }} />}
											label="My Leaves"
											active={activeTab === 2}
										/>
									}
									sx={{ textTransform: 'none', minHeight: 48 }}
								/>
								{isAdmin && (
									<Tab
										label={
											<TabLabel
												icon={<AdminIcon sx={{ fontSize: 18 }} />}
												label="Admin Overview"
												count={admin.reviewQueueTotal}
												active={activeTab === 3}
											/>
										}
										sx={{ textTransform: 'none', minHeight: 48 }}
									/>
								)}
							</Tabs>
						</Box>

						<Box sx={{ p: 3, bgcolor: 'white' }}>
							{activeTab === 0 && (
								<Box>
									<Box sx={{
										mb: { xs: 2, md: 4 },
										display: 'flex',
										flexDirection: { xs: 'column', sm: 'row' },
										justifyContent: 'space-between',
										alignItems: { xs: 'flex-start', sm: 'center' },
										gap: 2
									}}>
										<Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>My Submissions</Typography>
										<Box sx={{
											display: 'flex',
											flexWrap: 'wrap',
											gap: { xs: 1, sm: 2 },
											width: { xs: '100%', sm: 'auto' }
										}}>
											<Button
												variant="outlined"
												startIcon={<RequestIcon />}
												onClick={() => setIsPermissionRequestOpen(true)}
												sx={{
													color: '#232f3e',
													borderColor: '#d5dbdb',
													fontWeight: 700,
													textTransform: 'none',
													fontSize: { xs: '0.75rem', sm: '0.8125rem' },
													px: 2,
													whiteSpace: 'nowrap',
													flex: { xs: '1 1 auto', sm: 'none' },
													'&:hover': { bgcolor: '#f3f3f3', borderColor: '#aab7bd' }
												}}
											>
												Raise Request
											</Button>
											<Button
												variant="outlined"
												startIcon={<LeaveIcon />}
												onClick={() => setIsLeaveOpen(true)}
												sx={{
													color: '#d32f2f',
													borderColor: '#ffcdd2',
													fontWeight: 700,
													textTransform: 'none',
													fontSize: { xs: '0.75rem', sm: '0.8125rem' },
													px: 2,
													whiteSpace: 'nowrap',
													flex: { xs: '1 1 auto', sm: 'none' },
													'&:hover': { bgcolor: '#fff5f5', borderColor: '#ef9a9a' }
												}}
											>
												Apply for Leave
											</Button>
											<Button
												variant="contained"
												startIcon={<AddIcon />}
												onClick={handleOpenSubmission}
												sx={{
													bgcolor: '#ec7211',
													'&:hover': { bgcolor: '#eb5f07' },
													px: { xs: 2, sm: 3 },
													py: 0.8,
													fontWeight: 700,
													fontSize: { xs: '0.75rem', sm: '0.8125rem' },
													whiteSpace: 'nowrap',
													flex: { xs: '1 1 100%', sm: 'none' },
													boxShadow: '0 1px 1px 0 rgba(0,0,0,0.1)'
												}}
											>
												Submit Timesheet
											</Button>
										</Box>
									</Box>

									<Box sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', lg: '1fr', xl: '3.5fr 1.2fr' },
										gap: { xs: 3, md: 4 }
									}}>
										{/* On Laptop/Tablet (md/lg), show Calendar above/first or as a dashboard top-tile */}
										<Box sx={{
											order: { xs: 1, xl: 2 },
											display: 'flex',
											flexDirection: 'column',
											gap: 3
										}}>
											<DSRCalendarView />
										</Box>

										<Box sx={{
											minWidth: 0,
											order: { xs: 2, xl: 1 }
										}}>
											<MySubmissionsTable
												entries={history.entries}
												total={history.total}
												loading={history.loading}
												page={history.page}
												rowsPerPage={history.rowsPerPage}
												onPageChange={(p) => history.setPage(p)}
												onRowsPerPageChange={(rows) => history.setRowsPerPage(rows)}
												onDelete={history.handleDelete}
												onEdit={handleEditEntry}
												onView={handleViewEntry}
												searchTerm={history.searchTerm}
												onSearchChange={history.setSearchTerm}
												onRefresh={history.fetchHistory}
												onFilterOpen={() => setIsFilterOpen(true)}
												activeFilterCount={activeFilterCount}
											/>
										</Box>
									</Box>
								</Box>
							)}

							{activeTab === 1 && (
								<Box>
									<Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Request Tracking</Typography>
									{/* PermissionStatsCards removed */}
									<MyPermissionRequests
										requests={permissionRequests}
										loading={dsrLoading}
									/>
								</Box>
							)}

							{activeTab === 2 && (
								<Box>
									<Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>My Leave Applications</Typography>
									<MyLeavesTable />
								</Box>
							)}

							{activeTab === 3 && isAdmin && (
								<DSRAdminSection
									admin={admin}
								/>
							)}
						</Box>
					</Paper>

					<DSRSubmissionDialog
						open={isSubmissionOpen}
						onClose={handleCloseSubmission}
						onSuccess={handleSubmissionSuccess}
						entryId={editEntryId}
						readOnly={isViewOnly}
					/>

					<ApplyLeaveDialog
						open={isLeaveOpen}
						onClose={() => setIsLeaveOpen(false)}
						onSuccess={() => {
							history.fetchHistory();
							dispatch(fetchLeaveStats());
							// Refresh calendar data too - use full range
							const start = dayjs().startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
							const end = dayjs().endOf('month').add(7, 'day').format('YYYY-MM-DD');
							dispatch(fetchCalendarEntries({ date_from: start, date_to: end }));
						}}
					/>

					<PermissionRequestDialog
						open={isPermissionRequestOpen}
						onClose={handlePermissionRequestClose}
					/>

					<FilterDrawer
						open={isFilterOpen}
						onClose={() => setIsFilterOpen(false)}
						fields={filterFields}
						activeFilters={activeFilters}
						onFilterChange={(key, value) => {
							if (key === 'status') history.setStatus(value);
							if (key === 'dateFrom') history.setDateFrom(value);
							if (key === 'dateTo') history.setDateTo(value);
						}}
						onClearFilters={history.handleClearFilters}
						onApplyFilters={() => {
							setIsFilterOpen(false);
							history.fetchHistory();
						}}
					/>
				</Box>
			)}
		</DSRModuleLayout>
	);
};

export default DSRDashboard;
