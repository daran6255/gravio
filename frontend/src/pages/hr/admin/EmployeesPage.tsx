import React, { useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import EmployeesPanel from '../../../components/hr/admin/workforce/employee/EmployeesPanel';
import { responsiveStyles } from '../../../theme';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';
import { HelpGuideButton } from '../../../components/common/button';

const employeesGuideContent = {
	icon: HelpIcon,
	title: 'Employees Guide',
	subtitle: 'Learn how to manage the employee directory.',
	banner: {
		title: 'Welcome to Employees!',
		description: 'Manage employee profiles, statuses, and leave entitlements from one place.'
	},
	tabs: [
		{
			label: 'Employee Roster',
			intro: 'Manage employee details and organization structure:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Add & Manage Employees',
					description: 'Click "Add Employee" to create new employee profiles with contact details, status, role, and department.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Configure Leave Entitlements',
					description: 'Select "Leave Entitlements" from the employee action menu to allocate annual leave days for each employee.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Invite to Platform',
					description: 'Click "Invite to Gravit" in the employee action menu to send invitations for portal registration.'
				}
			]
		}
	]
};

const EmployeesPage: React.FC = () => {
	const [guideOpen, setGuideOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Employees"
						subtitle="Manage employee profiles, statuses, and leave entitlements."
						action={<HelpGuideButton compact onClick={() => setGuideOpen(true)} />}
					/>
					<EmployeesPanel />
				</Stack>
			</Container>

			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={employeesGuideContent}
			/>
		</Box>
	);
};

export default EmployeesPage;
