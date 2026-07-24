import React, { useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import LeaveTypesPanel from '../../../components/hr/admin/leave-types/LeaveTypesPanel';
import { responsiveStyles } from '../../../theme';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';
import { HelpGuideButton } from '../../../components/common/button';

const leaveTypesGuideContent = {
	icon: HelpIcon,
	title: 'Leave Types Guide',
	subtitle: 'Learn how to configure leave policies for your organization.',
	banner: {
		title: 'Welcome to Leave Types!',
		description: 'Define the leave categories employees can request against, with their own allocation and carry-forward rules.'
	},
	tabs: [
		{
			label: 'Leave Types',
			intro: 'Set up leave policies:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Create a Leave Type',
					description: 'Give it a name and short code (e.g. Sick Leave / SL), and set the default yearly allocation.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Configure Carry Forward',
					description: 'Optionally allow unused days to roll into next year, up to a cap. Employees get this automatically at year-end.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Loss of Pay',
					description: 'Mark a type as Loss of Pay for unpaid leave with no balance limit -- it feeds directly into payroll deductions.'
				}
			]
		}
	]
};

const LeaveTypesPage: React.FC = () => {
	const [guideOpen, setGuideOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Leave Types"
						subtitle="Configure the leave policies employees can request against."
						action={<HelpGuideButton compact onClick={() => setGuideOpen(true)} />}
					/>
					<LeaveTypesPanel />
				</Stack>
			</Container>

			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={leaveTypesGuideContent}
			/>
		</Box>
	);
};

export default LeaveTypesPage;
