import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

export interface InfoRowProps {
	label: string;
	value: React.ReactNode;
	icon?: React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => (
	<Box sx={{ mb: 2.5, width: '100%' }}>
		<Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
			{icon && <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary', '& svg': { fontSize: 16 } }}>{icon}</Box>}
			<Typography variant="awsFieldLabel">
				{label}
			</Typography>
		</Box>
		<Typography
			variant="body1"
			sx={{
				fontWeight: 500,
				color: 'text.primary',
				lineHeight: 1.5,
				minHeight: '1.5rem'
			}}
		>
			{value || '-'}
		</Typography>
	</Box>
);

export const SectionHeader: React.FC<{ title: string; children?: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
	<Box sx={{ mb: 3.5 }}>
		<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				{icon && <Box sx={{ mr: 1.5, display: 'flex', color: 'accent.main' }}>{icon}</Box>}
				<Typography variant="awsSectionTitle">
					{title}
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', gap: 1 }}>
				{children}
			</Box>
		</Box>
		<Divider sx={{ borderColor: 'divider' }} />
	</Box>
);
