import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	HubOutlined as CrmIcon,
	GroupsOutlined as HrIcon,
	AssignmentTurnedInOutlined as ProjectIcon,
	ScheduleOutlined as TimesheetIcon,
} from '@mui/icons-material';

const features = [
	{
		icon: CrmIcon,
		title: 'CRM & Deal Pipelines',
		description: 'Track leads, companies and deals in one shared view.',
	},
	{
		icon: HrIcon,
		title: 'HR & Payroll',
		description: 'Run payroll, manage leave and onboard employees with ease.',
	},
	{
		icon: ProjectIcon,
		title: 'Projects & Tasks',
		description: 'Plan work and keep every team aligned on delivery.',
	},
	{
		icon: TimesheetIcon,
		title: 'Timesheets & Attendance',
		description: 'Capture hours and attendance without the spreadsheets.',
	},
];

const AuthBrandPanel: React.FC = () => {
	const navigate = useNavigate();

	return (
		<Box
			sx={{
				position: 'relative',
				flex: { md: '0 0 50%' },
				display: { xs: 'none', md: 'flex' },
				flexDirection: 'column',
				justifyContent: 'center',
				px: { md: 6, lg: 8 },
				py: 8,
				overflow: 'hidden',
				borderRight: '1px solid rgba(255, 255, 255, 0.07)',
				background: 'linear-gradient(160deg, #141622 0%, #0c0e17 55%, #0a0b12 100%)',
				backgroundImage:
					'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(160deg, #141622 0%, #0c0e17 55%, #0a0b12 100%)',
				backgroundSize: '22px 22px, 100% 100%',
			}}
		>
			{/* Decorative gradient glows */}
			<Box
				sx={{
					position: 'absolute',
					top: '-10%',
					left: '-15%',
					width: 360,
					height: 360,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(139, 124, 246, 0.22) 0%, rgba(139, 124, 246, 0) 70%)',
					pointerEvents: 'none',
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					bottom: '-15%',
					right: '-15%',
					width: 420,
					height: 420,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(78, 168, 255, 0.18) 0%, rgba(78, 168, 255, 0) 70%)',
					pointerEvents: 'none',
				}}
			/>

			<Box sx={{ position: 'relative', maxWidth: 420 }}>
				<Box
					component="img"
					src="/assets/img/logo/gravit-dark.svg"
					alt="Gravit"
					sx={{ height: 40, cursor: 'pointer', mb: 5 }}
					onClick={() => navigate('/')}
				/>

				<Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#F4F5F7', mb: 2, lineHeight: 1.25 }}>
					Run your entire business from one workspace.
				</Typography>
				<Typography variant="body1" sx={{ color: '#94A3B8', mb: 6, lineHeight: 1.6 }}>
					Gravit brings CRM, HR, payroll, projects and timesheets together, so growing teams stop switching between tools.
				</Typography>

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
					{features.map(({ icon: Icon, title, description }) => (
						<Box key={title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
							<Box
								sx={{
									flexShrink: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 40,
									height: 40,
									borderRadius: 1.5,
									bgcolor: 'rgba(139, 124, 246, 0.1)',
									border: '1px solid rgba(139, 124, 246, 0.15)',
								}}
							>
								<Icon sx={{ color: '#8B7CF6', fontSize: 20 }} />
							</Box>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 0.25 }}>
									{title}
								</Typography>
								<Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.5 }}>
									{description}
								</Typography>
							</Box>
						</Box>
					))}
				</Box>
			</Box>
		</Box>
	);
};

export default AuthBrandPanel;
