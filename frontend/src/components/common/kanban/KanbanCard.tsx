import React from 'react';
import { Box, useTheme } from '@mui/material';
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
				p: 2,
				mb: 1.5,
				borderRadius: '14px',
				border: '1px solid',
				// A visible border plus a bg tint distinct from the column's own
				// surface color (theme.palette.background.paper) in both themes,
				// so cards read as clearly separate objects sitting on the column.
				borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
				bgcolor: isDark ? '#1B2130' : '#F8FAFC',
				boxShadow: isDark
					? '0 4px 12px rgba(0, 0, 0, 0.3)'
					: '0 4px 12px rgba(15, 23, 42, 0.04)',
				cursor: disabled ? 'default' : 'grab',
				touchAction: 'none',
				opacity: isDragging ? 0.4 : 1,
				transform: transform ? CSS.Translate.toString(transform) : undefined,
				transition: 'none',
				backdropFilter: 'blur(8px)',
				'&:hover': disabled ? undefined : {
					borderColor: theme.palette.primary.main,
					boxShadow: isDark
						? '0 8px 24px rgba(139, 124, 246, 0.25)'
						: '0 8px 24px rgba(139, 124, 246, 0.08)',
				},
			}}
		>
			{children}
		</Box>
	);
};

export default KanbanCard;
