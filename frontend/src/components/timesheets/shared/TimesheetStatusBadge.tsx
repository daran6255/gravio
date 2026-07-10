import React from 'react';
import { Chip } from '@mui/material';
import type { TimesheetStatus } from '../../../models/timesheet';

interface TimesheetStatusBadgeProps {
	status: TimesheetStatus;
	size?: 'small' | 'medium';
}

const TimesheetStatusBadge: React.FC<TimesheetStatusBadgeProps> = ({ status, size = 'small' }) => {
	const getStatusConfig = () => {
		switch (status) {
			case 'approved':
				return { label: 'Approved', color: 'success' as const, variant: 'filled' as const };
			case 'rejected':
				return { label: 'Rejected', color: 'error' as const, variant: 'filled' as const };
			case 'submitted':
				return { label: 'Submitted', color: 'warning' as const, variant: 'filled' as const };
			case 'draft':
			default:
				return { label: 'Draft', color: 'default' as const, variant: 'outlined' as const };
		}
	};

	const config = getStatusConfig();

	return (
		<Chip
			label={config.label}
			color={config.color}
			variant={config.variant}
			size={size}
			sx={{ fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.65rem' }}
		/>
	);
};

export default TimesheetStatusBadge;
