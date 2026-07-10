import React, { useState } from 'react';
import { Container, Box, Tab, Tabs } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import HolidayCalendarPanel from '../../components/timesheets/holiday-calendar';
import MyCategoriesPanel from '../../components/timesheets/my-categories';

const TimesheetSettingsPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState(0);

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			<PageHeader
				title="Timesheet Settings"
				subtitle="Configure organization-wide holidays, custom override schedules, and time logging categories."
			/>

			{/* Configuration Tabs */}
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, mt: 3 }}>
				<Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
					<Tab label="Holiday Calendar" />
					<Tab label="Time Categories" />
				</Tabs>
			</Box>

			<Box>
				{activeTab === 0 && <HolidayCalendarPanel />}
				{activeTab === 1 && <MyCategoriesPanel />}
			</Box>
		</Container>
	);
};

export default TimesheetSettingsPage;
