import React from 'react';
import { Grid, useTheme } from '@mui/material';
import {
	MenuBook as CourseIcon,
	Person as HRIcon,
	Assignment as InterviewIcon,
	Schedule as TotalIcon,
	Info as InfoIcon
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';

interface StatsSummaryCardsProps {
	hoursBreakdown: {
		course: number;
		hr_session: number;
		mock_interview: number;
		training_total: number;
		unassigned_total: number;
	};
	formatHours: (hours: number) => string;
}

const StatsSummaryCards: React.FC<StatsSummaryCardsProps> = ({ hoursBreakdown, formatHours }) => {
	const theme = useTheme();

	const stats = [
		{
			title: 'Total Training',
			value: formatHours(hoursBreakdown.training_total),
			icon: <TotalIcon />,
			color: theme.palette.secondary.light,
			subtitle: 'Combined training & activities'
		},
		{
			title: 'Core Courses',
			value: formatHours(hoursBreakdown.course),
			icon: <CourseIcon />,
			color: theme.palette.primary.main,
			subtitle: 'Primary curriculum coverage'
		},
		{
			title: 'HR Sessions',
			value: formatHours(hoursBreakdown.hr_session),
			icon: <HRIcon />,
			color: (theme.palette as any).accent?.main || theme.palette.warning.main,
			subtitle: 'Soft skills & readiness'
		},
		{
			title: 'Mock Interviews',
			value: formatHours(hoursBreakdown.mock_interview),
			icon: <InterviewIcon />,
			color: theme.palette.success.main,
			subtitle: 'Direct practice hours'
		},
		{
			title: 'Other Training',
			value: formatHours(hoursBreakdown.unassigned_total),
			icon: <InfoIcon />,
			color: theme.palette.text.secondary,
			subtitle: 'Workshops & events'
		}
	];

	return (
		<Grid container spacing={2} sx={{ mb: 5 }}>
			{stats.map((stat, index) => (
				<Grid key={index} size={{ xs: 12, sm: 6, md: 2.4 }}>
					<StatCard
						title={stat.title}
						value={stat.value}
						icon={stat.icon}
						color={stat.color}
						subtitle={stat.subtitle}
						sx={{
							borderRadius: 2,
							minHeight: 110
						}}
					/>
				</Grid>
			))}
		</Grid>
	);
};

export default StatsSummaryCards;
