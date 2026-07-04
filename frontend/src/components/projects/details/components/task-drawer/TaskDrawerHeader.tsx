import React, { useState, useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	IconButton,
	Button,
	Popover,
	TextField,
	useTheme,
	alpha,
} from '@mui/material';
import {
	CloseOutlined,
	EditOutlined,
	CheckOutlined,
	ChevronRightOutlined,
	DeleteOutline,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus } from '../../../../../models/projects/projectTask';

interface TaskDrawerHeaderProps {
	task: ProjectTask;
	statuses: ProjectTaskStatus[];
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
	onDelete: () => void;
	onClose: () => void;
}

export const TaskDrawerHeader: React.FC<TaskDrawerHeaderProps> = ({
	task,
	statuses,
	onUpdateField,
	onDelete,
	onClose,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editTitle, setEditTitle] = useState(task.title);
	const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setEditTitle(task.title);
		setIsEditingTitle(false);
	}, [task.id, task.title]);

	const saveTitle = async () => {
		if (editTitle.trim() && editTitle !== task.title) {
			await onUpdateField({ title: editTitle.trim() });
		}
		setIsEditingTitle(false);
	};

	const selectedStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	return (
		<Box
			sx={{
				px: 3.5,
				py: 2.25,
				borderBottom: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
				bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
			}}
		>
			{/* Top Bar: Action items and Status picker */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Button
						onClick={(e) => setStatusAnchor(e.currentTarget)}
						startIcon={dotIcon(selectedStatus.color)}
						endIcon={<ChevronRightOutlined fontSize="small" sx={{ transform: 'rotate(90deg)', ml: -0.5 }} />}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.8rem',
							borderRadius: '100px',
							color: 'white',
							bgcolor: selectedStatus.color,
							px: 2,
							py: 0.5,
							boxShadow: `0 4px 10px ${alpha(selectedStatus.color, 0.3)}`,
							'&:hover': {
								bgcolor: selectedStatus.color,
								opacity: 0.9,
								boxShadow: `0 4px 14px ${alpha(selectedStatus.color, 0.4)}`,
							},
						}}
					>
						{selectedStatus.name}
					</Button>

					<Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.02em' }}>
						Task #{task.id}
					</Typography>

					<Box
						sx={{
							bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
							px: 1.5,
							py: 0.25,
							borderRadius: '6px',
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
						}}
					>
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
							Public
						</Typography>
					</Box>
				</Stack>

				<Stack direction="row" spacing={1}>
					<IconButton
						onClick={onDelete}
						color="error"
						title="Delete Task"
						size="small"
						sx={{
							bgcolor: isDark ? 'rgba(244,67,54,0.06)' : 'rgba(244,67,54,0.04)',
							border: '1px solid',
							borderColor: isDark ? 'rgba(244,67,54,0.15)' : 'rgba(244,67,54,0.1)',
							'&:hover': { bgcolor: isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.08)' },
						}}
					>
						<DeleteOutline fontSize="small" />
					</IconButton>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{
							bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
							border: '1px solid',
							borderColor: 'divider',
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
						}}
					>
						<CloseOutlined fontSize="small" />
					</IconButton>
				</Stack>
			</Box>

			{/* Bottom Bar: Inline Editable Title */}
			<Box>
				{isEditingTitle ? (
					<Stack direction="row" spacing={1} alignItems="center">
						<TextField
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							fullWidth
							size="small"
							autoFocus
							onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }}
							InputProps={{
								sx: {
									fontWeight: 800,
									fontSize: '1.4rem',
									borderRadius: '10px',
								},
							}}
						/>
						<IconButton
							onClick={saveTitle}
							color="primary"
							sx={{
								bgcolor: isDark ? 'rgba(139,124,246,0.12)' : 'rgba(139,124,246,0.08)',
								'&:hover': { bgcolor: isDark ? 'rgba(139,124,246,0.2)' : 'rgba(139,124,246,0.15)' },
							}}
						>
							<CheckOutlined />
						</IconButton>
					</Stack>
				) : (
					<Stack direction="row" spacing={1} alignItems="center">
						<Typography
							variant="h5"
							onClick={() => setIsEditingTitle(true)}
							sx={{
								fontWeight: 800,
								letterSpacing: '-0.02em',
								cursor: 'pointer',
								py: 0.5,
								px: 1,
								ml: -1,
								borderRadius: '8px',
								transition: 'background-color 0.2s',
								'&:hover': {
									bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
								},
							}}
						>
							{task.title}
						</Typography>
						<IconButton
							onClick={() => setIsEditingTitle(true)}
							size="small"
							sx={{
								color: 'text.secondary',
								opacity: 0.6,
								'&:hover': { opacity: 1 },
							}}
						>
							<EditOutlined fontSize="small" />
						</IconButton>
					</Stack>
				)}
			</Box>

			{/* Status Dropdown Popover */}
			<Popover
				open={Boolean(statusAnchor)}
				anchorEl={statusAnchor}
				onClose={() => setStatusAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{
					sx: {
						borderRadius: '10px',
						mt: 0.5,
						boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
					},
				}}
			>
				<Stack sx={{ minWidth: 180, py: 0.5 }}>
					{statuses.map((s) => (
						<Box
							key={s.id}
							onClick={() => {
								onUpdateField({ status_id: s.id });
								setStatusAnchor(null);
							}}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
								px: 2.25,
								py: 1.25,
								cursor: 'pointer',
								bgcolor: s.id === task.status_id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								color: s.id === task.status_id ? 'primary.main' : 'text.primary',
								'&:hover': {
									bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
								},
							}}
						>
							{dotIcon(s.color)}
							<Typography variant="body2" sx={{ fontWeight: s.id === task.status_id ? 700 : 600 }}>
								{s.name}
							</Typography>
						</Box>
					))}
				</Stack>
			</Popover>
		</Box>
	);
};

export default TaskDrawerHeader;
