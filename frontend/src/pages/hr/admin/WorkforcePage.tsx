import React, { useState } from 'react';
import { Box, Container, Stack, IconButton } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import WorkforcePanel, { WorkforceTabs, type WorkforceTab } from '../../../components/hr/admin/workforce';
import { responsiveStyles } from '../../../theme';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';

const hrAdminGuideContent = {
	icon: HelpIcon,
	title: 'HR Admin Workspace Guide',
	subtitle: 'Learn how to manage the employee directory, departments, and designations.',
	banner: {
		title: 'Welcome to HR Admin Workspace!',
		description: 'As an HR Administrator, you can manage workforce details, lifecycle settings, and document vaults.'
	},
	tabs: [
		{
			label: 'Workforce Roster',
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
		},
		{
			label: 'Org Configurations',
			intro: 'Set up departments, designations, and reporting hierarchies:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Manage Departments',
					description: 'Switch to the "Departments" tab to create, edit, or delete organization departments.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Manage Designations',
					description: 'Switch to the "Designations" tab to define official roles and job titles for your workforce.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Establish Manager Hierarchy',
					description: 'Use the "Manager Allocation" tab to drag and drop employees onto their respective reporting managers.'
				}
			]
		}
	]
};

const WorkforcePage: React.FC = () => {
	const [tab, setTab] = useState<WorkforceTab>('employees');
	const [guideOpen, setGuideOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="HRM Workforce"
						subtitle="Manage employees, departments, and designations in one place."
						action={
							<Stack direction="row" spacing={1.5} alignItems="center">
								<WorkforceTabs value={tab} onChange={setTab} />
								<IconButton
									onClick={() => setGuideOpen(true)}
									sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
								>
									<HelpIcon />
								</IconButton>
							</Stack>
						}
					/>
					<WorkforcePanel tab={tab} />
				</Stack>
			</Container>

			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={hrAdminGuideContent}
			/>
		</Box>
	);
};

export default WorkforcePage;
