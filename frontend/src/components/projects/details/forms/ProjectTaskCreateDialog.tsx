import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
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
import type { ProjectTaskCreate, ProjectTaskStatus } from '../../../../models/projects/projectTask';
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
	parentTask?: any | null; // using parent task details if adding subtask
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
		<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: '16px',
					overflow: 'hidden',
					bgcolor: 'background.paper',
					backgroundImage: 'none',
				},
			}}
		>
			{/* Gradient Header */}
			<DialogTitle
				sx={{
					m: 0,
					p: 3,
					background: 'linear-gradient(135deg, #8B7CF6 0%, #4EA8FF 100%)',
					color: 'white',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Stack spacing={0.5}>
					<Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
						{parentTask ? 'Add Sub-task' : 'Create New Task'}
					</Typography>
					<Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
						{parentTask ? `Under "${parentTask.title}"` : 'Quickly add a task to this project'}
					</Typography>
				</Stack>
				<IconButton
					onClick={onClose}
					disabled={submitting}
					sx={{
						color: 'white',
						bgcolor: 'rgba(255, 255, 255, 0.15)',
						'&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
					}}
				>
					<CloseOutlined fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ px: 3, pb: 3, pt: '28px !important' }}>
				<Stack spacing={3}>
					{/* Title Input */}
					<TextField
						label="What needs to be done?"
						placeholder="Task Title"
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
								fontSize: '1.05rem',
								fontWeight: 600,
								borderRadius: '12px',
							},
						}}
					/>

					{/* Description Input */}
					<TextField
						label="Description (Optional)"
						placeholder="Add more details about this task..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						fullWidth
						multiline
						rows={3}
						variant="outlined"
						InputProps={{
							sx: {
								borderRadius: '12px',
							},
						}}
					/>

					{/* Status Selector */}
					<Stack spacing={1}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							Stage
						</Typography>
						<Stack direction="row" flexWrap="wrap" gap={1.25}>
							{statuses.map((s) => {
								const isSelected = s.id === statusId;
								return (
									<Button
										key={s.id}
										onClick={() => setStatusId(s.id)}
										startIcon={dotIcon(s.color)}
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											fontSize: '0.825rem',
											borderRadius: '100px',
											px: 2,
											py: 0.75,
											color: isSelected ? 'white' : 'text.primary',
											bgcolor: isSelected ? s.color : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
											border: '1px solid',
											borderColor: isSelected ? s.color : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
											boxShadow: isSelected ? `0 4px 12px ${alpha(s.color, 0.35)}` : 'none',
											'&:hover': {
												bgcolor: isSelected ? s.color : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
												borderColor: isSelected ? s.color : 'divider',
											},
										}}
									>
										{s.name}
									</Button>
								);
							})}
						</Stack>
					</Stack>

					{/* Priority Selector */}
					<Stack spacing={1}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							Priority
						</Typography>
						<Stack direction="row" flexWrap="wrap" gap={1.25}>
							{PRIORITIES.map((p) => {
								const isSelected = p.value === priority;
								return (
									<Button
										key={p.value}
										onClick={() => setPriority(p.value)}
										startIcon={dotIcon(p.color)}
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											fontSize: '0.825rem',
											borderRadius: '100px',
											px: 2.25,
											py: 0.75,
											color: isSelected ? 'white' : 'text.primary',
											bgcolor: isSelected ? p.color : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
											border: '1px solid',
											borderColor: isSelected ? p.color : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
											boxShadow: isSelected ? `0 4px 12px ${alpha(p.color, 0.35)}` : 'none',
											'&:hover': {
												bgcolor: isSelected ? p.color : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
												borderColor: isSelected ? p.color : 'divider',
											},
										}}
									>
										{p.label}
									</Button>
								);
							})}
						</Stack>
					</Stack>

					{/* Assignee Card */}
					<Stack spacing={1}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							Assignee
						</Typography>
						<Box
							onClick={(e) => setAssigneeAnchor(e.currentTarget)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								p: 1.5,
								borderRadius: '12px',
								cursor: 'pointer',
								border: '1px solid',
								borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
								bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
								'&:hover': {
									bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
									borderColor: 'primary.main',
								},
							}}
						>
							<Stack direction="row" alignItems="center" spacing={1.5}>
								{selectedAssignee ? (
									<Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
										{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
									</Avatar>
								) : (
									<Avatar sx={{ width: 28, height: 28, bgcolor: 'transparent', border: '1px dashed', borderColor: 'text.secondary', color: 'text.secondary' }}>
										<PersonOutline fontSize="small" />
									</Avatar>
								)}
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{selectedAssignee ? (selectedAssignee.full_name || selectedAssignee.email) : 'Select Assignee'}
								</Typography>
							</Stack>
							<ChevronRightOutlined sx={{ color: 'text.secondary', transform: assigneeAnchor ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
						</Box>
					</Stack>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
				<Button
					onClick={onClose}
					disabled={submitting}
					sx={{
						textTransform: 'none',
						fontWeight: 700,
						borderRadius: '10px',
						px: 3,
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleCreate}
					disabled={submitting || !isValid}
					sx={{
						color: 'white',
						textTransform: 'none',
						fontWeight: 700,
						px: 4,
						borderRadius: '10px',
						boxShadow: 'none',
						background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
						'&:hover': {
							boxShadow: '0 4px 12px rgba(139,124,246,0.3)',
						},
						'&.Mui-disabled': {
							background: theme.palette.action.disabledBackground,
						},
					}}
				>
					Create Task
				</Button>
			</DialogActions>

			{/* Assignee Popover */}
			<Popover
				open={Boolean(assigneeAnchor)}
				anchorEl={assigneeAnchor}
				onClose={() => setAssigneeAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
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
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
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
								'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
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
