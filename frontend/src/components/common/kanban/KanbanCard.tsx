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
				borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
				bgcolor: isDark ? '#141822' : '#ffffff',
				boxShadow: isDark 
					? '0 4px 12px rgba(0, 0, 0, 0.3)' 
					: '0 4px 12px rgba(139, 124, 246, 0.02)',
				cursor: disabled ? 'default' : 'grab',
				touchAction: 'none',
				opacity: isDragging ? 0.4 : 1,
				transform: transform ? CSS.Translate.toString(transform) : undefined,
				transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
				backdropFilter: 'blur(8px)',
				'&:hover': disabled ? undefined : {
					borderColor: theme.palette.primary.main,
					bgcolor: isDark ? '#1C212E' : '#ffffff',
					boxShadow: isDark 
						? '0 8px 24px rgba(139, 124, 246, 0.25)' 
						: '0 8px 24px rgba(139, 124, 246, 0.08)',
					transform: 'translateY(-2px)'
				},
			}}
		>
			{children}
		</Box>
	);
};

export default KanbanCard;
