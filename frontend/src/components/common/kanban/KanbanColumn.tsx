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

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				minWidth: width ?? { xs: 250, sm: 270, md: 280 },
				flex: 1,
				height: { xs: 'calc(100dvh - 340px)', sm: 'calc(100vh - 430px)' },
				minHeight: { xs: 320, sm: 380 },
				flexShrink: 0,
				scrollSnapAlign: { xs: 'start', md: 'none' },
				borderRadius: '16px',
				border: '1px solid',
				borderColor: isOver ? alpha(theme.palette.primary.main, 0.5) : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
				bgcolor: isOver ? alpha(theme.palette.primary.main, 0.04) : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
				transition: 'background-color 0.15s ease, border-color 0.15s ease',
			}}
		>
			<Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: footer ? 0.5 : 0 }}>
					{color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />}
					<Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{label}</Typography>
					{count != null && <Typography variant="caption" color="text.secondary">{count}</Typography>}
				</Stack>
				{footer}
			</Box>

			<Box ref={setNodeRef} sx={{ flex: 1, p: 1.25, minHeight: 120, overflowY: 'auto' }}>
				{children}
			</Box>
		</Box>
	);
};

export default KanbanColumn;
