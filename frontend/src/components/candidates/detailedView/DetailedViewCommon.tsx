import React from 'react';
import { Box, Typography, Divider, alpha, useTheme, Paper } from '@mui/material';

export interface InfoRowProps {
	label: string;
	value: React.ReactNode;
	icon?: React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
	return (
		<Box sx={{ mb: 2.5, width: '100%' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
				{icon && (
					<Box
						sx={{
							mr: 1,
							display: 'flex',
							color: 'primary.main',
							opacity: 0.8
						}}
					>
						{icon}
					</Box>
				)}
				<Typography
					variant="caption"
					sx={{
						color: 'text.secondary',
						fontWeight: 700,
						textTransform: 'uppercase',
						letterSpacing: '0.08em',
						fontSize: '0.65rem'
					}}
				>
					{label}
				</Typography>
			</Box>
			<Typography
				variant="body1"
				sx={{
					fontWeight: 500,
					color: 'text.primary',
					fontSize: '0.925rem',
					lineHeight: 1.5,
					minHeight: '1.5rem',
					display: 'block'
				}}
			>
				{value || (
					<Typography
						component="span"
						variant="body1"
						sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: 'inherit' }}
					>
						Not specified
					</Typography>
				)}
			</Typography>
		</Box>
	);
};

export const SectionHeader: React.FC<{ title: string; children?: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => {
	const theme = useTheme();

	return (
		<Box sx={{ mb: 3 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{icon && (
						<Box
							sx={{
								mr: 1.5,
								display: 'flex',
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.08),
								p: 0.75,
								borderRadius: 1,
								'& svg': { fontSize: '1.25rem' }
							}}
						>
							{icon}
						</Box>
					)}
					<Typography
						variant="h6"
						sx={{
							fontSize: '1.15rem',
							fontWeight: 700,
							color: 'text.primary',
							letterSpacing: '-0.01em'
						}}
					>
						{title}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: 1 }}>
					{children}
				</Box>
			</Box>
			<Divider sx={{ borderColor: alpha(theme.palette.divider, 0.8) }} />
		</Box>
	);
};

export const SectionCard: React.FC<{ children: React.ReactNode; sx?: any; noPadding?: boolean }> = ({ children, sx, noPadding = false }) => (
	<Paper
		variant="outlined"
		sx={{
			p: noPadding ? 0 : 3,
			borderRadius: 2,
			border: '1px solid',
			borderColor: 'divider',
			boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
			overflow: 'hidden',
			...sx
		}}
	>
		{children}
	</Paper>
);
