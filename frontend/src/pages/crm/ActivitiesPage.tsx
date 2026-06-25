import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { ActivityFeedFilters, ActivityFeedList, useActivityFeed } from '../../components/crm';

/**
 * CRM Activities — a unified feed of notes, calls, emails, meetings, and tasks
 * logged across every lead, deal, company, and contact.
 */
const ActivitiesPage: React.FC = () => {
	const {
		feedActivities,
		feedActivitiesTotal,
		feedActivitiesLoading,
		owners,
		page,
		rowsPerPage,
		type,
		ownerId,
		dateFrom,
		dateTo,
		handlePageChange,
		handleRowsPerPageChange,
		handleTypeChange,
		handleOwnerChange,
		handleDateFromChange,
		handleDateToChange,
	} = useActivityFeed();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Activities"
					subtitle="Every note, call, email, meeting, and task across your CRM"
				/>

				<ActivityFeedFilters
					type={type}
					onTypeChange={handleTypeChange}
					ownerId={ownerId}
					onOwnerChange={handleOwnerChange}
					owners={owners}
					dateFrom={dateFrom}
					onDateFromChange={handleDateFromChange}
					dateTo={dateTo}
					onDateToChange={handleDateToChange}
				/>

				<ActivityFeedList
					activities={feedActivities}
					loading={feedActivitiesLoading}
					totalCount={feedActivitiesTotal}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
				/>
			</Container>
		</Box>
	);
};

export default ActivitiesPage;
