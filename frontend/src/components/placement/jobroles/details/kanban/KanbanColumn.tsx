import React from 'react';
import {
	Box,
	Typography,
	Stack,
	Chip,
	useTheme,
	alpha
} from '@mui/material';
import { useDroppable } from '@dnd-kit/core';

export const getCategoryColor = (category: string, theme: any) => {
	switch (category) {
		case 'lead': return theme.palette.primary.main;
		case 'shortlisted': return '#6b38fb'; // Unique violet for shortlisted
		case 'interview': return theme.palette.accent.main;
		case 'offer': return theme.palette.success.main;
		case 'hired': return theme.palette.success.dark;
		case 'rejected': return theme.palette.error.main;
		case 'not_joined': return theme.palette.text.secondary;
		default: return theme.palette.divider;
	}
};

interface KanbanColumnProps {
	id: string;
	title: string;
	category: string;
	count: number;
	children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, category, count, children }) => {
	const theme = useTheme();
	const { setNodeRef, isOver } = useDroppable({ id });
	const color = getCategoryColor(category, theme);

	return (
		<Box
			ref={setNodeRef}
			sx={{
				minWidth: 280,
				width: 280,
				flexShrink: 0,
				bgcolor: isOver ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.default,
				borderRadius: theme.shape.borderRadius,
				display: 'flex',
				flexDirection: 'column',
				maxHeight: '100%',
				border: '1px solid',
				borderColor: isOver ? (getCategoryColor(category, theme)) : theme.palette.divider,
				borderTop: `4px solid ${color}`,
				transition: theme.transitions.create(['background-color', 'border-color']),
				position: 'relative'
			}}
		>
			<Box sx={{
				p: 2,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderBottom: `1px solid ${theme.palette.divider}`,
				position: 'sticky',
				top: 0,
				bgcolor: isOver ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.default,
				zIndex: 2,
				borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`
			}}>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Typography variant="awsFieldLabel" sx={{ m: 0, color: theme.palette.text.primary, fontSize: '0.75rem' }}>
						{title}
					</Typography>
					<Chip
						label={count}
						size="small"
						sx={{
							height: 18,
							fontSize: '0.65rem',
							fontWeight: 700,
							bgcolor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`
						}}
					/>
				</Stack>
			</Box>

			<Box sx={{ p: 1.5, overflowY: 'auto', flexGrow: 1, minHeight: 150 }}>
				{children}
			</Box>
		</Box>
	);
};

export default KanbanColumn;
