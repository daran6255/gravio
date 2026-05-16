import React, { useState } from 'react';
import {
	Box,
	Typography,
	Tabs,
	Tab,
	Button,
	Paper
} from '@mui/material';
import {
	RateReview as ReviewIcon,
	VpnKey as PermissionIcon,
	History as HistoryIcon,
	Refresh as RefreshIcon,
	EventBusy as HolidayIcon
} from '@mui/icons-material';
import PermissionRequestsTable from './PermissionRequestsTable';
import AllSubmissionsTable from './AllSubmissionsTable';
import DSRActivityTypeManagement from './DSRActivityTypeManagement';
import HolidayTable from './HolidayTable';
import LeavesApprovalTable from './LeavesApprovalTable';
import type { useDSRAdmin } from '../hooks/useDSRAdmin';

interface DSRAdminSectionProps {
	admin: ReturnType<typeof useDSRAdmin>;
}

const TabLabel: React.FC<{
	icon: React.ReactNode;
	label: string;
	count?: number;
	color?: string;
	active?: boolean;
}> = ({ icon, label, count, color = '#ec7211', active }) => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
		<Box sx={{
			display: 'flex',
			alignItems: 'center',
			color: active ? color : '#545b64',
			transition: 'color 0.2s ease'
		}}>
			{icon}
		</Box>
		<Typography
			variant="inherit"
			sx={{
				fontWeight: active ? 700 : 600,
				fontSize: '0.875rem',
				color: active ? '#232f3e' : '#545b64',
				transition: 'all 0.2s ease'
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
					bgcolor: active ? 'rgba(236, 114, 17, 0.1)' : '#f0f2f5',
					color: active ? color : '#545b64',
					fontSize: '0.7rem',
					fontWeight: 800,
					transition: 'all 0.2s ease',
					border: active ? `1px solid rgba(236, 114, 17, 0.2)` : '1px solid transparent'
				}}
			>
				{count}
			</Box>
		)}
	</Box>
);

