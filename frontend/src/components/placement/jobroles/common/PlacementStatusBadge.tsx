import React from 'react';
import { Box, Typography } from '@mui/material';

interface PlacementStatusBadgeProps {
	label: string;
	status: string;
}

const getStatusStyles = (status: string) => {
	const s = status.toLowerCase();
	
	const colors: Record<string, { bg: string; text: string; border: string }> = {
		active: { bg: '#f1faff', text: '#007eb9', border: '#007eb9' },
		success: { bg: '#edfaef', text: '#1d8102', border: '#1d8102' },
		warning: { bg: '#fff9e6', text: '#8d6605', border: '#ff9900' },
		negative: { bg: '#fdf3f1', text: '#d13212', border: '#d13212' },
		default: { bg: '#f2f3f3', text: '#545b64', border: '#d5dbdb' },
	};

	if (['active', 'open', 'published'].includes(s)) return colors.active;
	if (['filled', 'completed', 'success'].includes(s)) return colors.success;
	if (['on hold', 'pending', 'inactive'].includes(s)) return colors.warning;
	if (['closed', 'cancelled'].includes(s)) return colors.negative;

	return colors.default;
};

const PlacementStatusBadge: React.FC<PlacementStatusBadgeProps> = ({ label, status }) => {
	const styles = getStatusStyles(status);

	return (
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				px: 1,
				py: 0.25,
				borderRadius: '2px',
				bgcolor: styles.bg,
				border: `1px solid ${styles.border}`,
				color: styles.text,
			}}
		>
			<Typography
				variant="caption"
				sx={{
					fontWeight: 700,
					textTransform: 'uppercase',
					fontSize: '0.65rem',
					letterSpacing: '0.04em'
				}}
			>
				{label}
			</Typography>
		</Box>
	);
};

export default PlacementStatusBadge;
