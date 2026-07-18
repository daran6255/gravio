import React from 'react';
import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';

export interface KanbanColumnProps {
	id: string | number;
	label: string;
	color?: string;
	count?: number;
	footer?: React.ReactNode;
	width?: number | string;
	children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, label, color, count, footer, width, children }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { setNodeRef, isOver } = useDroppable({ id });

	const accentColor = color || theme.palette.primary.main;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				minWidth: width ?? { xs: 260, sm: 280, md: 300 },
				flex: 1,
				height: { xs: 'calc(100dvh - 180px)', sm: 'calc(100vh - 240px)' },
				minHeight: { xs: 450, sm: 550 },
				flexShrink: 0,
				scrollSnapAlign: { xs: 'start', md: 'none' },
				borderRadius: '16px',
				overflow: 'hidden',
				border: '1px solid',
				borderTop: `4px solid ${accentColor}`,
				borderColor: isOver
					? alpha(theme.palette.primary.main, 0.4)
					: (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
				// Plain surface color — the task cards inside get their own tint +
				// border so they stand out against this, rather than the column
				// trying to differ from the page itself.
				bgcolor: isOver
					? alpha(theme.palette.primary.main, 0.04)
					: theme.palette.background.paper,
				boxShadow: isDark
					? '0 4px 20px 0 rgba(0,0,0,0.15)'
					: '0 4px 20px 0 rgba(139,124,246,0.02)',
				backdropFilter: 'blur(10px)',
			}}
		>
			<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 1 }}>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Typography 
						variant="body2" 
						sx={{ 
							fontWeight: 800, 
							letterSpacing: '0.04em', 
							textTransform: 'uppercase', 
							fontSize: '0.72rem', 
							color: isDark ? 'text.primary' : '#475569',
							flex: 1 
						}}
					>
						{label}
					</Typography>
					{count != null && (
						<Box 
							sx={{ 
								px: 1, 
								py: 0.25, 
								borderRadius: '12px', 
								fontSize: '0.68rem', 
								fontWeight: 800, 
								bgcolor: alpha(accentColor, 0.1), 
								color: accentColor,
								border: `1px solid ${alpha(accentColor, 0.15)}`
							}}
						>
							{count}
						</Box>
					)}
				</Stack>
				{footer}
			</Box>

			<Box 
				ref={setNodeRef} 
				sx={{ 
					flex: 1, 
					p: 1.5, 
					minHeight: 120, 
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					gap: 1.5,
				}}
			>
				{children}
			</Box>
		</Box>
	);
};

export default KanbanColumn;
