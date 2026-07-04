import React, { useState, useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	IconButton,
	Popover,
	TextField,
	useTheme,
	alpha,
} from '@mui/material';
import {
	CloseOutlined,
	EditOutlined,
	CheckOutlined,
	DeleteOutline,
	ContentCopyOutlined,
	OpenInNewOutlined,
	MoreHorizOutlined,
	CheckCircleOutline,
	FolderOutlined,
	AssignmentOutlined,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus } from '../../../../../models/projects/projectTask';

interface TaskDrawerHeaderProps {
	task: ProjectTask;
	statuses: ProjectTaskStatus[];
	tasks: ProjectTask[];
	projectName: string;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
	onDelete: () => void;
	onClose: () => void;
}

export const TaskDrawerHeader: React.FC<TaskDrawerHeaderProps> = ({
	task,
	statuses,
	tasks,
	projectName,
	onUpdateField,
	onDelete,
	onClose,
}) => {
	const theme = useTheme();

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
	const isClosed = selectedStatus.is_done_status;

	// Calculate subtask counts
	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
	const completedSubCount = subtasks.filter((st) => {
		const stStatus = statuses.find((s) => s.id === st.status_id);
		return stStatus?.is_done_status;
	}).length;

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	// Format project name for GitHub repository style badge (e.g. "winvinaya / winvinaya-crm")
	const formattedRepoName = `winvinaya / ${projectName.toLowerCase().replace(/\s+/g, '-')}`;

	return (
		<Box
			sx={{
				px: 3.5,
				py: 2,
				borderBottom: '1px solid',
				borderColor: 'divider',
				display: 'flex',
				flexDirection: 'column',
				gap: 1.5,
				bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
			}}
		>
			{/* Top row: Title + Actions */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				{isEditingTitle ? (
					<Stack direction="row" spacing={1} sx={{ flex: 1, mr: 2 }}>
						<TextField
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							fullWidth
							size="small"
							autoFocus
							onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }}
							InputProps={{
								sx: {
									fontWeight: 700,
									fontSize: '1.25rem',
									borderRadius: '8px',
								},
							}}
						/>
						<IconButton onClick={saveTitle} color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
							<CheckOutlined />
						</IconButton>
					</Stack>
				) : (
					<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, mr: 2 }}>
						<Typography
							variant="h6"
							sx={{
								fontWeight: 700,
								color: 'text.primary',
								letterSpacing: '-0.01em',
								cursor: 'pointer',
								borderRadius: '6px',
								'&:hover': { bgcolor: theme.palette.action.hover },
								px: 1,
								py: 0.25,
								ml: -1,
							}}
							onClick={() => setIsEditingTitle(true)}
						>
							{task.title} <span style={{ color: theme.palette.text.secondary, fontWeight: 500 }}>#{task.id}</span>
						</Typography>
						<IconButton onClick={() => setIsEditingTitle(true)} size="small" sx={{ color: 'text.secondary' }}>
							<EditOutlined fontSize="small" />
						</IconButton>
					</Stack>
				)}

				{/* Top Right Header Actions */}
				<Stack direction="row" spacing={0.5} alignItems="center">
					<IconButton size="small" title="Copy link" sx={{ color: 'text.secondary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<ContentCopyOutlined fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" title="Open in new tab" sx={{ color: 'text.secondary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<OpenInNewOutlined fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" title="Delete issue" onClick={onDelete} sx={{ color: 'error.main', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<DeleteOutline fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" title="More options" sx={{ color: 'text.secondary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<MoreHorizOutlined fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" onClick={onClose} sx={{ color: 'text.primary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<CloseOutlined fontSize="small" style={{ fontSize: 18 }} />
					</IconButton>
				</Stack>
			</Box>

			{/* Bottom row: Badges Bar */}
			<Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
				{/* Closed / Done status badge */}
				{isClosed ? (
					<Box
						onClick={(e) => setStatusAnchor(e.currentTarget)}
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.75,
							bgcolor: theme.palette.mode === 'dark' ? 'rgba(111,66,193,0.15)' : 'rgba(111,66,193,0.08)',
							border: '1px solid',
							borderColor: theme.palette.mode === 'dark' ? 'rgba(111,66,193,0.3)' : 'rgba(111,66,193,0.2)',
							color: '#8B7CF6',
							px: 1.5,
							py: 0.5,
							borderRadius: '100px',
							fontSize: '0.75rem',
							fontWeight: 700,
							cursor: 'pointer',
							'&:hover': { opacity: 0.9 },
						}}
					>
						<CheckCircleOutline style={{ fontSize: 14 }} />
						Closed
					</Box>
				) : (
					<Box
						onClick={(e) => setStatusAnchor(e.currentTarget)}
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.75,
							bgcolor: selectedStatus.color,
							color: 'white',
							px: 1.5,
							py: 0.5,
							borderRadius: '100px',
							fontSize: '0.75rem',
							fontWeight: 700,
							cursor: 'pointer',
							boxShadow: `0 2px 6px ${alpha(selectedStatus.color, 0.25)}`,
							'&:hover': { opacity: 0.9 },
						}}
					>
						{dotIcon('white')}
						{selectedStatus.name}
					</Box>
				)}

				{/* Type Badge */}
				<Box
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.75,
						border: '1px solid',
						borderColor: 'divider',
						color: 'text.secondary',
						px: 1.25,
						py: 0.5,
						borderRadius: '100px',
						fontSize: '0.75rem',
						fontWeight: 600,
					}}
				>
					<AssignmentOutlined style={{ fontSize: 14 }} />
					Task
				</Box>

				{/* Sub-task checklist progress badge */}
				{subtasks.length > 0 && (
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.75,
							border: '1px solid',
							borderColor: 'divider',
							color: 'text.secondary',
							px: 1.25,
							py: 0.5,
							borderRadius: '100px',
							fontSize: '0.75rem',
							fontWeight: 600,
						}}
					>
						<CheckCircleOutline style={{ fontSize: 14 }} />
						{completedSubCount} / {subtasks.length}
					</Box>
				)}

				{/* Project repository path (dynamic!) */}
				<Box
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.75,
						border: '1px solid',
						borderColor: 'divider',
						color: 'text.secondary',
						px: 1.5,
						py: 0.5,
						borderRadius: '100px',
						fontSize: '0.75rem',
						fontWeight: 600,
					}}
				>
					<FolderOutlined style={{ fontSize: 14 }} />
					{formattedRepoName}
				</Box>

				{/* Public Visibility capsule */}
				<Box
					sx={{
						bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
						border: '1px solid',
						borderColor: 'divider',
						color: 'text.secondary',
						px: 1.25,
						py: 0.5,
						borderRadius: '100px',
						fontSize: '0.75rem',
						fontWeight: 700,
					}}
				>
					Public
				</Box>
			</Stack>

			{/* Status Popover Picker */}
			<Popover
				open={Boolean(statusAnchor)}
				anchorEl={statusAnchor}
				onClose={() => setStatusAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
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
								'&:hover': { bgcolor: theme.palette.action.hover },
							}}
						>
							{dotIcon(s.color)}
							<Typography variant="body2" sx={{ fontWeight: s.id === task.status_id ? 700 : 600, ml: 1 }}>
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
