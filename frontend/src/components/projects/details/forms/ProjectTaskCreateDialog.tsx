import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogActions,
	Box,
	Stack,
	TextField,
	Typography,
	Button,
	IconButton,
	Avatar,
	useTheme,
	alpha,
	Popover,
} from '@mui/material';
import {
	CloseOutlined,
	PersonOutline,
	ChevronRightOutlined,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskStatus } from '../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#4CAF50' },
	{ value: 'medium', label: 'Medium', color: '#2196F3' },
	{ value: 'high', label: 'High', color: '#FF9800' },
	{ value: 'urgent', label: 'Urgent', color: '#F44336' },
];

interface ProjectTaskCreateDialogProps {
	open: boolean;
	onClose: () => void;
	parentTask?: ProjectTask | null; // using parent task details if adding subtask
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	submitting: boolean;
	onSubmit: (payload: ProjectTaskCreate) => Promise<void>;
}

export const ProjectTaskCreateDialog: React.FC<ProjectTaskCreateDialogProps> = ({
	open,
	onClose,
	parentTask,
	statuses,
	owners,
	submitting,
	onSubmit,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#161b22' : '#ffffff';
	const hoverBg = isDark ? '#21262d' : '#f3f4f6';

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [statusId, setStatusId] = useState<number>(statuses[0]?.id || 0);
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [assigneeId, setAssigneeId] = useState<number | null>(null);
	const [touched, setTouched] = useState(false);
	const [assigneeAnchor, setAssigneeAnchor] = useState<HTMLElement | null>(null);

	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setTitle('');
			setDescription('');
			setStatusId(statuses[0]?.id || 0);
			setPriority('medium');
			setAssigneeId(null);
			setTouched(false);
		}
	}

	const titleError = touched && !title.trim() ? 'Title is required' : '';
	const isValid = !!title.trim();
	const selectedAssignee = owners.find((o) => o.id === assigneeId) || null;

	const handleCreate = async () => {
		setTouched(true);
		if (!isValid) return;
		await onSubmit({
			title: title.trim(),
			description: description.trim() || undefined,
			status_id: statusId,
			priority,
			assignee_id: assigneeId ?? undefined,
		});
	};

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	// A selectable chip: bordered + tinted when active, neutral otherwise -- the
	// same restrained pill treatment used throughout the rest of the task drawer,
	// rather than a fully solid color fill.
	const selectableChip = ({
		key,
		label,
		color,
		isSelected,
		onClick,
	}: {
		key: React.Key;
		label: string;
		color: string;
		isSelected: boolean;
		onClick: () => void;
	}) => (
		<Button
			key={key}
			onClick={onClick}
			startIcon={dotIcon(isSelected ? color : theme.palette.text.disabled)}
			sx={{
				textTransform: 'none',
				fontWeight: 700,
				fontSize: '0.8rem',
				borderRadius: '100px',
				px: 1.75,
				py: 0.5,
				color: isSelected ? color : 'text.secondary',
				bgcolor: isSelected ? alpha(color, 0.12) : 'transparent',
				border: '1px solid',
				borderColor: isSelected ? alpha(color, 0.4) : borderColor,
				'&:hover': {
					bgcolor: isSelected ? alpha(color, 0.18) : hoverBg,
					borderColor: isSelected ? alpha(color, 0.5) : borderColor,
				},
			}}
		>
			{label}
		</Button>
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: '12px',
					border: '1px solid',
					borderColor,
					overflow: 'hidden',
					bgcolor: cardBg,
					backgroundImage: 'none',
					boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.12)',
				},
			}}
		>
			{/* Header */}
			<Box sx={{ position: 'relative' }}>
				<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)' }} />
				<Box
					sx={{
						px: 3,
						pt: 2.75,
						pb: 2,
						borderBottom: '1px solid',
						borderColor,
						bgcolor: isDark ? '#161b22' : '#f6f8fa',
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
					}}
				>
					<Stack spacing={0.4}>
						<Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', letterSpacing: '-0.01em' }}>
							{parentTask ? 'Add Sub-task' : 'Create New Task'}
						</Typography>
						<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
							{parentTask ? `Under "${parentTask.title}"` : 'Quickly add a task to this project'}
						</Typography>
					</Stack>
					<IconButton
						onClick={onClose}
						disabled={submitting}
						size="small"
						sx={{
							color: 'text.secondary',
							bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
							'&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) },
						}}
					>
						<CloseOutlined fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			<DialogContent sx={{ px: 3, pb: 3, pt: '24px !important' }}>
				<Stack spacing={2.75}>
					{/* Title Input */}
					<TextField
						label="What needs to be done?"
						placeholder="Task title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
						fullWidth
						error={!!titleError}
						helperText={titleError}
						autoFocus
						variant="outlined"
						InputProps={{
							sx: {
								fontSize: '0.95rem',
								fontWeight: 600,
								borderRadius: '10px',
							},
						}}
					/>

					{/* Description Input */}
					<TextField
						label="Description (optional)"
						placeholder="Add more details about this task..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						fullWidth
						multiline
						rows={3}
						variant="outlined"
						InputProps={{
							sx: {
								fontSize: '0.875rem',
								borderRadius: '10px',
							},
						}}
					/>

					{/* Status Selector */}
					<Stack spacing={1}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
							Stage
						</Typography>
						<Stack direction="row" flexWrap="wrap" gap={1}>
							{statuses.map((s) =>
								selectableChip({
									key: s.id,
									label: s.name,
									color: s.color,
									isSelected: s.id === statusId,
									onClick: () => setStatusId(s.id),
								})
							)}
						</Stack>
					</Stack>

					{/* Priority Selector */}
					<Stack spacing={1}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
							Priority
						</Typography>
						<Stack direction="row" flexWrap="wrap" gap={1}>
							{PRIORITIES.map((p) =>
								selectableChip({
									key: p.value,
									label: p.label,
									color: p.color,
									isSelected: p.value === priority,
									onClick: () => setPriority(p.value),
								})
							)}
						</Stack>
					</Stack>

					{/* Assignee Card */}
					<Stack spacing={1}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
							Assignee
						</Typography>
						<Box
							onClick={(e) => setAssigneeAnchor(e.currentTarget)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								p: 1.25,
								borderRadius: '10px',
								cursor: 'pointer',
								border: '1px solid',
								borderColor,
								bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
								'&:hover': {
									bgcolor: hoverBg,
									borderColor: 'primary.main',
								},
							}}
						>
							<Stack direction="row" alignItems="center" spacing={1.5}>
								{selectedAssignee ? (
									<Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
										{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
									</Avatar>
								) : (
									<Avatar sx={{ width: 26, height: 26, bgcolor: 'transparent', border: '1px dashed', borderColor: 'text.secondary', color: 'text.secondary' }}>
										<PersonOutline fontSize="small" />
									</Avatar>
								)}
								<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
									{selectedAssignee ? (selectedAssignee.full_name || selectedAssignee.email) : 'Unassigned'}
								</Typography>
							</Stack>
							<ChevronRightOutlined sx={{ fontSize: 18, color: 'text.secondary', transform: assigneeAnchor ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
						</Box>
					</Stack>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2, gap: 1.25, borderTop: '1px solid', borderColor, bgcolor: isDark ? '#161b22' : '#f6f8fa' }}>
				<Button
					onClick={onClose}
					disabled={submitting}
					sx={{
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.85rem',
						borderRadius: '8px',
						color: 'text.primary',
						px: 2.5,
						border: '1px solid',
						borderColor,
						'&:hover': { bgcolor: hoverBg },
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleCreate}
					disabled={submitting || !isValid}
					disableElevation
					sx={{
						color: 'white',
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.85rem',
						px: 3,
						borderRadius: '8px',
					}}
				>
					{parentTask ? 'Add Sub-task' : 'Create Task'}
				</Button>
			</DialogActions>

			{/* Assignee Popover */}
			<Popover
				open={Boolean(assigneeAnchor)}
				anchorEl={assigneeAnchor}
				onClose={() => setAssigneeAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack sx={{ minWidth: 240, py: 0.5, maxHeight: 300, overflowY: 'auto' }}>
					<Box
						onClick={() => { setAssigneeId(null); setAssigneeAnchor(null); }}
						sx={{
							display: 'flex',
							alignItems: 'center',
							px: 2,
							py: 1.25,
							cursor: 'pointer',
							bgcolor: assigneeId === null ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
							'&:hover': { bgcolor: hoverBg },
						}}
					>
						<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontWeight: 600 }}>
							Unassigned
						</Typography>
					</Box>
					{owners.map((o) => (
						<Box
							key={o.id}
							onClick={() => { setAssigneeId(o.id); setAssigneeAnchor(null); }}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
								px: 2,
								py: 1,
								cursor: 'pointer',
								bgcolor: o.id === assigneeId ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: hoverBg },
							}}
						>
							<Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 700 }}>
								{(o.full_name || o.email)[0]?.toUpperCase()}
							</Avatar>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{o.full_name || o.email}
							</Typography>
						</Box>
					))}
				</Stack>
			</Popover>
		</Dialog>
	);
};

export default ProjectTaskCreateDialog;
