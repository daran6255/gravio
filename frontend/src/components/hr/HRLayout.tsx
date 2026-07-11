import React from 'react';
import { Box, Tabs, Tab, Typography, Chip, useTheme, alpha } from '@mui/material';
import {
	PeopleAltOutlined as EmployeesIcon,
	AccountTreeOutlined as DeptIcon,
	BadgeOutlined as DesignationIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface HRTab {
	label: string;
	path: string;
	icon: React.ReactElement;
	badge?: string;
}

const HR_TABS: HRTab[] = [
	{ label: 'Employees', path: '/hr/employees', icon: <EmployeesIcon /> },
	{ label: 'Departments', path: '/hr/departments', icon: <DeptIcon /> },
	{ label: 'Designations', path: '/hr/designations', icon: <DesignationIcon /> },
];

interface HRLayoutProps {
	children: React.ReactNode;
	title: string;
	subtitle?: string;
	actions?: React.ReactNode;
}

const HRLayout: React.FC<HRLayoutProps> = ({ children, title, subtitle, actions }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();

	const activeTab = HR_TABS.findIndex((t) => location.pathname.startsWith(t.path));

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			{/* Header */}
			<Box
				sx={{
					background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.04)} 100%)`,
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
					px: { xs: 2, md: 4 },
					pt: 3,
					pb: 0,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
					<Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
							<Typography variant="h5" fontWeight={700} color="text.primary">
								{title}
							</Typography>
							<Chip
								label="HR"
								size="small"
								sx={{
									bgcolor: alpha(theme.palette.primary.main, 0.12),
									color: 'primary.main',
									fontWeight: 700,
									fontSize: '0.65rem',
									height: 20,
								}}
							/>
						</Box>
						{subtitle && (
							<Typography variant="body2" color="text.secondary">
								{subtitle}
							</Typography>
						)}
					</Box>
					{actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
				</Box>

				{/* Sub-navigation tabs */}
				<Tabs
					value={activeTab === -1 ? 0 : activeTab}
					onChange={(_, v) => navigate(HR_TABS[v].path)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						'& .MuiTab-root': {
							minHeight: 44,
							textTransform: 'none',
							fontWeight: 500,
							fontSize: '0.875rem',
							gap: 0.75,
						},
						'& .Mui-selected': { fontWeight: 700 },
					}}
				>
					{HR_TABS.map((tab) => (
						<Tab
							key={tab.path}
							label={tab.label}
							icon={tab.icon}
							iconPosition="start"
						/>
					))}
				</Tabs>
			</Box>

			{/* Content */}
			<Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
				{children}
			</Box>
		</Box>
	);
};

export default HRLayout;
