import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';

interface DetailDrawerProps {
	open: boolean;
	onClose: () => void;
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	width?: string | number;
	headerExtra?: React.ReactNode;
	headerActions?: React.ReactNode;
	hideDivider?: boolean;
	children?: React.ReactNode;
	disablePadding?: boolean;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
	open,
	onClose,
	title,
	subtitle,
	width = 460,
	headerExtra,
	headerActions,
	hideDivider,
	children,
	disablePadding = false
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			sx={{
				'& .MuiDrawer-paper': {
					width: { xs: '100%', sm: width },
					boxSizing: 'border-box',
					overscrollBehavior: 'contain',
					p: disablePadding ? 0 : { xs: 2.5, sm: 3.5 },
					borderLeft: '1px solid',
					borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
					bgcolor: 'background.default',
					color: 'text.primary',
					boxShadow: isDark
						? '-16px 0px 48px rgba(0, 0, 0, 0.65), inset 1px 0px 0px rgba(255,255,255,0.05)'
						: '-16px 0px 48px rgba(139, 124, 246, 0.08), inset 1px 0px 0px rgba(255,255,255,0.4)',
					transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
				}
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				{/* Drawer Header */}
				<Box
					display="flex"
					justifyContent="space-between"
					alignItems="flex-start"
					sx={{
						mb: disablePadding ? 1.5 : 2,
						px: disablePadding ? { xs: 2.5, sm: 3.5 } : 0,
						pt: disablePadding ? { xs: 2.5, sm: 3.5 } : 0
					}}
				>
					<Box sx={{ pr: 2 }}>
						{typeof title === 'string' ? (
							<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
								{title}
							</Typography>
						) : (
							title
						)}
						{subtitle && (
							typeof subtitle === 'string' ? (
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.5 }}>
									{subtitle}
								</Typography>
							) : (
								subtitle
							)
						)}
					</Box>
					<Box display="flex" alignItems="center" gap={0.75}>
						{headerActions}
						<IconButton
							onClick={onClose}
							size="small"
							sx={{
								bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
								'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
							}}
						>
							<Close sx={{ fontSize: 20 }} />
						</IconButton>
					</Box>
				</Box>

				{/* Header Extra Actions (e.g. badges, status tags) */}
				{headerExtra && (
					<Box sx={{ mb: disablePadding ? 2 : 2.5, px: disablePadding ? { xs: 2.5, sm: 3.5 } : 0 }}>
						{headerExtra}
					</Box>
				)}

				{!hideDivider && (
					<Divider sx={{ mb: disablePadding ? 0 : 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
				)}

				{/* Drawer Content */}
				{children}
			</Box>
		</Drawer>
	);
};

export default DetailDrawer;
