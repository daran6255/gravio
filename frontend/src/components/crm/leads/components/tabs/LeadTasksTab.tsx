import React, { useState, useEffect, useMemo } from 'react';
import {
	Box, Typography, Stack, Chip, LinearProgress, TextField, MenuItem,
	Button, IconButton, Tooltip, CircularProgress, useTheme, alpha,
	Collapse, Menu,
} from '@mui/material';
import {
	CheckCircle, RadioButtonUnchecked, Delete, Add, ExpandMore, ExpandLess,
	Assignment, Description, Groups, Call, RateReview, FactCheck,
	Schedule, WarningAmber, NotificationsActiveOutlined,
} from '@mui/icons-material';
import { DatePicker } from '../../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchLeadTasks, createLeadTask, updateLeadTask, deleteLeadTask, fetchActiveReminders } from '../../../../../store/slices/crmSlice';
import useToast from '../../../../../hooks/useToast';
import { SetReminderDialog } from '../../../shared';
import { getNextReminderByEntityId, formatReminderTime } from '../../../../../utils/reminders';
import type { Lead } from '../../../../../models/crm/lead';
import type { LeadTask, LeadTaskStatus, LeadTaskType, LeadTaskPriority } from '../../../../../models/crm/leadTask';

interface LeadTasksTabProps {
	lead: Lead;
}

const TASK_TYPE_OPTIONS: { value: LeadTaskType; label: string }[] = [
	{ value: 'document', label: 'Document' },
	{ value: 'meeting', label: 'Meeting' },
	{ value: 'call', label: 'Call' },
	{ value: 'action', label: 'Action' },
	{ value: 'review', label: 'Review' },
	{ value: 'other', label: 'Other' },
];

const STATUS_FILTERS: { value: LeadTaskStatus | 'all' | 'overdue'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'pending', label: 'Yet to Start' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'blocked', label: 'Blocked' },
	{ value: 'overdue', label: 'Overdue' },
	{ value: 'completed', label: 'Completed' },
];

const BLOCKED_COLOR = '#9C27B0';

const getTaskTypeIcon = (type: LeadTaskType) => {
	const s = { sx: { fontSize: 14 } };
	switch (type) {
		case 'document': return <Description {...s} />;
		case 'meeting': return <Groups {...s} />;
		case 'call': return <Call {...s} />;
		case 'action': return <FactCheck {...s} />;
		case 'review': return <RateReview {...s} />;
		default: return <Assignment {...s} />;
	}
};

const getTaskTypeColor = (type: LeadTaskType): string => {
	const map: Record<LeadTaskType, string> = {
		document: '#2196F3',
		meeting: '#9C27B0',
		call: '#4CAF50',
		action: '#FF9800',
		review: '#00BCD4',
		other: '#9E9E9E',
	};
	return map[type];
};

const getPriorityColor = (priority: LeadTaskPriority): string => {
	const map: Record<LeadTaskPriority, string> = {
		low: '#4CAF50',
		medium: '#2196F3',
		high: '#FF9800',
		urgent: '#F44336',
	};
	return map[priority] || '#9E9E9E';
};

