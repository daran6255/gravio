import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';

interface StatCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ReactNode;
	color?: string; // Theme-aware accent color, e.g., '#8B7CF6'
}

export const StatCard: React.FC<StatCardProps> = ({
	title,
	value,
	subtitle,
	icon,
	color = '#1976d2'
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	// Compute premium aesthetics from the single accent color
	const glowColor = alpha(color, 0.3);
	const borderColor = isDark ? alpha(color, 0.15) : alpha(color, 0.12);
	const shadowColor = alpha(color, 0.2);
	const iconBg = isDark 
		? `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.03)} 100%)` 
		: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`;

	return (
		<Card
			sx={{
				position: 'relative',
				overflow: 'hidden',
				height: '100%',
				background: isDark 
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${borderColor}`,
				borderRadius: '16px',
				boxShadow: isDark
					? '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
					: '0 8px 32px 0 rgba(139, 124, 246, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'&:hover': { 
					transform: 'translateY(-4px)', 
					boxShadow: isDark
						? `0 12px 40px 0 rgba(0, 0, 0, 0.55), 0 0 20px 2px ${alpha(color, 0.35)}`
						: `0 12px 40px 0 ${alpha(color, 0.15)}, 0 0 20px 0 ${alpha(color, 0.08)}`,
					'& .glow-bubble': {
						transform: 'scale(1.2)',
						opacity: 0.25,
					}
				}
			}}
		>
			{/* Glow Bubble inside card for Aurora effect */}
			<Box
				className="glow-bubble"
				sx={{
					position: 'absolute',
					top: -40,
					right: -40,
					width: 140,
					height: 140,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${glowColor} 0%, rgba(255,255,255,0) 70%)`,
					filter: 'blur(15px)',
					opacity: 0.18,
					zIndex: 0,
					pointerEvents: 'none',
					transition: 'all 0.4s ease-in-out'
				}}
			/>

			<CardContent 
				sx={{ 
					display: 'flex', 
					justifyContent: 'space-between', 
					alignItems: 'center', 
					p: 3, 
					position: 'relative', 
					zIndex: 1, 
					'&:last-child': { pb: 3 } 
				}}
			>
				<Box>
					<Typography 
						variant="caption" 
						sx={{ 
							fontWeight: 700, 
							letterSpacing: '0.08em',
							color: 'text.secondary',
							fontSize: '0.72rem',
							textTransform: 'uppercase'
						}}
					>
						{title}
					</Typography>
					<Typography 
						variant="h4" 
						sx={{ 
							fontWeight: 800, 
							mt: 1, 
							mb: 0.5, 
							letterSpacing: '-0.03em', 
							color: 'text.primary' 
						}}
					>
						{value}
					</Typography>
					{subtitle && (
						<Typography 
							variant="caption" 
							sx={{ 
								color: 'text.secondary', 
								fontSize: '0.78rem', 
								display: 'block', 
								mt: 0.25 
							}}
						>
							{subtitle}
						</Typography>
					)}
				</Box>

				<Box 
					sx={{ 
						p: 1.75, 
						borderRadius: '14px', 
						background: iconBg,
						border: `1px solid ${alpha(glowColor, 0.15)}`,
						display: 'flex', 
						alignItems: 'center', 
						justifyContent: 'center', 
						boxShadow: `0 4px 12px ${alpha(shadowColor, 0.15)}`,
						transition: 'transform 0.3s ease'
					}}
				>
					{icon}
				</Box>
			</CardContent>
		</Card>
	);
};

export default StatCard;
