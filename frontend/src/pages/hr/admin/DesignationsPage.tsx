import React, { useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import DesignationsPanel from '../../../components/hr/admin/workforce/designation/DesignationsPanel';
import { responsiveStyles } from '../../../theme';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';
import { HelpGuideButton } from '../../../components/common/button';

const designationsGuideContent = {
	icon: HelpIcon,
	title: 'Designations Guide',
	subtitle: 'Learn how to manage job titles and grades.',
	banner: {
		title: 'Welcome to Designations!',
		description: 'Define the official roles and job titles used across your workforce.'
	},
	tabs: [
		{
			label: 'Designations',
			intro: 'Set up designations:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Manage Designations',
					description: 'Create, edit, or delete official roles and job titles for your workforce.'
				}
			]
		}
	]
};

const DesignationsPage: React.FC = () => {
	const [guideOpen, setGuideOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Designations"
						subtitle="Define and manage job titles and grades."
						action={<HelpGuideButton compact onClick={() => setGuideOpen(true)} />}
					/>
					<DesignationsPanel />
				</Stack>
			</Container>

			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={designationsGuideContent}
			/>
		</Box>
	);
};

export default DesignationsPage;
