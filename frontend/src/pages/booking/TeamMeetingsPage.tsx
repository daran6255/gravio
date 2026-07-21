import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { responsiveStyles } from '../../theme';
import { MeetingHistoryTable } from '../../components/booking';
import { useMeetingHistory } from '../../components/booking/meetings/hooks/useMeetingHistory';

/** Manager/admin oversight view (gap 7) — an admin sees every host's meetings in
 * the org, a manager sees their own plus their direct reports'. Gated to those
 * roles declaratively via config/navigation.ts + ProtectedRoute (see AppRouter.tsx). */
const TeamMeetingsPage: React.FC = () => {
	const history = useMeetingHistory({ scope: 'team' });

	return (
		<Box component="main" sx={{ bgcolor: 'background.default' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Team Meetings"
					subtitle="Meetings scheduled across your team."
				/>
				<MeetingHistoryTable
					meetings={history.meetings}
					loading={history.loading}
					totalCount={history.totalCount}
					page={history.page}
					rowsPerPage={history.rowsPerPage}
					onPageChange={history.handlePageChange}
					onRowsPerPageChange={history.handleRowsPerPageChange}
					searchTerm={history.searchTerm}
					onSearchChange={history.handleSearchChange}
					statusFilter={history.statusFilter}
					onStatusFilterChange={history.handleStatusFilterChange}
					onRefresh={history.refreshData}
					showHost
				/>
			</Container>
		</Box>
	);
};

export default TeamMeetingsPage;
