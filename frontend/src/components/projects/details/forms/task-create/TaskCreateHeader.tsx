import React from 'react';
import { Box, Stack, IconButton, Typography, useTheme } from '@mui/material';
import { CloseOutlined, ArrowBackOutlined } from '@mui/icons-material';
import type { ProjectTask } from '../../../../../models/projects/projectTask';

interface TaskCreateHeaderProps {
	onClose: () => void;
	submitting: boolean;
	parentTask?: ProjectTask | null;
	projectName: string;
}

export const TaskCreateHeader: React.FC<TaskCreateHeaderProps> = ({
	onClose,
	submitting,
	parentTask,
	projectName,
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				px: 2.5,
				py: 1.5,
				borderBottom: '1px solid',
				borderColor: theme.palette.divider,
				bgcolor: theme.palette.background.default,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<Stack direction="row" alignItems="center" spacing={1.5}>
				<IconButton
					onClick={onClose}
					size="small"
					sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: theme.palette.action.hover } }}
				>
					<ArrowBackOutlined style={{ fontSize: 18 }} />
				</IconButton>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.925rem' }}>
					{parentTask 
						? `Create new sub-task in ${projectName}`
						: `Create new task in ${projectName}`}
				</Typography>
			</Stack>
			<IconButton
				onClick={onClose}
				disabled={submitting}
				size="small"
				sx={{ color: 'text.secondary', '&:hover': { color: theme.palette.error.main, bgcolor: theme.palette.action.hover } }}
			>
				<CloseOutlined style={{ fontSize: 18 }} />
			</IconButton>
		</Box>
	);
};