const isOverdue = (task: LeadTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const LeadTasksTab: React.FC<LeadTasksTabProps> = ({ lead }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const { leadTasks, leadTasksLoading, leadTaskMutating, owners, activeReminders } = useAppSelector((s) => s.crm);

	useEffect(() => {
		dispatch(fetchLeadTasks(lead.public_id));
	}, [dispatch, lead.public_id]);

	const taskIds = useMemo(() => leadTasks.map((t) => t.id), [leadTasks]);
	useEffect(() => {
		if (taskIds.length > 0) {
			dispatch(fetchActiveReminders({ entityType: 'lead_task', entityIds: taskIds }));
		}
	}, [dispatch, taskIds]);

	const remindersByTaskId = useMemo(() => getNextReminderByEntityId(activeReminders), [activeReminders]);

	const [statusFilter, setStatusFilter] = useState<LeadTaskStatus | 'all' | 'overdue'>('all');
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [addOpen, setAddOpen] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const [newType, setNewType] = useState<LeadTaskType>('document');
	const [newPriority, setNewPriority] = useState<LeadTaskPriority>('medium');
	const [newDueDate, setNewDueDate] = useState('');
	const [newAssignee, setNewAssignee] = useState<number | ''>('');
	const [newNotes, setNewNotes] = useState('');

	// Popover menu for changing status
	const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
	const [activeMenuTask, setActiveMenuTask] = useState<LeadTask | null>(null);

	const [reminderTask, setReminderTask] = useState<LeadTask | null>(null);

	const handleStatusClick = (event: React.MouseEvent<HTMLDivElement>, task: LeadTask) => {
		setStatusMenuAnchor(event.currentTarget);
		setActiveMenuTask(task);
	};

	const handleStatusClose = () => {
		setStatusMenuAnchor(null);
		setActiveMenuTask(null);
	};

	const handleStatusSelect = async (status: LeadTaskStatus) => {
		if (activeMenuTask) {
			try {
				await dispatch(updateLeadTask({ taskPublicId: activeMenuTask.public_id, payload: { status } })).unwrap();
			} catch {
				toast.error('Failed to update status');
			}
		}
		handleStatusClose();
	};

	const completedCount = leadTasks.filter((t) => t.status === 'completed').length;
	const totalCount = leadTasks.length;
	const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

	const filteredTasks = leadTasks.filter((t) => {
		if (statusFilter === 'all') return true;
		if (statusFilter === 'overdue') return isOverdue(t);
		return t.status === statusFilter;
	});

	const handleToggleComplete = async (task: LeadTask) => {
		const newStatus: LeadTaskStatus = task.status === 'completed' ? 'pending' : 'completed';
		try {
			await dispatch(updateLeadTask({ taskPublicId: task.public_id, payload: { status: newStatus } })).unwrap();
		} catch {
			toast.error('Failed to update task');
		}
	};

	const handleDelete = async (task: LeadTask) => {
		try {
			await dispatch(deleteLeadTask(task.public_id)).unwrap();
			toast.success('Task deleted');
		} catch {
			toast.error('Failed to delete task');
		}
	};

	const handleAddTask = async () => {
		if (!newTitle.trim()) return;
		try {
			await dispatch(createLeadTask({
				leadPublicId: lead.public_id,
				payload: {
					title: newTitle.trim(),
					task_type: newType,
					priority: newPriority,
					due_date: newDueDate || undefined,
					assignee_id: newAssignee || undefined,
					notes: newNotes.trim() || undefined,
				},
			})).unwrap();
			toast.success('Task added');
			setNewTitle('');
			setNewType('document');
			setNewPriority('medium');
			setNewDueDate('');
			setNewAssignee('');
			setNewNotes('');
			setAddOpen(false);
		} catch {
			toast.error('Failed to add task');
		}
	};

	const fc = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.75,
	};

	if (leadTasksLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
				<CircularProgress size={28} />
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{/* Progress */}
			<Box sx={{ ...fc, p: 2 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.07em' }}>
						Task Progress
					</Typography>
					<Typography variant="caption" sx={{ fontWeight: 700, color: progress === 100 ? 'success.main' : 'text.primary' }}>
						{completedCount} / {totalCount} completed
					</Typography>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={progress}
					sx={{
						height: 8,
						borderRadius: 4,
						bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
						'& .MuiLinearProgress-bar': {
							borderRadius: 4,
							bgcolor: progress === 100 ? 'success.main' : 'primary.main',
						},
					}}
				/>
				{progress === 100 && totalCount > 0 && (
					<Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'block', mt: 0.75 }}>
						All tasks completed!
					</Typography>
				)}
			</Box>

			{/* Filters + Add task */}
			<Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
				<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
					{STATUS_FILTERS.map((f) => {
						const isActive = statusFilter === f.value;
						const count = f.value === 'all'
							? totalCount
							: f.value === 'overdue'
								? leadTasks.filter(isOverdue).length
								: leadTasks.filter((t) => t.status === f.value).length;
						return (
							<Chip
								key={f.value}
								label={count > 0 ? `${f.label} (${count})` : f.label}
								size="small"
								onClick={() => setStatusFilter(f.value)}
								sx={{
									borderRadius: '8px',
									fontWeight: 600,
									fontSize: '0.72rem',
									height: 28,
									cursor: 'pointer',
									bgcolor: isActive ? alpha(theme.palette.primary.main, isDark ? 0.22 : 0.1) : 'transparent',
									color: isActive ? 'primary.main' : 'text.secondary',
									border: '1px solid',
									borderColor: isActive ? alpha(theme.palette.primary.main, 0.4) : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
									'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
								}}
							/>
						);
					})}
				</Stack>

				{!addOpen && (
					<Button
						startIcon={<Add />}
						onClick={() => setAddOpen(true)}
						variant="contained"
						size="small"
						sx={{
							borderRadius: '8px',
							textTransform: 'none',
							fontWeight: 700,
							py: 0.5,
							px: 1.5,
							fontSize: '0.75rem',
							flexShrink: 0,
							background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
							boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
						}}
					>
						Add Task
					</Button>
				)}
			</Stack>

			{/* Add task form */}
			{addOpen && (
				<Box sx={{ ...fc, border: '1px solid ' + alpha(theme.palette.primary.main, 0.3), bgcolor: isDark ? 'rgba(33,150,243,0.04)' : 'rgba(33,150,243,0.02)' }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.07em', display: 'block', mb: 1.5 }}>
						New Task
					</Typography>
					<Stack spacing={1.5}>
						<TextField
							label="Task Title"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							size="small"
							fullWidth
							autoFocus
							placeholder="e.g. Qualification Call"
							slotProps={{ htmlInput: { maxLength: 255 } }}
						/>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
							<TextField
								select
								label="Type"
								value={newType}
								onChange={(e) => setNewType(e.target.value as LeadTaskType)}
								size="small"
								sx={{ minWidth: 130 }}
							>
								{TASK_TYPE_OPTIONS.map((o) => (
									<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
								))}
							</TextField>
							<TextField
								select
								label="Priority"
								value={newPriority}
								onChange={(e) => setNewPriority(e.target.value as LeadTaskPriority)}
								size="small"
								sx={{ minWidth: 120 }}
							>
								<MenuItem value="low">Low</MenuItem>
								<MenuItem value="medium">Medium</MenuItem>
								<MenuItem value="high">High</MenuItem>
								<MenuItem value="urgent">Urgent</MenuItem>
							</TextField>
							<DatePicker
								label="Due Date"
								value={newDueDate}
								onChange={(newValue) => setNewDueDate(newValue)}
							/>
						</Stack>
						<TextField
							select
							label="Assignee (optional)"
							value={newAssignee}
							onChange={(e) => setNewAssignee(e.target.value ? Number(e.target.value) : '')}
							size="small"
							fullWidth
						>
							<MenuItem value="">Unassigned</MenuItem>
							{owners.map((o) => (
								<MenuItem key={o.id} value={o.id}>{o.full_name || o.email}</MenuItem>
							))}
						</TextField>
						<TextField
							label="Notes (optional)"
							value={newNotes}
							onChange={(e) => setNewNotes(e.target.value)}
							size="small"
							fullWidth
							multiline
							rows={2}
							placeholder="Additional details..."
						/>
						<Stack direction="row" spacing={1} justifyContent="flex-end">
							<Button size="small" onClick={() => { setAddOpen(false); setNewTitle(''); }} sx={{ textTransform: 'none', fontWeight: 600 }}>
								Cancel
							</Button>
							<Button
								size="small"
								variant="contained"
								onClick={handleAddTask}
								disabled={!newTitle.trim() || leadTaskMutating}
								sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', minWidth: 80 }}
							>
								{leadTaskMutating ? <CircularProgress size={16} color="inherit" /> : 'Add'}
							</Button>
						</Stack>
					</Stack>
				</Box>
			)}

			{/* Tasks */}
			{filteredTasks.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1.5 }}>
					<Box sx={{ width: 56, height: 56, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
						<FactCheck sx={{ fontSize: 26, color: 'text.disabled' }} />
					</Box>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{statusFilter === 'all' ? 'No tasks yet' : 'No matching tasks'}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 260 }}>
						{statusFilter === 'all'
							? 'Add tasks to track follow-ups like qualification calls, document collection, and meetings.'
							: 'Try changing the filter.'}
					</Typography>
				</Box>
			) : (
				<Stack spacing={1}>
					{filteredTasks.map((task) => {
						const overdue = isOverdue(task);
						const isExpanded = expandedId === task.public_id;
						const typeColor = getTaskTypeColor(task.task_type);
						const isCompleted = task.status === 'completed';
						const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : undefined;
						const activeReminder = remindersByTaskId[task.id];
						return (
							<Box
								key={task.public_id}
								sx={{
									...fc,
									p: 0,
									overflow: 'hidden',
									transition: 'box-shadow 0.2s',
									'&:hover': { boxShadow: theme.shadows[2] },
									borderLeft: '3px solid ' + (isCompleted ? theme.palette.success.main : task.status === 'blocked' ? BLOCKED_COLOR : overdue ? theme.palette.error.main : typeColor),
								}}
							>
								<Stack direction="row" alignItems="flex-start" spacing={1} sx={{ p: 1.5 }}>
									<Tooltip title={isCompleted ? 'Mark as pending' : 'Mark as completed'}>
										<IconButton
											size="small"
											onClick={() => handleToggleComplete(task)}
											sx={{ color: isCompleted ? 'success.main' : 'text.disabled', mt: -0.25, flexShrink: 0, '&:hover': { color: 'success.main' } }}
										>
											{isCompleted ? <CheckCircle sx={{ fontSize: 20 }} /> : <RadioButtonUnchecked sx={{ fontSize: 20 }} />}
										</IconButton>
									</Tooltip>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
											<Typography variant="body2" sx={{ fontWeight: 600, color: isCompleted ? 'text.disabled' : 'text.primary', textDecoration: isCompleted ? 'line-through' : 'none', lineHeight: 1.4 }}>
												{task.title}
											</Typography>
											<Chip
												icon={getTaskTypeIcon(task.task_type)}
												label={TASK_TYPE_OPTIONS.find((o) => o.value === task.task_type)?.label || task.task_type}
												size="small"
												sx={{
													height: 20,
													fontSize: '0.65rem',
													fontWeight: 700,
													bgcolor: alpha(typeColor, isDark ? 0.18 : 0.1),
													color: typeColor,
													border: '1px solid ' + alpha(typeColor, 0.3),
													'& .MuiChip-icon': { color: typeColor, fontSize: 12 },
													'& .MuiChip-label': { px: 0.75 },
												}}
											/>
											<Chip
												label={`${task.priority} Priority`}
												size="small"
												sx={{
													height: 20,
													fontSize: '0.65rem',
													fontWeight: 700,
													bgcolor: alpha(getPriorityColor(task.priority), isDark ? 0.18 : 0.1),
													color: getPriorityColor(task.priority),
													border: '1px solid ' + alpha(getPriorityColor(task.priority), 0.3),
													'& .MuiChip-label': { px: 0.75 },
												}}
											/>
											{overdue && (
												<Chip
													icon={<WarningAmber sx={{ fontSize: 12 }} />}
													label="Overdue"
													size="small"
													sx={{
														height: 20,
														fontSize: '0.65rem',
														fontWeight: 700,
														bgcolor: alpha(theme.palette.error.main, isDark ? 0.18 : 0.1),
														color: 'error.main',
														'& .MuiChip-icon': { color: 'error.main', fontSize: 11 },
														'& .MuiChip-label': { px: 0.75 },
													}}
												/>
											)}
											<Chip
												label={
													task.status === 'completed' ? 'Completed'
														: task.status === 'in_progress' ? 'In Progress'
															: task.status === 'blocked' ? 'Blocked'
																: 'Yet to Start'
												}
												size="small"
												onClick={(e) => handleStatusClick(e, task)}
												sx={{
													height: 20,
													fontSize: '0.65rem',
													fontWeight: 700,
													cursor: 'pointer',
													bgcolor: task.status === 'completed'
														? alpha(theme.palette.success.main, isDark ? 0.18 : 0.1)
														: task.status === 'in_progress'
															? alpha('#FF9800', isDark ? 0.18 : 0.1)
															: task.status === 'blocked'
																? alpha(BLOCKED_COLOR, isDark ? 0.18 : 0.1)
																: alpha(theme.palette.text.secondary, isDark ? 0.18 : 0.1),
													color: task.status === 'completed'
														? theme.palette.success.main
														: task.status === 'in_progress'
															? '#FF9800'
															: task.status === 'blocked'
																? BLOCKED_COLOR
																: theme.palette.text.secondary,
													border: '1px solid',
													borderColor: task.status === 'completed'
														? alpha(theme.palette.success.main, 0.3)
														: task.status === 'in_progress'
															? alpha('#FF9800', 0.3)
															: task.status === 'blocked'
																? alpha(BLOCKED_COLOR, 0.3)
																: alpha(theme.palette.text.secondary, 0.3),
													'&:hover': {
														bgcolor: task.status === 'completed'
															? alpha(theme.palette.success.main, 0.25)
															: task.status === 'in_progress'
																? alpha('#FF9800', 0.25)
																: task.status === 'blocked'
																	? alpha(BLOCKED_COLOR, 0.25)
																	: alpha(theme.palette.text.secondary, 0.2),
													}
												}}
											/>
										</Stack>
										<Stack direction="row" spacing={1.5} sx={{ mt: 0.6 }} flexWrap="wrap" useFlexGap>
											{task.due_date && (
												<Stack direction="row" spacing={0.4} alignItems="center">
													<Schedule sx={{ fontSize: 13, color: overdue ? 'error.main' : 'text.disabled' }} />
													<Typography variant="caption" sx={{ color: overdue ? 'error.main' : 'text.secondary', fontWeight: 500 }}>
														{formatDate(task.due_date)}
													</Typography>
												</Stack>
											)}
											{assignee && (
												<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
													{assignee.full_name || assignee.email}
												</Typography>
											)}
											{activeReminder && (
												<Tooltip title="A reminder is set for this task">
													<Stack
														direction="row"
														spacing={0.4}
														alignItems="center"
														sx={{
															px: 0.75,
															py: 0.15,
															borderRadius: '6px',
															bgcolor: alpha(theme.palette.warning.main, isDark ? 0.16 : 0.1),
														}}
													>
														<NotificationsActiveOutlined sx={{ fontSize: 12, color: 'warning.main' }} />
														<Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, fontSize: '0.7rem' }}>
															Reminds {formatReminderTime(activeReminder.remind_at)}
														</Typography>
													</Stack>
												</Tooltip>
											)}
										</Stack>
									</Box>
									<Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
										{task.notes && (
											<Tooltip title={isExpanded ? 'Collapse' : 'Show notes'}>
												<IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : task.public_id)} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
													{isExpanded ? <ExpandLess sx={{ fontSize: 17 }} /> : <ExpandMore sx={{ fontSize: 17 }} />}
												</IconButton>
											</Tooltip>
										)}
										<Tooltip title="Set reminder">
											<IconButton size="small" onClick={() => setReminderTask(task)} sx={{ color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
												<NotificationsActiveOutlined sx={{ fontSize: 16 }} />
											</IconButton>
										</Tooltip>
										<Tooltip title="Delete task">
											<IconButton size="small" onClick={() => handleDelete(task)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
												<Delete sx={{ fontSize: 16 }} />
											</IconButton>
										</Tooltip>
									</Stack>
								</Stack>
								<Collapse in={isExpanded && !!task.notes}>
									<Box sx={{ px: 5.5, pb: 1.5, pt: 0 }}>
										<Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, fontStyle: 'italic' }}>
											{task.notes}
										</Typography>
									</Box>
								</Collapse>
							</Box>
						);
					})}
				</Stack>
			)}
			<Menu
				anchorEl={statusMenuAnchor}
				open={Boolean(statusMenuAnchor)}
				onClose={handleStatusClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
			>
				<MenuItem onClick={() => handleStatusSelect('pending')} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
					Yet to Start (Pending)
				</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('in_progress')} sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF9800' }}>
					In Progress
				</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('blocked')} sx={{ fontSize: '0.8rem', fontWeight: 600, color: BLOCKED_COLOR }}>
					Blocked
				</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('completed')} sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'success.main' }}>
					Completed
				</MenuItem>
			</Menu>
			{reminderTask && (
				<SetReminderDialog
					open={!!reminderTask}
					onClose={() => setReminderTask(null)}
					entityType="lead_task"
					entityId={reminderTask.id}
					entityLabel={reminderTask.title}
					defaultDueDate={reminderTask.due_date}
				/>
			)}
		</Box>
	);
};

export default LeadTasksTab;
