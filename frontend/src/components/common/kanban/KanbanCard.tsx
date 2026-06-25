import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export interface KanbanCardProps {
	id: string | number;
	data?: Record<string, unknown>;
	onClick?: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ id, data, onClick, disabled, children }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data, disabled });

	return (
		<Box
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			onClick={onClick}
			sx={{
				p: 1.5,
				mb: 1.25,
				borderRadius: '12px',
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
				bgcolor: theme.palette.background.paper,
				cursor: disabled ? 'default' : 'grab',
				touchAction: 'none',
				opacity: isDragging ? 0.4 : 1,
				transform: transform ? CSS.Translate.toString(transform) : undefined,
				transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
				'&:hover': disabled ? undefined : {
					borderColor: alpha(theme.palette.primary.main, 0.3),
					boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
				},
			}}
		>
			{children}
		</Box>
	);
};

export default KanbanCard;
