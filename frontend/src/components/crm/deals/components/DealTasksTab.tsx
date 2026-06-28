import React, { useState } from 'react';
import {
	Box, Typography, Stack, Chip, LinearProgress, TextField, MenuItem,
	Button, IconButton, Tooltip, CircularProgress, useTheme, alpha,
	Collapse,
} from '@mui/material';
import {
	CheckCircle, RadioButtonUnchecked, Delete, Add, ExpandMore, ExpandLess,
	Assignment, Description, Groups, Call, RateReview, FactCheck,
	Schedule, WarningAmber,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createDealTask, updateDealTask, deleteDealTask } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Deal } from '../../../../models/crm/deal';
import type { DealTask, DealTaskStatus, DealTaskType } from '../../../../models/crm/dealTask';

interface DealTasksTabProps {
	deal: Deal;
}

const TASK_TYPE_OPTIONS: { value: DealTaskType; label: string }[] = [
	{ value: 'document', label: 'Document' },
	{ value: 'meeting', label: 'Meeting' },
	{ value: 'call', label: 'Call' },
	{ value: 'action', label: 'Action' },
	{ value: 'review', label: 'Review' },
	{ value: 'other', label: 'Other' },
];

const STATUS_FILTERS: { value: DealTaskStatus | 'all' | 'overdue'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'overdue', label: 'Overdue' },
	{ value: 'completed', label: 'Completed' },
];

const getTaskTypeIcon = (type: DealTaskType) => {
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

const getTaskTypeColor = (type: DealTaskType): string => {
	const map: Record<DealTaskType, string> = {
		document: '#2196F3',
		meeting: '#9C27B0',
		call: '#4CAF50',
		action: '#FF9800',
		review: '#00BCD4',
		other: '#9E9E9E',
	};
	return map[type];
};

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const DealTasksTab: React.FC<DealTasksTabProps> = ({ deal }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const { dealTasks, dealTasksLoading, dealTaskMutating, owners } = useAppSelector((s) => s.crm);

	const [statusFilter, setStatusFilter] = useState<DealTaskStatus | 'all' | 'overdue'>('all');
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [addOpen, setAddOpen] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const [newType, setNewType] = useState<DealTaskType>('document');
	const [newDueDate, setNewDueDate] = useState('');
	const [newAssignee, setNewAssignee] = useState<number | ''>('');
	const [newNotes, setNewNotes] = useState('');

	const completedCount = dealTasks.filter((t) => t.status === 'completed').length;
	const totalCount = dealTasks.length;
	const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

	const filteredTasks = dealTasks.filter((t) => {
		if (statusFilter === 'all') return true;
		if (statusFilter === 'overdue') return isOverdue(t);
		return t.status === statusFilter;
	});

	const handleToggleComplete = async (task: DealTask) => {
		const newStatus: DealTaskStatus = task.status === 'completed' ? 'pending' : 'completed';
		try {
			await dispatch(updateDealTask({ taskPublicId: task.public_id, payload: { status: newStatus } })).unwrap();
		} catch {
			toast.error('Failed to update task');
		}
	};

	const handleDelete = async (task: DealTask) => {
		try {
			await dispatch(deleteDealTask(task.public_id)).unwrap();
			toast.success('Task deleted');
		} catch {
			toast.error('Failed to delete task');
		}
	};

	const handleAddTask = async () => {
		if (!newTitle.trim()) return;
		try {
			await dispatch(createDealTask({
				dealPublicId: deal.public_id,
				payload: {
					title: newTitle.trim(),
					task_type: newType,
					due_date: newDueDate || undefined,
					assignee_id: newAssignee || undefined,
					notes: newNotes.trim() || undefined,
				},
			})).unwrap();
			toast.success('Task added');
			setNewTitle('');
			setNewType('document');
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

	if (dealTasksLoading) {
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

			{/* Filters */}
			<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
				{STATUS_FILTERS.map((f) => {
					const isActive = statusFilter === f.value;
					const count = f.value === 'all'
						? totalCount
						: f.value === 'overdue'
							? dealTasks.filter(isOverdue).length
							: dealTasks.filter((t) => t.status === f.value).length;
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

			{/* Add task */}
			{!addOpen ? (
				<Button
					startIcon={<Add />}
					onClick={() => setAddOpen(true)}
					variant="outlined"
					size="small"
					sx={{
						borderRadius: '10px',
						textTransform: 'none',
						fontWeight: 600,
						fontSize: '0.82rem',
						alignSelf: 'flex-start',
						borderStyle: 'dashed',
						borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
						color: 'text.secondary',
						'&:hover': { borderStyle: 'solid', color: 'primary.main', borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) },
					}}
				>
					Add Task
				</Button>
			) : (
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
							placeholder="e.g. MOU Preparation"
							slotProps={{ htmlInput: { maxLength: 255 } }}
						/>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
							<TextField
								select
								label="Type"
								value={newType}
								onChange={(e) => setNewType(e.target.value as DealTaskType)}
								size="small"
								sx={{ minWidth: 130 }}
							>
								{TASK_TYPE_OPTIONS.map((o) => (
									<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
								))}
							</TextField>
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DatePicker
									label="Due Date"
									format="DD/MMM/YYYY"
									value={newDueDate ? dayjs(newDueDate) : null}
									onChange={(newValue) => setNewDueDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
									slotProps={{
										textField: {
											size: 'small',
											fullWidth: true,
										}
									}}
								/>
							</LocalizationProvider>
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
								disabled={!newTitle.trim() || dealTaskMutating}
								sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', minWidth: 80 }}
							>
								{dealTaskMutating ? <CircularProgress size={16} color="inherit" /> : 'Add'}
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
							? 'Add tasks to track deliverables like document preparation, meetings, and agreements.'
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
						return (
							<Box
								key={task.public_id}
								sx={{
									...fc,
									p: 0,
									overflow: 'hidden',
									transition: 'box-shadow 0.2s',
									'&:hover': { boxShadow: theme.shadows[2] },
									borderLeft: '3px solid ' + (isCompleted ? theme.palette.success.main : overdue ? theme.palette.error.main : typeColor),
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
											{task.status === 'in_progress' && !isCompleted && (
												<Chip
													label="In Progress"
													size="small"
													sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha('#FF9800', 0.12), color: '#FF9800', '& .MuiChip-label': { px: 0.75 } }}
												/>
											)}
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
		</Box>
	);
};

export default DealTasksTab;
