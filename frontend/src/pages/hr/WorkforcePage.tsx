import React, { useState } from 'react';
import { Container, Stack } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import WorkforcePanel, { WorkforceTabs, type WorkforceTab } from '../../components/hr/workforce';
import { responsiveStyles } from '../../theme';

const WorkforcePage: React.FC = () => {
	const [tab, setTab] = useState<WorkforceTab>('employees');

	return (
		<Container maxWidth="xl" sx={responsiveStyles.pageContainer}>
			<Stack spacing={3}>
				<PageHeader
					title="HRM Workforce"
					subtitle="Manage employees, departments, and designations in one place."
					action={<WorkforceTabs value={tab} onChange={setTab} />}
				/>
				<WorkforcePanel tab={tab} />
			</Stack>
		</Container>
	);
};

export default WorkforcePage;