const TabPanel: React.FC<{ children: React.ReactNode; index: number; value: number }> = ({ children, value, index }) => (
	<div role="tabpanel" hidden={value !== index} style={{ height: value === index ? 'auto' : 0 }}>
		{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
	</div>
);

const DSRAdminSection: React.FC<DSRAdminSectionProps> = ({ admin }) => {
	const [activeTab, setActiveTab] = useState(0);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const pendingPermissions = admin.permissionRequests.filter(r => r.status === 'pending').length;
	const pendingLeaves = admin.adminLeaves.filter(l => l.status === 'pending').length;

	return (
		<Box>
			<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Box>
					<Typography variant="h5" sx={{ fontWeight: 700, color: '#232f3e' }}>
						Admin Control Center
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Manage submissions, permissions, and monitor global history.
					</Typography>
				</Box>
				<Button
					startIcon={<RefreshIcon />}
					onClick={admin.handleRefresh}
					variant="outlined"
					size="small"
					sx={{
						textTransform: 'none',
						fontWeight: 600,
						borderColor: '#d5dbdb',
						color: '#232f3e',
						'&:hover': { bgcolor: '#f3f3f3', borderColor: '#aab7bd' }
					}}
				>
					Refresh Data
				</Button>
			</Box>

			<Paper elevation={0} variant="outlined" sx={{ borderRadius: '4px', border: '1px solid #eaeded', overflow: 'hidden' }}>
				<Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fbfbfb' }}>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						sx={{
							minHeight: 48,
							px: 2,
							'& .MuiTabs-indicator': {
								backgroundColor: '#ec7211',
								height: 3,
								borderRadius: '3px 3px 0 0'
							}
						}}
					>
						<Tab
							label={
								<TabLabel
									icon={<PermissionIcon sx={{ fontSize: 18 }} />}
									label="Permissions"
									count={pendingPermissions}
									color="#ed6c02"
									active={activeTab === 0}
								/>
							}
							sx={{
								textTransform: 'none',
								minHeight: 48,
								px: 3,
								color: '#545b64',
								'&.Mui-selected': { color: '#ec7211' }
							}}
						/>
						<Tab
							label={
								<TabLabel
									icon={<HistoryIcon sx={{ fontSize: 18 }} />}
									label="Full History"
									active={activeTab === 1}
								/>
							}
							sx={{
								textTransform: 'none',
								minHeight: 48,
								px: 3,
								color: '#545b64',
								'&.Mui-selected': { color: '#ec7211' }
							}}
						/>
						<Tab
							label={
								<TabLabel
									icon={<HolidayIcon sx={{ fontSize: 18 }} />}
									label="Leaves"
									count={pendingLeaves}
									active={activeTab === 2}
								/>
							}
							sx={{
								textTransform: 'none',
								minHeight: 48,
								px: 3,
								color: '#545b64',
								'&.Mui-selected': { color: '#ec7211' }
							}}
						/>
						<Tab
							label={
								<TabLabel
									icon={<ReviewIcon sx={{ fontSize: 18 }} />}
									label="Activity Types"
									active={activeTab === 3}
								/>
							}
							sx={{
								textTransform: 'none',
								minHeight: 48,
								px: 3,
								color: '#545b64',
								'&.Mui-selected': { color: '#ec7211' }
							}}
						/>
						<Tab
							label={
								<TabLabel
									icon={<HolidayIcon sx={{ fontSize: 18 }} />}
									label="Holidays"
									active={activeTab === 4}
								/>
							}
							sx={{
								textTransform: 'none',
								minHeight: 48,
								px: 3,
								color: '#545b64',
								'&.Mui-selected': { color: '#ec7211' }
							}}
						/>
					</Tabs>
				</Box>

				<Box sx={{ p: 3 }}>
					<TabPanel value={activeTab} index={0}>
						<PermissionRequestsTable
							requests={admin.permissionRequests}
							total={admin.totalPermissionRequests}
							loading={admin.loading}
							onHandle={admin.handlePermissionAction}
							onRefresh={admin.handleRefresh}
							searchTerm={admin.permissionsSearchTerm}
							onSearchChange={admin.setPermissionsSearchTerm}
							page={admin.permissionPage}
							rowsPerPage={admin.permissionRowsPerPage}
							onPageChange={(_: unknown, p: number) => admin.setPermissionPage(p)}
							onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => admin.setPermissionRowsPerPage(parseInt(e.target.value, 10))}
							onRowsPerPageSelectChange={(r: number) => admin.setPermissionRowsPerPage(r)}
							statusFilter={admin.permissionStatusFilter}
							onStatusFilterChange={admin.setPermissionStatusFilter}
							filterDrawerOpen={admin.permissionFilterDrawerOpen}
							onFilterDrawerOpen={admin.setPermissionFilterDrawerOpen}
						/>
					</TabPanel>

					<TabPanel value={activeTab} index={1}>
						<AllSubmissionsTable
							entries={admin.entries}
							total={admin.totalEntries}
							loading={admin.loading}
							page={admin.entryPage}
							rowsPerPage={admin.entryRowsPerPage}
							onPageChange={(_: unknown, p: number) => admin.setEntryPage(p)}
							onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => admin.setEntryRowsPerPage(parseInt(e.target.value, 10))}
							onRowsPerPageSelectChange={(r: number) => admin.setEntryRowsPerPage(r)}
							onRefresh={admin.handleRefresh}
							searchTerm={admin.submissionsSearchTerm}
							onSearchChange={admin.setSubmissionsSearchTerm}
							statusFilter={admin.statusFilter}
							onStatusFilterChange={admin.setStatusFilter}
							dateFrom={admin.historyDateFrom}
							onDateFromChange={admin.setHistoryDateFrom}
							dateTo={admin.historyDateTo}
							onDateToChange={admin.setHistoryDateTo}
							filterDrawerOpen={admin.historyFilterDrawerOpen}
							onFilterDrawerOpen={admin.setHistoryFilterDrawerOpen}
							onRevoke={admin.handleRevokeEntry}
						/>
					</TabPanel>

					<TabPanel value={activeTab} index={2}>
						<LeavesApprovalTable
							leaves={admin.adminLeaves}
							total={admin.totalAdminLeaves}
							loading={admin.loading}
							onHandle={admin.handleLeaveAction}
							onRefresh={admin.handleRefresh}
							page={admin.leavePage}
							rowsPerPage={admin.leaveRowsPerPage}
							onPageChange={(_: unknown, p: number) => admin.setLeavePage(p)}
							onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => admin.setLeaveRowsPerPage(parseInt(e.target.value, 10))}
							onRowsPerPageSelectChange={(r: number) => admin.setLeaveRowsPerPage(r)}
							statusFilter={admin.leaveStatusFilter}
							onStatusFilterChange={admin.setLeaveStatusFilter}
							filterDrawerOpen={admin.leaveFilterDrawerOpen}
							onFilterDrawerOpen={admin.setLeaveFilterDrawerOpen}
						/>
					</TabPanel>

					<TabPanel value={activeTab} index={3}>
						<DSRActivityTypeManagement />
					</TabPanel>

					<TabPanel value={activeTab} index={4}>
						<HolidayTable />
					</TabPanel>
				</Box>
			</Paper>
		</Box>
	);
};

export default DSRAdminSection;
