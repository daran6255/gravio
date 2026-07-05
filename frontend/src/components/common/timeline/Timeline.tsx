import React from 'react';
import { Box, Typography, Stack, CircularProgress, useTheme, alpha } from '@mui/material';

export interface TimelineItemDef {
	id: string | number;
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	description?: React.ReactNode;
	timestamp?: React.ReactNode;
	icon?: React.ReactNode;
	iconBgColor?: string;
	iconColor?: string;
	iconBorderColor?: string;
	actions?: React.ReactNode;
	content?: React.ReactNode;
	isCompleted?: boolean;
}

interface TimelineProps {
	items: TimelineItemDef[];
	loading?: boolean;
	emptyMessage?: string;
	variant?: 'default' | 'card';
}

export const Timeline: React.FC<TimelineProps> = ({
	items,
	loading = false,
	emptyMessage = 'No timeline events to display.',
	variant = 'default',
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const isCard = variant === 'card';

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	if (items.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 4 }}>
				<Typography variant="body2" color="text.secondary">
					{emptyMessage}
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ position: 'relative', pl: 0.5 }}>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;

				return (
					<Box
						key={item.id}
						sx={{
							display: 'flex',
							position: 'relative',
							pb: isLast ? 0 : (isCard ? 2.5 : 3.5),
							opacity: item.isCompleted ? 0.6 : 1,
							transition: 'opacity 0.2s ease',
						}}
					>
						{/* Vertical Connector Line */}
						{!isLast && (
							<Box
								sx={{
									position: 'absolute',
									left: 15,
									top: 36,
									bottom: 0,
									width: 1.5,
									bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
								}}
							/>
						)}

						{/* Icon / Marker Node */}
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 32,
								height: 32,
								borderRadius: '50%',
								flexShrink: 0,
								bgcolor: item.iconBgColor || alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08),
								color: item.iconColor || 'primary.main',
								border: '1px solid',
								borderColor: item.iconBorderColor || alpha(theme.palette.primary.main, isDark ? 0.25 : 0.15),
								zIndex: 1,
								boxShadow: isDark 
									? '0 0 12px rgba(0,0,0,0.2)' 
									: '0 0 12px rgba(24, 28, 48, 0.02)',
							}}
						>
							{item.icon}
						</Box>

						{/* Content Block */}
						<Box
							sx={{
								flex: 1,
								ml: 2,
								minWidth: 0,
								pt: 0.25,
								...(isCard && {
									bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
									border: '1px solid',
									borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
									borderRadius: '12px',
									p: 2,
									mb: 0.5,
									boxShadow: isDark 
										? '0 2px 8px rgba(0,0,0,0.15)' 
										: '0 2px 8px rgba(24, 28, 48, 0.02)',
									transition: 'all 0.2s ease',
									'&:hover': {
										borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
										boxShadow: isDark 
											? '0 4px 16px rgba(0,0,0,0.3)' 
											: '0 4px 16px rgba(24, 28, 48, 0.04)',
									}
								})
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
								<Box sx={{ minWidth: 0 }}>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 700,
											color: 'text.primary',
											fontSize: '0.875rem',
											lineHeight: 1.3,
											textDecoration: item.isCompleted ? 'line-through' : 'none',
										}}
									>
										{item.title}
									</Typography>
									{item.timestamp && (
										<Typography 
											variant="caption" 
											sx={{ 
												display: 'block',
												mt: 0.35,
												color: 'text.secondary', 
												fontWeight: 500, 
												fontSize: '0.75rem' 
											}}
										>
											{item.timestamp}
										</Typography>
									)}
									{item.subtitle && (
										<Typography 
											variant="caption" 
											sx={{ 
												display: 'block',
												mt: 0.25,
												color: 'text.disabled', 
												fontSize: '0.72rem' 
											}}
										>
											{item.subtitle}
										</Typography>
									)}
								</Box>
								
								<Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
									{item.actions}
								</Stack>
							</Stack>

							{item.description && (
								<Box
									sx={{
										display: 'block',
										mt: 1,
										pl: 1.5,
										borderLeft: '2px solid',
										borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
										color: 'text.secondary',
										fontSize: '0.8rem',
									}}
								>
									{item.description}
								</Box>
							)}

							{item.content && <Box sx={{ mt: 1 }}>{item.content}</Box>}
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};

export default Timeline;
