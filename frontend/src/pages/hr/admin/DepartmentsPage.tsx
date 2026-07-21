import React, { useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import DepartmentsPanel from '../../../components/hr/admin/workforce/department/DepartmentsPanel';
import { responsiveStyles } from '../../../theme';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';
import { HelpGuideButton } from '../../../components/common/button';

const departmentsGuideContent = {
	icon: HelpIcon,
	title: 'Departments Guide',
	subtitle: 'Learn how to manage organization departments.',
	banner: {
		title: 'Welcome to Departments!',
		description: 'Create and maintain the departments your workforce is organized into.'
	},
	tabs: [
		{
			label: 'Departments',
			intro: 'Set up and maintain departments:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Manage Departments',
					description: 'Create, edit, or delete organization departments.'
				}
			]
		}
	]
};

const DepartmentsPage: React.FC = () => {
	const [guideOpen, setGuideOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Departments"
						subtitle="Create and manage organization departments."
						action={<HelpGuideButton compact onClick={() => setGuideOpen(true)} />}
					/>
					<DepartmentsPanel />
				</Stack>
			</Container>

			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={departmentsGuideContent}
			/>
		</Box>
	);
};

export default DepartmentsPage;
