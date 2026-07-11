import React from 'react';
import { Box, Typography, Avatar, Chip, Card, CardContent, Divider, Stack, alpha, useTheme } from '@mui/material';
import {
	Email as EmailIcon,
	LocationOn as LocationIcon,
	Work as WorkIcon,
	Badge as BadgeIcon,
} from '@mui/icons-material';
import type { HREmployeeListItem } from '../../../../models/hr';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS, EMPLOYMENT_TYPE_LABELS, WORK_LOCATION_LABELS } from '../../../../models/hr';

interface EmployeeCardProps {
	employee: HREmployeeListItem;
	onClick: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
	const theme = useTheme();
	const initials = (employee.full_name || employee.email || '?')
		.split(' ')
		.map((n) => n[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

	return (
		<Card
			onClick={onClick}
			sx={{
				cursor: 'pointer',
				border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
				transition: 'all 0.18s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
					borderColor: alpha(theme.palette.primary.main, 0.3),
				},
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
					<Avatar
						src={employee.avatar || undefined}
						sx={{
							width: 52, height: 52,
							bgcolor: alpha(theme.palette.primary.main, 0.15),
							color: 'primary.main',
							fontWeight: 700,
							fontSize: '1rem',
						}}
					>
						{initials}
					</Avatar>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Typography variant="subtitle2" fontWeight={700} noWrap>
								{employee.full_name || '—'}
							</Typography>
							<Chip
								label={EMPLOYEE_STATUS_LABELS[employee.employee_status]}
								color={EMPLOYEE_STATUS_COLORS[employee.employee_status]}
								size="small"
								sx={{ height: 20, fontSize: '0.65rem', ml: 1, flexShrink: 0 }}
							/>
						</Box>
						<Typography variant="caption" color="text.secondary" noWrap display="block">
							{employee.designation_name || employee.role || '—'}
						</Typography>
						<Typography variant="caption" color="text.disabled" noWrap display="block">
							{employee.department_name || 'No Department'}
						</Typography>
					</Box>
				</Box>

				<Divider sx={{ my: 1.5 }} />

				<Stack spacing={0.75}>
					{employee.employee_id && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<BadgeIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
							<Typography variant="caption" color="text.secondary" fontFamily="monospace">
								{employee.employee_id}
							</Typography>
						</Box>
					)}
					{employee.email && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<EmailIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
							<Typography variant="caption" color="text.secondary" noWrap>
								{employee.email}
							</Typography>
						</Box>
					)}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<LocationIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							{WORK_LOCATION_LABELS[employee.work_location]}
						</Typography>
						<Box sx={{ mx: 0.5, color: 'text.disabled' }}>·</Box>
						<WorkIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							{EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
						</Typography>
					</Box>
					{employee.date_of_joining && (
						<Typography variant="caption" color="text.disabled">
							Joined {new Date(employee.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
						</Typography>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};

export default EmployeeCard;
