import React, { useEffect, useState } from 'react';
import {
	Box,
	Stack,
	Typography,
	Button,
	Avatar,
	Collapse,
	IconButton,
	useTheme,
	Menu,
	MenuItem,
	Popover,
	TextField,
	Divider,
	alpha,
} from '@mui/material';
import {
	KeyboardArrowDown,
	CheckCircle,
	RadioButtonUnchecked,
	MoreHoriz,
	NotificationsActive,
	NotificationsNone,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskStatus, ProjectTaskUpdate } from '../../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import type { Reminder } from '../../../../../models/crm/reminder';
import { SetReminderDialog } from '../../../../crm/shared/SetReminderDialog';
import crmService from '../../../../../services/crmService';
import { formatReminderTime, getNextReminderByEntityId } from '../../../../../utils/reminders';

const PRESET_COLORS = ['#FF9800', '#F44336', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#009688', '#3F51B5'];

interface SubtasksListProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	onAddSubtask: (parent: ProjectTask) => void;
	onUpdateSubtask: (subtaskPublicId: string, payload: ProjectTaskUpdate) => Promise<void>;
}

export const SubtasksList: React.FC<SubtasksListProps> = ({
	task,
	tasks,
	statuses,
	owners,
	onAddSubtask,
	onUpdateSubtask,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [expanded, setExpanded] = useState(true);
	const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ anchorEl: HTMLElement, task: ProjectTask } | null>(null);
	const [typePopoverAnchor, setTypePopoverAnchor] = useState<{ anchorEl: HTMLElement, task: ProjectTask } | null>(null);
	const [reminderDialogTask, setReminderDialogTask] = useState<ProjectTask | null>(null);
	const [subtaskReminders, setSubtaskReminders] = useState<Reminder[]>([]);
	const [newTypeName, setNewTypeName] = useState('');

	// Filter Subtasks
	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);

	// Real reminders (delivered via in-app notification + email by the backend
	// scheduler) for every subtask at once, powering each row's bell icon.
	const loadSubtaskReminders = async () => {
		if (subtasks.length === 0) { setSubtaskReminders([]); return; }
		try {
			const res = await crmService.listRemindersForEntities('project_task', subtasks.map((s) => s.id));
			setSubtaskReminders(res);
		} catch {
			// Non-critical for the bell icon indicator.
		}
	};

	useEffect(() => {
		loadSubtaskReminders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subtasks.map((s) => s.id).join(',')]);

	const nextReminderBySubtaskId = getNextReminderByEntityId(subtaskReminders);

	// Determine completed subtasks
	const completedCount = subtasks.filter((st) => {
		const subStatus = statuses.find((s) => s.id === st.status_id);
		return subStatus?.is_done_status;
	}).length;

	// Dynamically gather all task types in the project
	const taskTypes = React.useMemo(() => {
		const typesMap = new Map<string, string>();
		// Seed defaults
		typesMap.set('task', '#FF9800');
		typesMap.set('bug', '#F44336');
		typesMap.set('feature', '#4CAF50');
		typesMap.set('story', '#2196F3');

		tasks.forEach((t) => {
			const tt = t.custom_fields?.task_type;
			if (tt && tt.name && tt.color) {
				typesMap.set(tt.name.toLowerCase(), tt.color);
			}
		});

		return Array.from(typesMap.entries()).map(([name, color]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), color }));
	}, [tasks]);

	const handleToggleCheckbox = async (st: ProjectTask) => {
		const subStatus = statuses.find((s) => s.id === st.status_id) || statuses[0];
		if (subStatus.is_done_status) {
			const todoStatus = statuses.find((s) => !s.is_done_status) || statuses[0];
			await onUpdateSubtask(st.public_id, { status_id: todoStatus.id });
		} else {
			const doneStatus = statuses.find((s) => s.is_done_status) || statuses[statuses.length - 1];
			await onUpdateSubtask(st.public_id, { status_id: doneStatus.id });
		}
	};

	const handleStatusMenuClick = (event: React.MouseEvent<HTMLElement>, st: ProjectTask) => {
		event.stopPropagation();
		setStatusMenuAnchor({ anchorEl: event.currentTarget, task: st });
	};

	const handleStatusMenuClose = () => {
		setStatusMenuAnchor(null);
	};

	const handleSelectStatus = async (statusId: number) => {
		if (statusMenuAnchor) {
			await onUpdateSubtask(statusMenuAnchor.task.public_id, { status_id: statusId });
			setStatusMenuAnchor(null);
		}
	};

	const handleReminderClick = (event: React.MouseEvent<HTMLElement>, st: ProjectTask) => {
		event.stopPropagation();
		setReminderDialogTask(st);
	};

	const handleTypeMenuClick = (event: React.MouseEvent<HTMLElement>, st: ProjectTask) => {
		event.stopPropagation();
		setTypePopoverAnchor({ anchorEl: event.currentTarget, task: st });
	};

	const handleTypePopoverClose = () => {
		setTypePopoverAnchor(null);
		setNewTypeName('');
	};

	const handleSelectType = async (typeName: string, color: string) => {
		if (typePopoverAnchor) {
			await onUpdateSubtask(typePopoverAnchor.task.public_id, {
				custom_fields: {
					...typePopoverAnchor.task.custom_fields,
					task_type: { name: typeName, color }
				}
			});
			setTypePopoverAnchor(null);
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
			{/* Checklist Box Container */}
			<Box
				sx={{
					border: '1px solid',
					borderColor: isDark ? '#30363d' : '#d0d7de',
					borderRadius: '8px',
					overflow: 'hidden',
					bgcolor: isDark ? '#0d1117' : '#ffffff',
				}}
			>
				{/* Collapsible Header Row (Inside the Box) */}
				<Box
					onClick={() => setExpanded(!expanded)}
					sx={{
						px: 2,
						py: 1,
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						bgcolor: isDark ? '#161b22' : '#f6f8fa',
						cursor: 'pointer',
						userSelect: 'none',
						borderBottom: expanded ? '1px solid' : 'none',
						borderColor: isDark ? '#30363d' : '#d0d7de',
					}}
				>
					<KeyboardArrowDown
						sx={{
							fontSize: 16,
							transform: expanded ? 'none' : 'rotate(-90deg)',
							transition: 'transform 0.2s',
							color: 'text.secondary',
						}}
					/>
					<Typography sx={{ fontWeight: 650, fontSize: '0.85rem', color: 'text.primary' }}>
						Sub-tasks
					</Typography>
					
					{/* Completion Badge */}
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.5,
							bgcolor: isDark ? 'rgba(139,124,246,0.15)' : 'rgba(99,102,241,0.1)',
							border: '1px solid',
							borderColor: isDark ? 'rgba(139,124,246,0.3)' : 'rgba(99,102,241,0.2)',
							color: isDark ? '#a78bfa' : '#6366f1',
							px: 1.25,
							py: 0.25,
							borderRadius: '12px',
							fontSize: '0.75rem',
							fontWeight: 600,
						}}
					>
						<CheckCircle style={{ fontSize: 12, color: 'inherit' }} />
						{completedCount} of {subtasks.length}
					</Box>
				</Box>

				{/* Collapsible Body */}
				<Collapse in={expanded}>
					<Box>
						{subtasks.length > 0 ? (
							subtasks.map((st, index) => {
								const subStatus = statuses.find((s) => s.id === st.status_id) || statuses[0];
								const subAssignee = owners.find((o) => o.id === st.assignee_id);
								const isSubDone = subStatus.is_done_status;
								const hasBorderBottom = index < subtasks.length - 1;

								// Get Initials for Assignee Avatar
								const assigneeInitials = subAssignee
									? (subAssignee.full_name || subAssignee.email)
										.split(' ')
										.map((n: string) => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2)
									: 'U';

								return (
									<Box
										key={st.id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											px: 2,
											py: 1,
											borderBottom: hasBorderBottom ? '1px solid' : 'none',
											borderColor: isDark ? '#30363d' : '#d0d7de',
											bgcolor: 'transparent',
											'&:hover': {
												bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
											},
										}}
									>
										{/* Left side: Check icon + Badge + Title + ID */}
										<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0, mr: 2 }}>
											{/* Custom Check circle quick toggle */}
											<IconButton
												size="small"
												onClick={() => handleToggleCheckbox(st)}
												sx={{ p: 0.25, color: isSubDone ? (isDark ? '#3fb950' : '#2da44e') : 'text.secondary' }}
											>
												{isSubDone ? (
													<CheckCircle sx={{ fontSize: 16 }} />
												) : (
													<RadioButtonUnchecked sx={{ fontSize: 16, opacity: 0.5 }} />
												)}
											</IconButton>

											{/* Dynamic Clickable Task Type Capsule Badge */}
											{(() => {
												const currentType = st.custom_fields?.task_type || { name: 'Task', color: '#FF9800' };
												return (
													<Box
														onClick={(e) => handleTypeMenuClick(e, st)}
														sx={{
															display: 'inline-block',
															border: '1px solid',
															borderColor: currentType.color,
															color: currentType.color,
															bgcolor: alpha(currentType.color, 0.08),
															px: 1,
															py: 0.125,
															borderRadius: '10px',
															fontSize: '0.65rem',
															fontWeight: 700,
															letterSpacing: '0.02em',
															textTransform: 'none',
															lineHeight: 1.3,
															cursor: 'pointer',
															userSelect: 'none',
															transition: 'all 0.15s',
															'&:hover': {
																bgcolor: alpha(currentType.color, 0.15),
															}
														}}
													>
														{currentType.name}
													</Box>
												);
											})()}

											{/* Sub-task title & ID */}
											<Typography
												variant="body2"
												noWrap
												sx={{
													fontWeight: 500,
													fontSize: '0.85rem',
													color: isSubDone ? 'text.secondary' : 'text.primary',
													textDecoration: isSubDone ? 'line-through' : 'none',
												}}
											>
												{st.title}
												<Box component="span" sx={{ color: 'text.secondary', fontSize: '0.8rem', ml: 1, textDecoration: 'none', display: 'inline-block' }}>
													#{st.id}
												</Box>
												<Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', ml: 1, fontWeight: 400, textDecoration: 'none', display: 'inline-block' }}>
													• created on {dayjs(st.created_at).format('MMM D, YYYY')}
												</Box>
											</Typography>
										</Stack>

										{/* Right side: Status Dropdown Chip + Assignee Avatar + Options */}
										<Stack direction="row" spacing={1.5} alignItems="center">
											{/* Status Dropdown Chip */}
											<Box
												onClick={(e) => handleStatusMenuClick(e, st)}
												sx={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: 0.5,
													cursor: 'pointer',
													border: '1px solid',
													borderColor: subStatus.color || (isDark ? '#30363d' : '#d0d7de'),
													color: subStatus.color || 'text.secondary',
													bgcolor: alpha(subStatus.color || theme.palette.primary.main, 0.08),
													px: 1,
													py: 0.25,
													borderRadius: '100px',
													fontSize: '0.7rem',
													fontWeight: 600,
													userSelect: 'none',
													transition: 'all 0.15s',
													'&:hover': {
														bgcolor: alpha(subStatus.color || theme.palette.primary.main, 0.15),
													}
												}}
											>
												{subStatus.name}
												<KeyboardArrowDown sx={{ fontSize: 11, ml: 0.15 }} />
											</Box>

											{/* Reminder Bell Icon Button */}
											<IconButton
												size="small"
												onClick={(e) => handleReminderClick(e, st)}
												title={nextReminderBySubtaskId[st.id] ? `Reminds ${formatReminderTime(nextReminderBySubtaskId[st.id].remind_at)}` : 'Set reminder'}
												sx={{ p: 0.25 }}
											>
												{nextReminderBySubtaskId[st.id] ? (
													<NotificationsActive sx={{ fontSize: 15, color: '#FF9800' }} />
												) : (
													<NotificationsNone sx={{ fontSize: 15, color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 1 } }} />
												)}
											</IconButton>

											{subAssignee && (
												<Avatar
													title={subAssignee.full_name || subAssignee.email}
													sx={{
														width: 20,
														height: 20,
														fontSize: '0.65rem',
														fontWeight: 700,
														bgcolor: 'primary.main',
														color: 'white',
													}}
												>
													{assigneeInitials}
												</Avatar>
											)}
											<IconButton size="small" sx={{ color: 'text.secondary', p: 0.25 }}>
												<MoreHoriz fontSize="small" sx={{ fontSize: 16 }} />
											</IconButton>
										</Stack>
									</Box>
								);
							})
						) : (
							<Box sx={{ px: 2.25, py: 2.5, bgcolor: 'transparent' }}>
								<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
									No sub-tasks created yet.
								</Typography>
							</Box>
						)}
					</Box>
				</Collapse>
			</Box>

			{/* Status Selection Menu */}
			<Menu
				anchorEl={statusMenuAnchor?.anchorEl}
				open={Boolean(statusMenuAnchor)}
				onClose={handleStatusMenuClose}
				PaperProps={{
					sx: {
						minWidth: 130,
						border: '1px solid',
						borderColor: isDark ? '#30363d' : '#d0d7de',
						boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.08)',
						bgcolor: isDark ? '#161b22' : '#ffffff',
					}
				}}
			>
				{statuses.map((status) => (
					<MenuItem
						key={status.id}
						onClick={() => handleSelectStatus(status.id)}
						selected={status.id === statusMenuAnchor?.task.status_id}
						sx={{
							fontSize: '0.8rem',
							py: 0.75,
							fontWeight: 500,
							display: 'flex',
							alignItems: 'center',
							gap: 1,
							color: status.color || 'text.primary',
							'&.Mui-selected': {
								bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
								fontWeight: 700,
							}
						}}
					>
						<Box
							sx={{
								width: 8,
								height: 8,
								borderRadius: '50%',
								bgcolor: status.color || 'text.secondary',
							}}
						/>
						{status.name}
					</MenuItem>
				))}
			</Menu>

			{/* Type Selection Popover */}
			<Popover
				open={Boolean(typePopoverAnchor)}
				anchorEl={typePopoverAnchor?.anchorEl}
				onClose={handleTypePopoverClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{
					sx: {
						borderRadius: '10px',
						boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.08)',
						bgcolor: isDark ? '#161b22' : '#ffffff',
						p: 1.5,
					}
				}}
			>
				<Stack sx={{ minWidth: 220, gap: 1.5 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Select Task Type
					</Typography>
					
					<Stack spacing={0.5}>
						{taskTypes.map((t) => {
							const isSelected = (typePopoverAnchor?.task.custom_fields?.task_type?.name || 'Task').toLowerCase() === t.name.toLowerCase();
							return (
								<Box
									key={t.name}
									onClick={() => handleSelectType(t.name, t.color)}
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										px: 1.5,
										py: 0.75,
										borderRadius: '6px',
										cursor: 'pointer',
										bgcolor: isSelected ? alpha(t.color, 0.1) : 'transparent',
										'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
									}}
								>
									<Box
										sx={{
											bgcolor: alpha(t.color, 0.12),
											border: '1px solid',
											borderColor: t.color,
											color: t.color,
											px: 1.25,
											py: 0.25,
											borderRadius: '100px',
											fontSize: '0.7rem',
											fontWeight: 800,
											letterSpacing: '0.03em',
										}}
									>
										{t.name.toUpperCase()}
									</Box>
								</Box>
							);
						})}
					</Stack>

					<Divider />

					{/* Custom Type Creator */}
					<Stack spacing={1}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
							Create Custom Type
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<TextField
								size="small"
								placeholder="e.g. Design, Research"
								value={newTypeName}
								onChange={(e) => setNewTypeName(e.target.value)}
								sx={{
									'& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' }
								}}
							/>
							<Button
								variant="contained"
								size="small"
								onClick={() => {
									if (newTypeName.trim()) {
										const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
										handleSelectType(newTypeName.trim(), color);
										setNewTypeName('');
									}
								}}
								sx={{ textTransform: 'none', fontWeight: 700, px: 2, height: '32px' }}
							>
								Add
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</Popover>

			{/* Create sub-task split button */}
			<Box sx={{ display: 'flex' }}>
				<Box
					sx={{
						display: 'inline-flex',
						borderRadius: '6px',
						border: '1px solid',
						borderColor: isDark ? '#30363d' : '#d0d7de',
						bgcolor: isDark ? '#21262d' : '#f6f8fa',
						overflow: 'hidden',
						'&:hover': {
							borderColor: isDark ? '#8b7cf6' : '#6366f1',
						}
					}}
				>
					<Button
						size="small"
						onClick={() => onAddSubtask(task)}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							fontSize: '0.8rem',
							color: 'text.primary',
							px: 1.5,
							py: 0.5,
							minWidth: 'auto',
							borderRadius: 0,
							border: 'none',
							'&:hover': {
								bgcolor: isDark ? '#30363d' : '#eef2ff',
							}
						}}
					>
						Create sub-task
					</Button>
					<Box sx={{ width: '1px', bgcolor: isDark ? '#30363d' : '#d0d7de' }} />
					<Button
						size="small"
						sx={{
							p: 0.5,
							minWidth: '24px',
							borderRadius: 0,
							color: 'text.primary',
							border: 'none',
							'&:hover': {
								bgcolor: isDark ? '#30363d' : '#eef2ff',
							}
						}}
					>
						<KeyboardArrowDown sx={{ fontSize: 14 }} />
					</Button>
				</Box>
			</Box>

			{/* Subtask Reminder Dialog -- a real reminder (delivered via in-app
			    notification + email by the backend scheduler), not just a stored date. */}
			{reminderDialogTask && (
				<SetReminderDialog
					open={Boolean(reminderDialogTask)}
					onClose={() => {
						setReminderDialogTask(null);
						loadSubtaskReminders();
					}}
					entityType="project_task"
					entityId={reminderDialogTask.id}
					entityLabel={reminderDialogTask.title}
					defaultDueDate={reminderDialogTask.due_date}
				/>
			)}
		</Box>
	);
};

export default SubtasksList;
