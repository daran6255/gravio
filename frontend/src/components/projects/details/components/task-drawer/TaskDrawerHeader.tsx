import React, { useState, useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	IconButton,
	Popover,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	TextField,
	useTheme,
	alpha,
} from '@mui/material';
import {
	CloseOutlined,
	CheckOutlined,
	DeleteOutline,
	OpenInNewOutlined,
	MoreHorizOutlined,
	CheckCircleOutline,
	FolderOutlined,
	AssignmentOutlined,
	CalendarTodayOutlined,
	ListAltOutlined,
	TagOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus } from '../../../../../models/projects/projectTask';
import useToast from '../../../../../hooks/useToast';

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
	const toast = useToast();

	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editTitle, setEditTitle] = useState(task.title);
	const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
	const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);

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

	// The task drawer isn't itself a route -- it's opened over the project page via
	// a `?task=<public_id>` query param (see useProjectDetail's deep-link effect),
	// so that's what makes a copied/opened link actually reopen this exact task.
	const buildTaskUrl = () => {
		const url = new URL(window.location.href);
		url.searchParams.set('task', task.public_id);
		return url.toString();
	};

	const handleOpenInNewTab = () => {
		window.open(buildTaskUrl(), '_blank', 'noopener,noreferrer');
	};

	const handleCopyTaskId = async () => {
		try {
			await navigator.clipboard.writeText(String(task.id));
			toast.success('Task ID copied to clipboard');
		} catch {
			toast.error('Failed to copy task ID');
		}
		setMoreAnchor(null);
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

	return (
		<Box
			sx={{
				px: 3.5,
				py: 1.75,
				borderBottom: '1px solid',
				borderColor: 'divider',
				display: 'flex',
				flexDirection: 'column',
				gap: 1.5,
				bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.003)',
			}}
		>
			{/* Row 1: Title (left) & Action Icons (right) */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
				{/* Title Section */}
				<Box sx={{ flex: 1, mr: 2 }}>
					{isEditingTitle ? (
						<Stack direction="row" spacing={1} sx={{ width: '100%' }}>
							<TextField
								value={editTitle}
								onChange={(e) => setEditTitle(e.target.value)}
								fullWidth
								size="small"
								autoFocus
								onBlur={saveTitle}
								onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }}
								InputProps={{
									sx: {
										fontWeight: 700,
										fontSize: '1.35rem',
										borderRadius: '8px',
										py: 0.25,
									},
								}}
							/>
							<IconButton onClick={saveTitle} color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
								<CheckOutlined />
							</IconButton>
						</Stack>
					) : (
						<Typography
							variant="h5"
							sx={{
								fontWeight: 800,
								color: 'text.primary',
								letterSpacing: '-0.02em',
								cursor: 'pointer',
								borderRadius: '6px',
								'&:hover': { bgcolor: theme.palette.action.hover },
								px: 1,
								py: 0.1,
								ml: -1,
								lineHeight: 1.25,
								display: 'inline-block',
							}}
							onClick={() => setIsEditingTitle(true)}
						>
							{task.title} <span style={{ color: theme.palette.text.secondary, fontSize: '1.15rem', fontWeight: 500, marginLeft: '8px' }}>#{task.id}</span>
						</Typography>
					)}
				</Box>

				{/* Header Actions */}
				<Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
					<IconButton size="small" title="Open in new tab" onClick={handleOpenInNewTab} sx={{ color: 'text.secondary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<OpenInNewOutlined fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" title="Delete task" onClick={onDelete} sx={{ color: 'error.main', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<DeleteOutline fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" title="More options" onClick={(e) => setMoreAnchor(e.currentTarget)} sx={{ color: 'text.secondary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<MoreHorizOutlined fontSize="small" style={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" onClick={onClose} sx={{ color: 'text.primary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
						<CloseOutlined fontSize="small" style={{ fontSize: 18 }} />
					</IconButton>
				</Stack>
			</Box>

			{/* More Options Menu */}
			<Menu
				anchorEl={moreAnchor}
				open={Boolean(moreAnchor)}
				onClose={() => setMoreAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				MenuListProps={{ dense: true, sx: { py: 0.5 } }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<MenuItem onClick={handleCopyTaskId} sx={{ py: 0.6, minHeight: 'auto' }}>
					<ListItemIcon sx={{ minWidth: 30 }}><TagOutlined fontSize="small" /></ListItemIcon>
					<ListItemText primary="Copy task ID" primaryTypographyProps={{ fontSize: '0.85rem' }} />
				</MenuItem>
				<Divider sx={{ my: 0.5 }} />
				<MenuItem
					onClick={() => { setMoreAnchor(null); onDelete(); }}
					sx={{ py: 0.6, minHeight: 'auto' }}
				>
					<ListItemIcon sx={{ minWidth: 30 }}><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
					<ListItemText primary="Delete task" primaryTypographyProps={{ fontSize: '0.85rem', color: 'error' }} />
				</MenuItem>
			</Menu>

			{/* Bottom Row: Metadata Summary Bar */}
			<Stack direction="row" flexWrap="wrap" gap={1.25} alignItems="center">
				{/* Interactive Status Selector Pill */}
				{isClosed ? (
					<Box
						onClick={(e) => setStatusAnchor(e.currentTarget)}
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.75,
							bgcolor: theme.palette.mode === 'dark' ? 'rgba(139,124,246,0.15)' : 'rgba(139,124,246,0.08)',
							border: '1px solid rgba(139,124,246,0.3)',
							color: '#8B7CF6',
							px: 1.5,
							py: 0.5,
							borderRadius: '6px',
							fontSize: '0.75rem',
							fontWeight: 700,
							cursor: 'pointer',
							'&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(139,124,246,0.2)' : 'rgba(139,124,246,0.12)' },
						}}
					>
						<CheckCircleOutline style={{ fontSize: 13 }} />
						Closed
					</Box>
				) : (
					<Box
						onClick={(e) => setStatusAnchor(e.currentTarget)}
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.75,
							bgcolor: alpha(selectedStatus.color, 0.1),
							border: `1px solid ${alpha(selectedStatus.color, 0.4)}`,
							color: selectedStatus.color,
							px: 1.5,
							py: 0.5,
							borderRadius: '6px',
							fontSize: '0.75rem',
							fontWeight: 700,
							cursor: 'pointer',
							'&:hover': { bgcolor: alpha(selectedStatus.color, 0.15) },
						}}
					>
						{dotIcon(selectedStatus.color)}
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
						borderRadius: '6px',
						fontSize: '0.75rem',
						fontWeight: 600,
						bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
					}}
				>
					<AssignmentOutlined style={{ fontSize: 13 }} />
					Task
				</Box>

				{/* Sub-tasks checklist progress badge */}
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
						borderRadius: '6px',
						fontSize: '0.75rem',
						fontWeight: 600,
						bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
						opacity: subtasks.length > 0 ? 1 : 0.6,
					}}
				>
					<ListAltOutlined style={{ fontSize: 13 }} />
					{subtasks.length > 0 ? `${completedSubCount} / ${subtasks.length} Subtasks` : 'No Subtasks'}
				</Box>

				{/* Project Badge */}
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
						borderRadius: '6px',
						fontSize: '0.75rem',
						fontWeight: 600,
						bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
					}}
				>
					<FolderOutlined style={{ fontSize: 13 }} />
					{projectName}
				</Box>

				{/* Created At badge */}
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
						borderRadius: '6px',
						fontSize: '0.75rem',
						fontWeight: 600,
						bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
					}}
				>
					<CalendarTodayOutlined style={{ fontSize: 13 }} />
					Created {dayjs(task.created_at).format('MMM D, YYYY')}
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
