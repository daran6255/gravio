import React from 'react';
import {
	Box,
	Grid as Grid,
	Paper,
	Typography,
	Skeleton
} from '@mui/material';
import {
	Timer as TimerIcon,
	History as HistoryIcon,
	FactCheck as LeaveIcon,
	EventBusy as MissedIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../../store/hooks';

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
	loading: boolean;
	subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading, subtitle }) => (
	<Paper
		elevation={0}
		sx={{
			p: 2.5,
			height: '100%',
			bgcolor: '#ffffff',
			border: '1px solid #eaeded',
			borderRadius: '8px',
			display: 'flex',
			flexDirection: 'column',
			transition: 'all 0.2s ease',
			'&:hover': {
				boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
				borderColor: '#d5dbdb'
			}
		}}
	>
		<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
			<Box sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 40,
				height: 40,
				borderRadius: '8px',
				bgcolor: `${color}20`,
				color: color,
				mr: 1.5
			}}>
				{icon}
			</Box>
			<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#545b64', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
				{title}
			</Typography>
		</Box>

		<Box sx={{ mt: 'auto' }}>
			{loading ? (
				<Skeleton width="60%" height={40} />
			) : (
				<Typography variant="h4" sx={{ fontWeight: 500, color: '#232f3e', lineHeight: 1.2 }}>
					{value}
				</Typography>
			)}
			{subtitle && (
				<Typography variant="caption" sx={{ color: '#545b64', mt: 0.5, display: 'block', fontWeight: 500 }}>
					{subtitle}
				</Typography>
			)}
		</Box>
	</Paper>
);

const DSRStatsHeader: React.FC = () => {
	const { userStatsSummary, loading } = useAppSelector((state) => state.dsr);

	const stats = [
		{
			title: "Work This Month",
			value: `${userStatsSummary?.total_hours_month || 0} hrs`,
			icon: <TimerIcon />,
			color: '#ec7211',
			subtitle: 'Approved work hours'
		},
		{
			title: "Total Hours",
			value: `${userStatsSummary?.total_hours_all_time || 0} hrs`,
			icon: <HistoryIcon />,
			color: '#1d8102',
			subtitle: 'All-time career total'
		},
		{
			title: "Leaves Applied",
			value: String(userStatsSummary?.total_leaves || 0),
			icon: <LeaveIcon />,
			color: '#007eb9',
			subtitle: 'Full-day approved leaves'
		},
		{
			title: "Not Worked",
			value: String(userStatsSummary?.not_worked_days || 0),
			icon: <MissedIcon />,
			color: '#d13212',
			subtitle: 'Missing workdays (Month)'
		}
	];

	return (
		<Box sx={{ mb: 4 }}>
			<Grid container spacing={2}>
				{stats.map((stat, index) => (
					<Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
						<StatCard
							title={stat.title}
							value={stat.value}
							icon={stat.icon}
							color={stat.color}
							loading={loading && !userStatsSummary}
							subtitle={stat.subtitle}
						/>
					</Grid>
				))}
			</Grid>
		</Box>
	);
};

export default DSRStatsHeader;
