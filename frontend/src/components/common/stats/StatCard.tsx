import React from 'react';
import { Box, Typography, SvgIcon, alpha } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';

interface StatCardProps {
	title?: string;
	label?: string; // Alias for title
	value?: React.ReactNode;
	count?: React.ReactNode; // Alias for value
	unit?: string;
	subtitle?: string; // Descriptive text at the bottom
	icon?: React.ReactNode | SvgIconComponent;
	color?: string; // Accent color
	children?: React.ReactNode;
	sx?: SxProps<Theme>;
}

const StatCard: React.FC<StatCardProps> = ({ 
	title, 
	label, 
	value: propValue, 
	count, 
	unit, 
	subtitle,
	icon, 
	children,
	color = '#1976d2', 
	sx 
}) => {
	const finalTitle = title || label;
	const finalValue = propValue !== undefined ? propValue : count;

	return (
		<Box
			sx={{
				p: 2.5,
				bgcolor: 'white',
				borderRadius: '12px',
				border: '1px solid #f1f5f9',
				boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				display: 'flex',
				flexDirection: 'column',
				gap: 1.5,
				transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
				},
				height: '100%',
				...sx
			}}
		>
			{/* Top: Icon + Title */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
				{icon && (
					<Box 
						sx={{ 
							display: 'flex', 
							alignItems: 'center', 
							justifyContent: 'center',
							width: 32,
							height: 32,
							borderRadius: '8px',
							bgcolor: alpha(color, 0.1),
							color: color
						}}
					>
						{React.isValidElement(icon) ? 
							React.cloneElement(icon as React.ReactElement<any>, { 
								sx: { fontSize: '1.2rem' } 
							}) : 
							<SvgIcon component={icon as any} sx={{ fontSize: '1.2rem' }} />
						}
					</Box>
				)}
				<Typography 
					variant="caption" 
					sx={{ 
						color: '#64748b', 
						fontWeight: 700, 
						textTransform: 'uppercase', 
						letterSpacing: '0.025em', 
						fontSize: '0.7rem' 
					}}
				>
					{finalTitle}
				</Typography>
			</Box>

			{/* Middle: Value + Unit */}
			<Box sx={{ mt: 'auto' }}>
				<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
					<Typography 
						variant="h4" 
						sx={{ 
							fontWeight: 700, 
							color: '#1e293b',
							lineHeight: 1
						}}
					>
						{finalValue}
					</Typography>
					{unit && (
						<Typography 
							variant="subtitle2" 
							sx={{ 
								color: '#475569', 
								fontWeight: 600 
							}}
						>
							{unit}
						</Typography>
					)}
				</Box>

				{/* Bottom: Subtitle or Children */}
				{subtitle && !children && (
					<Typography 
						variant="caption" 
						sx={{ 
							color: '#94a3b8', 
							fontWeight: 500,
							mt: 0.5,
							display: 'block'
						}}
					>
						{subtitle}
					</Typography>
				)}
				{children && (
					<Box sx={{ mt: 0.5 }}>
						{children}
					</Box>
				)}
			</Box>
		</Box>
	);
};


export default StatCard;
