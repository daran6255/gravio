import React, { useEffect, useState } from 'react';
import {
	Box,
	Stack,
	Typography,
	Avatar,
	Divider,
	Popover,
	TextField,
	useTheme,
	alpha,
	Button,
	Grid,
} from '@mui/material';
import {
	PersonOutline,
	FolderOutlined,
	SellOutlined,
	CategoryOutlined,
	FlagOutlined,
	ScheduleOutlined,
	CalendarTodayOutlined,
	EventOutlined,
	PaidOutlined,
	NotificationsNoneOutlined,
	GroupOutlined,
	AddOutlined,
	WorkspacePremiumOutlined,
	ExtensionOutlined,
	CheckOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import { DatePicker } from '../../../../common/form';
import { TaskTagsInput } from '../../forms/TaskTagsInput';
import { SetReminderDialog } from '../../../../crm/shared/SetReminderDialog';
import { formatReminderTime, isReminderOverdue } from '../../../../../utils/reminders';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchReminders } from '../../../../../store/slices/crmSlice';

interface TaskDetailsPanelProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	projectName: string;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
}

const formatCustomFieldLabel = (str: string) => {
	return str
		.replace(/_/g, ' ')
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({
	task,
	tasks,
	statuses,
	owners,
	existingTags,
	projectName,
	onUpdateField,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();

	const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
		{ value: 'low', label: 'Low', color: theme.palette.success.main },
		{ value: 'medium', label: 'Medium', color: theme.palette.info.main },
		{ value: 'high', label: 'High', color: theme.palette.warning.main },
		{ value: 'urgent', label: 'Urgent', color: theme.palette.error.main },
	];

	const PRESET_COLORS = [
		theme.palette.primary.main,
		theme.palette.secondary.main,
		theme.palette.success.main,
		theme.palette.error.main,
		theme.palette.warning.main,
		theme.palette.info.main,
	];

	const [newTypeName, setNewTypeName] = useState('');
	const [newMilestoneName, setNewMilestoneName] = useState('');
	const [newFieldName, setNewFieldName] = useState('');
	const [newFieldValue, setNewFieldValue] = useState('');
	const [editFieldValue, setEditFieldValue] = useState('');

	const taskTypes = React.useMemo(() => {
		const typesMap = new Map<string, string>();
		typesMap.set('task', theme.palette.warning.main);
		typesMap.set('bug', theme.palette.error.main);
		typesMap.set('feature', theme.palette.success.main);
		typesMap.set('story', theme.palette.info.main);

		tasks.forEach((t) => {
			const tt = t.custom_fields?.task_type;
			if (tt && tt.name && tt.color) {
				typesMap.set(tt.name.toLowerCase(), tt.color);
			}
		});

		return Array.from(typesMap.entries()).map(([name, color]) => ({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			color,
		}));
	}, [tasks, theme]);

	const milestones = React.useMemo(() => {
		const mset = new Set<string>();
		tasks.forEach((t) => {
			if (t.custom_fields?.milestone?.name) {
				mset.add(t.custom_fields.milestone.name);
			}
		});
		return Array.from(mset).map((name) => {
			const t = tasks.find((tk) => tk.custom_fields?.milestone?.name === name);
			return {
				name,
				color: t?.custom_fields?.milestone?.color || theme.palette.primary.main,
			};
		});
	}, [tasks, theme]);

	const userCustomFields = React.useMemo(() => {
		if (!task.custom_fields) return [];
		return Object.entries(task.custom_fields)
			.filter(([key]) => key !== 'task_type' && key !== 'milestone' && key !== 'participants')
			.map(([key, val]) => ({ name: key, value: String(val) }));
	}, [task.custom_fields]);

	const participantIds = React.useMemo<number[]>(() => {
		const ids = new Set<number>();
		
		// 1. Task assignee (owner)
		if (task.assignee_id) {
			ids.add(task.assignee_id);
		}
		
		// 2. Subtask owners (assignees of subtasks)
		const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
		subtasks.forEach((st) => {
			if (st.assignee_id) {
				ids.add(st.assignee_id);
			}
		});
		
		// 3. Manually selected participants
		const manualIds: number[] = task.custom_fields?.participants || [];
		manualIds.forEach((id) => ids.add(id));
		
		return Array.from(ids);
	}, [task.assignee_id, task.id, tasks, task.custom_fields?.participants]);

	const currentParticipants = React.useMemo(() => {
		return owners.filter((o) => participantIds.includes(o.id));
	}, [owners, participantIds]);

	const handleToggleParticipant = async (ownerId: number) => {
		const manualIds: number[] = task.custom_fields?.participants || [];
		const newIds = manualIds.includes(ownerId)
			? manualIds.filter((id) => id !== ownerId)
			: [...manualIds, ownerId];
		
		await onUpdateField({
			custom_fields: {
				...task.custom_fields,
				participants: newIds,
			},
		});
	};

	const hoverBg = theme.palette.action.hover;
	const borderColor = theme.palette.divider;
	const cardBg = theme.palette.background.paper;
	const iconChipBg = theme.palette.action.selected;

	const [popover, setPopover] = useState<{ key: string; anchorEl: HTMLElement; data?: any } | null>(null);

	const openPopover = (key: string, data?: any) => (e: React.MouseEvent<HTMLElement>) => {
		setPopover({ key, anchorEl: e.currentTarget, data });
		if (key === 'editCustomField' && data) {
			setEditFieldValue(String(task.custom_fields?.[data] || ''));
		}
	};
	const closePopover = () => setPopover(null);

	const taskReminders = useAppSelector((state) => state.crm.reminders);
	const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

	const loadTaskReminders = () => {
		dispatch(fetchReminders({ entityType: 'project_task', entityId: task.id }));
	};

	useEffect(() => {
		loadTaskReminders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [task.id, dispatch]);

	const nextReminder = taskReminders
		.filter((r) => r.status === 'pending')
		.sort((a, b) => dayjs(a.remind_at).diff(dayjs(b.remind_at)))[0] || null;

	const selectedAssignee = owners.find((o) => o.id === task.assignee_id) || null;
	const selectedStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];
	const selectedPriority = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[1];
	const currentType = task.custom_fields?.task_type || { name: 'Task', color: theme.palette.warning.main };

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	const pillValue = (color: string, label: string, solid = false) => (
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 0.6,
				px: 1.1,
				py: 0.3,
				borderRadius: '100px',
				fontSize: '0.72rem',
				fontWeight: 700,
				bgcolor: solid ? color : alpha(color, 0.12),
				color: solid ? '#fff' : color,
				border: solid ? 'none' : '1px solid',
				borderColor: solid ? 'transparent' : alpha(color, 0.4),
				letterSpacing: '0.01em',
			}}
		>
			{label}
		</Box>
	);

	// A single property row: icon + label (fixed width) + value (click opens its popover).
	// Called as a plain function (not a JSX component tag) so it isn't re-created as a
	// distinct component identity on every render.
	const renderPropertyRow = ({
		icon,
		label,
		popoverKey,
		onRowClick,
		children,
		alignTop = false,
	}: {
		icon: React.ReactNode;
		label: string;
		popoverKey?: string;
		/** Use instead of popoverKey when the row opens something other than the shared popover (e.g. a dialog). */
		onRowClick?: (e: React.MouseEvent<HTMLElement>) => void;
		children: React.ReactNode;
		alignTop?: boolean;
	}) => {
		const handleClick = onRowClick || (popoverKey ? openPopover(popoverKey) : undefined);
		return (
		<Stack
			key={label}
			direction="row"
			alignItems={alignTop ? 'flex-start' : 'center'}
			onClick={handleClick}
			sx={{
				py: 1,
				px: 1.5,
				gap: 1.25,
				borderRadius: '8px',
				cursor: handleClick ? 'pointer' : 'default',
				transition: 'background-color 0.12s ease',
				'&:hover': handleClick ? { bgcolor: hoverBg } : undefined,
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				spacing={1.1}
				sx={{ width: 115, flexShrink: 0, color: 'text.secondary', pt: alignTop ? 0.3 : 0 }}
			>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 24,
						height: 24,
						borderRadius: '7px',
						bgcolor: iconChipBg,
						fontSize: 14,
						flexShrink: 0,
					}}
				>
					{icon}
				</Box>
				<Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
					{label}
				</Typography>
			</Stack>
			<Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
				{children}
			</Box>
		</Stack>
		);
	};

	const emptyValue = (text: string) => (
		<Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
			<AddOutlined sx={{ fontSize: 15 }} />
			<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
				{text}
			</Typography>
		</Stack>
	);

	return (
		<>
			{/* Details card */}
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
					justifyContent="space-between"
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
						Details
					</Typography>
				</Stack>

				{/* Property list */}
				<Stack sx={{ p: 1 }}>
					{renderPropertyRow({
						icon: <GroupOutlined fontSize="inherit" />,
						label: 'Assignee',
						popoverKey: 'assignee',
						children: selectedAssignee ? (
							<Stack direction="row" alignItems="center" spacing={1}>
								<Avatar sx={{ width: 22, height: 22, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
									{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
								</Avatar>
								<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 600, color: 'text.primary' }}>
									{selectedAssignee.full_name || selectedAssignee.email}
								</Typography>
							</Stack>
						) : (
							emptyValue('Unassigned')
						),
					})}

					{renderPropertyRow({
						// `statuses` can be briefly empty/stale relative to `task` right after a
						// refetch (e.g. an IRIS action updating tasks before the status board
						// re-syncs) -- guard instead of assuming a match always exists.
						icon: dotIcon(selectedStatus?.color || theme.palette.text.secondary),
						label: 'Status',
						popoverKey: 'status',
						children: selectedStatus
							? pillValue(selectedStatus.color, selectedStatus.name, true)
							: emptyValue('No status'),
					})}

					{renderPropertyRow({
						icon: <FlagOutlined fontSize="inherit" />,
						label: 'Priority',
						popoverKey: 'priority',
						children: pillValue(selectedPriority.color, selectedPriority.label),
					})}

					{renderPropertyRow({
						icon: <CategoryOutlined fontSize="inherit" />,
						label: 'Type',
						popoverKey: 'type',
						children: pillValue(currentType.color, currentType.name.toUpperCase()),
					})}

					{renderPropertyRow({
						icon: <SellOutlined fontSize="inherit" />,
						label: 'Labels',
						popoverKey: 'tags',
						alignTop: !!(task.tags && task.tags.length > 0),
						children:
							task.tags && task.tags.length > 0 ? (
								task.tags.map((t) => (
									<Box
										key={t.name}
										sx={{
											px: 1.1,
											py: 0.25,
											bgcolor: alpha(t.color, 0.12),
											color: t.color,
											border: '1px solid',
											borderColor: alpha(t.color, 0.4),
											borderRadius: '100px',
											fontSize: '0.72rem',
											fontWeight: 700,
										}}
									>
										{t.name}
									</Box>
								))
							) : (
								emptyValue('Add labels')
							),
					})}

					<Divider sx={{ my: 1 }} />

					{renderPropertyRow({
						icon: <ScheduleOutlined fontSize="inherit" />,
						label: 'Estimate',
						popoverKey: 'estimatedHours',
						children:
							task.estimated_hours != null ? (
								<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500, color: 'text.primary' }}>
									{task.estimated_hours}h
								</Typography>
							) : (
								emptyValue('Add estimate')
							),
					})}

					{renderPropertyRow({
						icon: <ScheduleOutlined fontSize="inherit" />,
						label: 'Logged',
						popoverKey: 'actualHours',
						children:
							task.actual_hours != null ? (
								<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500, color: 'text.primary' }}>
									{task.actual_hours}h
								</Typography>
							) : (
								emptyValue('Log time')
							),
					})}

					{renderPropertyRow({
						icon: <CalendarTodayOutlined fontSize="inherit" />,
						label: 'Start Date',
						popoverKey: 'startDate',
						children: task.start_date ? (
							<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500, color: 'text.primary' }}>
								{dayjs(task.start_date).format('MMM D, YYYY')}
							</Typography>
						) : (
							emptyValue('Set date')
						),
					})}

					{renderPropertyRow({
						icon: <EventOutlined fontSize="inherit" />,
						label: 'Due Date',
						popoverKey: 'dueDate',
						children: task.due_date ? (
							<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500, color: 'text.primary' }}>
								{dayjs(task.due_date).format('MMM D, YYYY')}
							</Typography>
						) : (
							emptyValue('Set date')
						),
					})}

					{renderPropertyRow({
						icon: <PaidOutlined fontSize="inherit" />,
						label: 'Billing',
						popoverKey: 'billingType',
						children: (
							<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500, color: 'text.primary' }}>
								{task.billing_type === 'billable' ? 'Billable' : 'Non-billable'}
							</Typography>
						),
					})}

					{renderPropertyRow({
						icon: <NotificationsNoneOutlined fontSize="inherit" />,
						label: 'Reminder',
						onRowClick: () => setReminderDialogOpen(true),
						children: nextReminder ? (
							<Typography
								variant="body2"
								sx={{
									fontSize: '0.825rem',
									fontWeight: 600,
									color: isReminderOverdue(nextReminder.remind_at, nextReminder.status) ? 'error.main' : 'primary.main',
								}}
							>
								{formatReminderTime(nextReminder.remind_at)}
							</Typography>
						) : (
							emptyValue('Set reminder')
						),
					})}

					{renderPropertyRow({
						icon: <WorkspacePremiumOutlined fontSize="inherit" />,
						label: 'Milestone',
						popoverKey: 'milestone',
						children: task.custom_fields?.milestone ? (
							pillValue(task.custom_fields.milestone.color, task.custom_fields.milestone.name.toUpperCase())
						) : (
							emptyValue('Add milestone')
						),
					})}

					<Divider sx={{ my: 1 }} />

					{renderPropertyRow({
						icon: <FolderOutlined fontSize="inherit" />,
						label: 'Project',
						children: (
							<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 600, color: 'text.primary' }}>
								{projectName}
							</Typography>
						),
					})}

					{renderPropertyRow({
						icon: <PersonOutline fontSize="inherit" />,
						label: 'Participants',
						popoverKey: 'participants',
						children: (
							<Stack direction="row" spacing={-0.75} alignItems="center">
								{currentParticipants.length > 0 ? (
									currentParticipants.map((p) => (
										<Avatar
											key={p.id}
											title={p.full_name || p.email}
											sx={{
												width: 24,
												height: 24,
												border: '2px solid',
												borderColor: cardBg,
												fontSize: '0.68rem',
												fontWeight: 700,
												bgcolor: 'primary.main',
												color: 'white',
											}}
										>
											{(p.full_name || p.email)[0]?.toUpperCase()}
										</Avatar>
									))
								) : (
									emptyValue('Add participants')
								)}
							</Stack>
						),
					})}

					{userCustomFields.length > 0 && <Divider sx={{ my: 1 }} />}

					{userCustomFields.map((field) => (
						renderPropertyRow({
							icon: <ExtensionOutlined fontSize="inherit" />,
							label: formatCustomFieldLabel(field.name),
							onRowClick: openPopover('editCustomField', field.name),
							children: (
								<Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 500, color: 'text.primary' }}>
									{field.value}
								</Typography>
							),
						})
					))}
				</Stack>

				<Divider />

				{/* Add Custom Field Button */}
				<Box sx={{ p: 1.5, pt: 1, pb: 1.5 }}>
					<Button
						variant="outlined"
						size="small"
						startIcon={<AddOutlined style={{ fontSize: 15 }} />}
						onClick={openPopover('addCustomField')}
						fullWidth
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.8rem',
							borderRadius: '6px',
							color: 'text.secondary',
							borderColor,
							'&:hover': { bgcolor: hoverBg, borderColor },
						}}
					>
						Add custom field
					</Button>
				</Box>
			</Box>

			{/* POPOVERS */}
			{/* Status Picker Popover */}
			<Popover
				open={popover?.key === 'status'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack sx={{ minWidth: 180, py: 0.5 }}>
					{statuses.map((s) => (
						<Box
							key={s.id}
							onClick={() => { onUpdateField({ status_id: s.id }); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2.25, py: 1.25, cursor: 'pointer',
								bgcolor: s.id === task.status_id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								color: s.id === task.status_id ? 'primary.main' : 'text.primary',
								'&:hover': { bgcolor: hoverBg },
							}}
						>
							{dotIcon(s.color)}
							<Typography variant="body2" sx={{ fontWeight: s.id === task.status_id ? 700 : 600, ml: 1 }}>{s.name}</Typography>
						</Box>
					))}
				</Stack>
			</Popover>

			{/* Assignee Picker Popover */}
			<Popover
				open={popover?.key === 'assignee'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack sx={{ minWidth: 240, py: 0.5, maxHeight: 300, overflowY: 'auto' }}>
					<Box
						onClick={() => { onUpdateField({ assignee_id: undefined }); closePopover(); }}
						sx={{
							display: 'flex', alignItems: 'center', px: 2.25, py: 1.25, cursor: 'pointer',
							bgcolor: task.assignee_id === undefined ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
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
							onClick={() => { onUpdateField({ assignee_id: o.id }); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2.25, py: 1.25, cursor: 'pointer',
								bgcolor: o.id === task.assignee_id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
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

			{/* Participants Picker Popover */}
			<Popover
				open={popover?.key === 'participants'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack sx={{ minWidth: 240, py: 0.5, maxHeight: 300, overflowY: 'auto' }}>
					<Box sx={{ px: 2.25, py: 1, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }}>
							Select Participants
						</Typography>
					</Box>
					{owners.map((o) => {
						const isSelected = participantIds.includes(o.id);
						return (
							<Box
								key={o.id}
								onClick={() => handleToggleParticipant(o.id)}
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									px: 2.25,
									py: 1.25,
									cursor: 'pointer',
									bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
									'&:hover': { bgcolor: hoverBg },
								}}
							>
								<Stack direction="row" alignItems="center" spacing={1.5}>
									<Avatar sx={{ width: 24, height: 24, fontSize: '0.72rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
										{(o.full_name || o.email)[0]?.toUpperCase()}
									</Avatar>
									<Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 600 }}>
										{o.full_name || o.email}
									</Typography>
								</Stack>
								{isSelected && <CheckOutlined sx={{ fontSize: 16, color: 'primary.main' }} />}
							</Box>
						);
					})}
				</Stack>
			</Popover>

			{/* Priority Picker Popover */}
			<Popover
				open={popover?.key === 'priority'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack sx={{ minWidth: 160, py: 0.5 }}>
					{PRIORITIES.map((p) => (
						<Box
							key={p.value}
							onClick={() => { onUpdateField({ priority: p.value }); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2.25, py: 1.25, cursor: 'pointer',
								bgcolor: p.value === task.priority ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: hoverBg },
							}}
						>
							{dotIcon(p.color)}
							<Typography variant="body2" sx={{ fontWeight: 600, ml: 1 }}>{p.label}</Typography>
						</Box>
					))}
				</Stack>
			</Popover>

			{/* Start Date Popover */}
			<Popover
				open={popover?.key === 'startDate'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker label="Start Date" value={task.start_date || null} onChange={(v) => { onUpdateField({ start_date: v || undefined }); closePopover(); }} format="DD-MMM-YYYY" />
				</Box>
			</Popover>

			{/* Due Date Popover */}
			<Popover
				open={popover?.key === 'dueDate'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker label="Target Date" value={task.due_date || null} onChange={(v) => { onUpdateField({ due_date: v || undefined }); closePopover(); }} format="DD-MMM-YYYY" minDate={task.start_date || undefined} />
				</Box>
			</Popover>

			{/* Reminder Dialog -- a real reminder (delivered via in-app notification +
			    email by the backend scheduler), not just a stored date. */}
			<SetReminderDialog
				open={reminderDialogOpen}
				onClose={() => {
					setReminderDialogOpen(false);
					loadTaskReminders();
				}}
				entityType="project_task"
				entityId={task.id}
				entityLabel={task.title}
				defaultDueDate={task.due_date}
			/>

			{/* Estimate Hours Popover */}
			<Popover
				open={popover?.key === 'estimatedHours'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack spacing={1.5} sx={{ p: 2, width: 220 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
						Quick Select
					</Typography>
					<Grid container spacing={1}>
						{[1, 2, 4, 8, 16, 24].map((h) => (
							<Grid size={4} key={h}>
								<Button
									variant="outlined"
									size="small"
									fullWidth
									onClick={() => { onUpdateField({ estimated_hours: h }); closePopover(); }}
									sx={{
										borderRadius: '100px',
										fontSize: '0.75rem',
										py: 0.5,
										borderColor: task.estimated_hours === h ? 'primary.main' : 'divider',
										bgcolor: task.estimated_hours === h ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
										color: task.estimated_hours === h ? 'primary.main' : 'text.primary',
									}}
								>
									{h}h
								</Button>
							</Grid>
						))}
					</Grid>
					<TextField
						label="Custom Hours"
						type="number"
						value={task.estimated_hours || ''}
						onChange={(e) => onUpdateField({ estimated_hours: e.target.value ? Number(e.target.value) : undefined })}
						fullWidth
						size="small"
						autoComplete="off"
						slotProps={{ htmlInput: { min: 0, step: 0.5, autoComplete: 'new-password' } }}
						autoFocus
						onKeyDown={(e) => { if (e.key === 'Enter') closePopover(); }}
					/>
				</Stack>
			</Popover>

			{/* Logged / Actual Hours Popover */}
			<Popover
				open={popover?.key === 'actualHours'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack spacing={1.5} sx={{ p: 2, width: 220 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
						Quick Log Time
					</Typography>
					<Grid container spacing={1}>
						{[0.5, 1, 2, 4, 8, 12].map((h) => (
							<Grid size={4} key={h}>
								<Button
									variant="outlined"
									size="small"
									fullWidth
									onClick={() => { onUpdateField({ actual_hours: h }); closePopover(); }}
									sx={{
										borderRadius: '100px',
										fontSize: '0.75rem',
										py: 0.5,
										borderColor: task.actual_hours === h ? 'primary.main' : 'divider',
										bgcolor: task.actual_hours === h ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
										color: task.actual_hours === h ? 'primary.main' : 'text.primary',
									}}
								>
									{h}h
								</Button>
							</Grid>
						))}
					</Grid>
					<TextField
						label="Custom Logged Hours"
						type="number"
						value={task.actual_hours || ''}
						onChange={(e) => onUpdateField({ actual_hours: e.target.value ? Number(e.target.value) : undefined })}
						fullWidth
						size="small"
						autoComplete="off"
						slotProps={{ htmlInput: { min: 0, step: 0.5, autoComplete: 'new-password' } }}
						autoFocus
						onKeyDown={(e) => { if (e.key === 'Enter') closePopover(); }}
					/>
				</Stack>
			</Popover>

			{/* Billing Popover */}
			<Popover
				open={popover?.key === 'billingType'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Stack sx={{ minWidth: 160, py: 0.5 }}>
					<Box
						onClick={() => { onUpdateField({ billing_type: 'billable' }); closePopover(); }}
						sx={{
							px: 2.25, py: 1.25, cursor: 'pointer',
							bgcolor: task.billing_type === 'billable' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
							'&:hover': { bgcolor: hoverBg },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>Billable</Typography>
					</Box>
					<Box
						onClick={() => { onUpdateField({ billing_type: 'non_billable' }); closePopover(); }}
						sx={{
							px: 2.25, py: 1.25, cursor: 'pointer',
							bgcolor: task.billing_type === 'non_billable' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
							'&:hover': { bgcolor: hoverBg },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>Non-billable</Typography>
					</Box>
				</Stack>
			</Popover>

			{/* Tags Popover */}
			<Popover
				open={popover?.key === 'tags'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<Box sx={{ p: 2, width: 320 }}>
					<TaskTagsInput value={task.tags || []} onChange={(newTags: ProjectTaskTag[]) => onUpdateField({ tags: newTags })} existingTags={existingTags} />
				</Box>
			</Popover>

			{/* Type Picker Popover */}
			<Popover
				open={popover?.key === 'type'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', p: 1.5 } }}
			>
				<Stack sx={{ minWidth: 220, gap: 1.5 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Select Task Type
					</Typography>

					<Stack spacing={0.5}>
						{taskTypes.map((t) => {
							const isSelected = (task.custom_fields?.task_type?.name || 'Task').toLowerCase() === t.name.toLowerCase();
							return (
								<Box
									key={t.name}
									onClick={() => {
										onUpdateField({
											custom_fields: {
												...task.custom_fields,
												task_type: { name: t.name, color: t.color }
											}
										});
										closePopover();
									}}
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										px: 1.5,
										py: 1,
										borderRadius: '6px',
										cursor: 'pointer',
										bgcolor: isSelected ? alpha(t.color, 0.1) : 'transparent',
										'&:hover': { bgcolor: hoverBg },
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
										onUpdateField({
											custom_fields: {
												...task.custom_fields,
												task_type: { name: newTypeName.trim(), color }
											}
										});
										setNewTypeName('');
										closePopover();
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

			{/* Milestone Picker Popover */}
			<Popover
				open={popover?.key === 'milestone'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, bgcolor: cardBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', p: 1.5 } }}
			>
				<Stack sx={{ minWidth: 220, gap: 1.5 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Select Milestone
					</Typography>

					<Stack spacing={0.5}>
						{milestones.map((m) => {
							const isSelected = (task.custom_fields?.milestone?.name || '').toLowerCase() === m.name.toLowerCase();
							return (
								<Box
									key={m.name}
									onClick={() => {
										onUpdateField({
											custom_fields: {
												...task.custom_fields,
												milestone: { name: m.name, color: m.color }
											}
										});
										closePopover();
									}}
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										px: 1.5,
										py: 1,
										borderRadius: '6px',
										cursor: 'pointer',
										bgcolor: isSelected ? alpha(m.color, 0.1) : 'transparent',
										'&:hover': { bgcolor: hoverBg },
									}}
								>
									<Box
										sx={{
											bgcolor: alpha(m.color, 0.12),
											border: '1px solid',
											borderColor: m.color,
											color: m.color,
											px: 1.25,
											py: 0.25,
											borderRadius: '100px',
											fontSize: '0.7rem',
											fontWeight: 800,
											letterSpacing: '0.03em',
										}}
									>
										{m.name.toUpperCase()}
									</Box>
									{isSelected && <CheckOutlined sx={{ fontSize: 16, color: 'primary.main' }} />}
								</Box>
							);
						})}
					</Stack>

					<Divider />

					{/* Custom Milestone Creator */}
					<Stack spacing={1}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
							Create Custom Milestone
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<TextField
								size="small"
								placeholder="e.g. Release v1.0"
								value={newMilestoneName}
								onChange={(e) => setNewMilestoneName(e.target.value)}
								sx={{
									'& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' }
								}}
							/>
							<Button
								variant="contained"
								size="small"
								onClick={() => {
									if (newMilestoneName.trim()) {
										const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
										onUpdateField({
											custom_fields: {
												...task.custom_fields,
												milestone: { name: newMilestoneName.trim(), color }
											}
										});
										setNewMilestoneName('');
										closePopover();
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

			{/* Add Custom Field Popover */}
			<Popover
				open={popover?.key === 'addCustomField'}
				anchorEl={popover?.anchorEl}
				onClose={() => { closePopover(); setNewFieldName(''); setNewFieldValue(''); }}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, bgcolor: cardBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', p: 2, width: 240 } }}
			>
				<Stack spacing={2}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Add Custom Field
					</Typography>
					<TextField
						label="Field Name"
						placeholder="e.g. Platform"
						value={newFieldName}
						onChange={(e) => setNewFieldName(e.target.value)}
						fullWidth
						size="small"
					/>
					<TextField
						label="Value"
						placeholder="e.g. Chrome"
						value={newFieldValue}
						onChange={(e) => setNewFieldValue(e.target.value)}
						fullWidth
						size="small"
					/>
					<Button
						variant="contained"
						size="small"
						onClick={() => {
							if (newFieldName.trim() && newFieldValue.trim()) {
								onUpdateField({
									custom_fields: {
										...task.custom_fields,
										[newFieldName.trim()]: newFieldValue.trim()
									}
								});
								setNewFieldName('');
								setNewFieldValue('');
								closePopover();
							}
						}}
						sx={{ textTransform: 'none', fontWeight: 700 }}
						fullWidth
					>
						Add Field
					</Button>
				</Stack>
			</Popover>

			{/* Edit Custom Field Popover */}
			<Popover
				open={popover?.key === 'editCustomField'}
				anchorEl={popover?.anchorEl}
				onClose={() => { closePopover(); setEditFieldValue(''); }}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, bgcolor: cardBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', p: 2, width: 240 } }}
			>
				<Stack spacing={2}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Edit Custom Field: {popover?.data}
					</Typography>
					<TextField
						label="Value"
						value={editFieldValue}
						onChange={(e) => setEditFieldValue(e.target.value)}
						fullWidth
						size="small"
						autoFocus
					/>
					<Stack direction="row" spacing={1}>
						<Button
							variant="outlined"
							color="error"
							size="small"
							onClick={() => {
								if (popover?.data) {
									const updated = { ...task.custom_fields };
									delete updated[popover.data];
									onUpdateField({ custom_fields: updated });
									closePopover();
								}
							}}
							sx={{ textTransform: 'none', fontWeight: 700 }}
							fullWidth
						>
							Delete
						</Button>
						<Button
							variant="contained"
							size="small"
							onClick={() => {
								if (popover?.data && editFieldValue.trim()) {
									onUpdateField({
										custom_fields: {
											...task.custom_fields,
											[popover.data]: editFieldValue.trim()
										}
									});
									closePopover();
								}
							}}
							sx={{ textTransform: 'none', fontWeight: 700 }}
							fullWidth
						>
							Save
						</Button>
					</Stack>
				</Stack>
			</Popover>
		</>
	);
};

export default TaskDetailsPanel;
