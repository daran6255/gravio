import React, { useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import ManagerAllocationPanel from '../../../components/timesheets/manager-allocation/ManagerAllocationPanel';
import { responsiveStyles } from '../../../theme';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';
import { HelpGuideButton } from '../../../components/common/button';

const managersGuideContent = {
	icon: HelpIcon,
	title: 'Managers Guide',
	subtitle: 'Learn how to establish the reporting hierarchy.',
	banner: {
		title: 'Welcome to Managers!',
		description: 'Assign employees to their reporting managers.'
	},
	tabs: [
		{
			label: 'Manager Allocation',
			intro: 'Establish the reporting hierarchy:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Establish Manager Hierarchy',
					description: 'Drag and drop employees onto their respective reporting managers.'
				}
			]
		}
	]
};

const ManagersPage: React.FC = () => {
	const [guideOpen, setGuideOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Managers"
						subtitle="Assign employees to their reporting managers."
						action={<HelpGuideButton compact onClick={() => setGuideOpen(true)} />}
					/>
					<ManagerAllocationPanel />
				</Stack>
			</Container>

			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={managersGuideContent}
			/>
		</Box>
	);
};

export default ManagersPage;
