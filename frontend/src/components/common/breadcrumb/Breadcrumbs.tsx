import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box, alpha, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
	NavigateNext as NavigateNextIcon,
	Home as HomeIcon,
	People as PeopleIcon,
	PersonAdd as PersonAddIcon,
	Dashboard as DashboardIcon,
	Settings as SettingsIcon,
	Folder as ProjectIcon
} from '@mui/icons-material';

/**
 * Enterprise Breadcrumbs - Standardized Product Outcome
 * strictly adheres to theme variants and palette tokens.
 */
const breadcrumbNameMap: { [key: string]: { name: string; icon?: React.ReactNode } } = {
	'dashboard': { name: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 'inherit' }} /> },
	'users': { name: 'User Management', icon: <PeopleIcon sx={{ fontSize: 'inherit' }} /> },
	'candidates': { name: 'Candidates', icon: <PersonAddIcon sx={{ fontSize: 'inherit' }} /> },
	'candidate-registration': { name: 'Candidate Registration', icon: <PersonAddIcon sx={{ fontSize: 'inherit' }} /> },
	'profile': { name: 'Profile' },
	'settings': { name: 'Settings', icon: <SettingsIcon sx={{ fontSize: 'inherit' }} /> },
	'projects': { name: 'Projects', icon: <ProjectIcon sx={{ fontSize: 'inherit' }} /> },
};

const Breadcrumbs: React.FC = () => {
	const theme = useTheme();
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const tab = queryParams.get('tab');

	const pathnames = location.pathname.split('/').filter((x) => x);

	if (pathnames.length === 0) {
		return null;
	}

	const getTrainingModuleName = (tabValue: string | null) => {
		switch (tabValue) {
			case '1': return 'Allocation';
			case '2': return 'Attendance';
			case '3': return 'Assignment';
			case '4': return 'Mock Interview';
			default: return 'Allocation';
		}
	};

	return (
		<Box sx={{ mb: 3, mt: 1 }}>
			<MuiBreadcrumbs
				separator={
					<NavigateNextIcon 
						sx={{ 
							fontSize: '1rem', 
							color: alpha(theme.palette.text.secondary, 0.4) 
						}} 
					/>
				}
				aria-label="breadcrumb"
				sx={{
					'& .MuiBreadcrumbs-ol': { alignItems: 'center' }
				}}
			>
				{/* Root Navigation */}
				<Link
					component={RouterLink}
					underline="hover"
					to="/dashboard"
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 0.75,
						color: 'text.secondary',
						...theme.typography.sidebarItem,
						transition: theme.transitions.create(['color']),
						'&:hover': { 
							color: 'primary.main',
						}
					}}
				>
					<HomeIcon sx={{ fontSize: '1.1rem', color: alpha(theme.palette.text.secondary, 0.6) }} />
					Home
				</Link>

				{pathnames.map((value, index) => {
					const last = index === pathnames.length - 1;
					const to = `/${pathnames.slice(0, index + 1).join('/')}`;

					const breadcrumbInfo = breadcrumbNameMap[value];
					let name = breadcrumbInfo?.name || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
					const icon = breadcrumbInfo?.icon;

					if (value === 'allocation' && pathnames.includes('training')) {
						name = getTrainingModuleName(tab);
					}

					if (value === 'dashboard') {
						return null;
					}

					return last ? (
						<Typography
							key={to}
							variant="sidebarItem"
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.75,
								color: 'text.primary',
								fontWeight: 700
							}}
						>
							{icon && (
								<Box sx={{ display: 'flex', color: alpha(theme.palette.text.secondary, 0.6) }}>
									{icon}
								</Box>
							)}
							{name}
						</Typography>
					) : (
						<Link
							component={RouterLink}
							underline="hover"
							to={to}
							key={to}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.75,
								color: 'text.secondary',
								...theme.typography.sidebarItem,
								transition: theme.transitions.create(['color']),
								'&:hover': { 
									color: 'primary.main',
								}
							}}
						>
							{icon && (
								<Box sx={{ display: 'flex', color: alpha(theme.palette.text.secondary, 0.6) }}>
									{icon}
								</Box>
							)}
							{name}
						</Link>
					);
				})}
			</MuiBreadcrumbs>
		</Box>
	);
};

export default Breadcrumbs;
