import React from 'react';
import { Container, Stack } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import WorkforcePanel from '../../components/hr/workforce';
import { responsiveStyles } from '../../theme';

const WorkforcePage: React.FC = () => (
	<Container maxWidth="xl" sx={responsiveStyles.pageContainer}>
		<Stack spacing={3}>
			<PageHeader
				title="Workforce"
				subtitle="Manage employees, departments, and designations in one place."
			/>
			<WorkforcePanel />
		</Stack>
	</Container>
);

export default WorkforcePage;
