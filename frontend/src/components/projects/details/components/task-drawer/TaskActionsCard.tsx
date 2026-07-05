import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { ArrowForwardOutlined, ContentCopyOutlined, DeleteOutline } from '@mui/icons-material';

interface TaskActionsCardProps {
	onDelete: () => void;
}

export const TaskActionsCard: React.FC<TaskActionsCardProps> = ({ onDelete }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#161b22' : '#ffffff';
	const hoverBg = isDark ? '#21262d' : '#f3f4f6';

	// Called as a plain function (not a JSX component tag) so it isn't re-created as a
	// distinct component identity on every render.
	const renderActionRow = ({
		icon,
		label,
		onClick,
		danger = false,
	}: {
		icon: React.ReactNode;
		label: string;
		onClick: () => void;
		danger?: boolean;
	}) => (
		<Stack
			key={label}
			direction="row"
			alignItems="center"
			spacing={1.5}
			onClick={onClick}
			sx={{
				py: 1,
				px: 1.5,
				borderRadius: '8px',
				cursor: 'pointer',
				color: danger ? 'error.main' : 'text.primary',
				'&:hover': { bgcolor: danger ? (isDark ? 'rgba(244,67,54,0.1)' : 'rgba(244,67,54,0.05)') : hoverBg },
			}}
		>
			<Box sx={{ display: 'flex', fontSize: 18, color: danger ? 'error.main' : 'text.secondary' }}>{icon}</Box>
			<Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
				{label}
			</Typography>
		</Stack>
	);

	return (
		<Box
			sx={{
				border: '1px solid',
				borderColor,
				borderRadius: '12px',
				bgcolor: cardBg,
				overflow: 'hidden',
				boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.02)',
			}}
		>
			{/* Card header */}
			<Stack
				direction="row"
				alignItems="center"
				sx={{
					px: 2,
					py: 1.1,
					borderBottom: '1px solid',
					borderColor,
					bgcolor: isDark ? '#161b22' : '#f6f8fa',
				}}
			>
				<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
					Actions
				</Typography>
			</Stack>

			{/* Flat action list -- always visible, not tucked behind a "..." menu */}
			<Stack sx={{ p: 1 }}>
				{renderActionRow({ icon: <ArrowForwardOutlined fontSize="inherit" />, label: 'Transfer task', onClick: () => {} })}
				{renderActionRow({ icon: <ContentCopyOutlined fontSize="inherit" />, label: 'Clone task', onClick: () => {} })}
				{renderActionRow({ icon: <DeleteOutline fontSize="inherit" />, label: 'Delete task', onClick: onDelete, danger: true })}
			</Stack>
		</Box>
	);
};

export default TaskActionsCard;
