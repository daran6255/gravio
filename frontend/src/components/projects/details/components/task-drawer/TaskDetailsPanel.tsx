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
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import type { Reminder } from '../../../../../models/crm/reminder';
import { DatePicker } from '../../../../common/form';
import { TaskTagsInput } from '../../forms/TaskTagsInput';
import { SetReminderDialog } from '../../../../crm/shared/SetReminderDialog';
import crmService from '../../../../../services/crmService';
import { formatReminderTime, isReminderOverdue } from '../../../../../utils/reminders';

const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#4CAF50' },
	{ value: 'medium', label: 'Medium', color: '#2196F3' },
	{ value: 'high', label: 'High', color: '#FF9800' },
	{ value: 'urgent', label: 'Urgent', color: '#F44336' },
];

const PRESET_COLORS = ['#FF9800', '#F44336', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#009688', '#3F51B5'];

interface TaskDetailsPanelProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	projectName: string;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
}

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

	const [newTypeName, setNewTypeName] = useState('');

	const taskTypes = React.useMemo(() => {
		const typesMap = new Map<string, string>();
		// Seed with defaults
		typesMap.set('task', '#FF9800');
		typesMap.set('bug', '#F44336');
		typesMap.set('feature', '#4CAF50');
		typesMap.set('story', '#2196F3');

		// Scan all tasks in project for custom task types
		tasks.forEach((t) => {
			const tt = t.custom_fields?.task_type;
			if (tt && tt.name && tt.color) {
				typesMap.set(tt.name.toLowerCase(), tt.color);
			}
		});

		return Array.from(typesMap.entries()).map(([name, color]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), color }));
	}, [tasks]);

	const hoverBg = isDark ? '#21262d' : '#f3f4f6';
	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#161b22' : '#ffffff';
	const iconChipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)';

	const [popover, setPopover] = useState<{ key: string; anchorEl: HTMLElement } | null>(null);

	const openPopover = (key: string) => (e: React.MouseEvent<HTMLElement>) => {
		setPopover({ key, anchorEl: e.currentTarget });
	};
	const closePopover = () => setPopover(null);

	// Real reminders: a scheduler already delivers these via in-app notification +
	// email (see backend's reminder_scheduler.py) -- fetched locally here (rather
	// than through crm slice) so this summary row doesn't fight over shared redux
	// state with SetReminderDialog's own fetch/clear lifecycle while it's open.
	const [taskReminders, setTaskReminders] = useState<Reminder[]>([]);
	const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

	const loadTaskReminders = async () => {
		try {
			const res = await crmService.listReminders('project_task', task.id);
			setTaskReminders(res);
		} catch {
			// Non-critical for this summary row -- SetReminderDialog surfaces its own errors.
		}
	};

	useEffect(() => {
		loadTaskReminders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [task.id]);

	const nextReminder = taskReminders
		.filter((r) => r.status === 'pending')
		.sort((a, b) => dayjs(a.remind_at).diff(dayjs(b.remind_at)))[0] || null;

	const selectedAssignee = owners.find((o) => o.id === task.assignee_id) || null;
	const selectedStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];
	const selectedPriority = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[1];
	const currentType = task.custom_fields?.task_type || { name: 'Task', color: '#FF9800' };

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
		onRowClick?: () => void;
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
				sx={{ width: 128, flexShrink: 0, color: 'text.secondary', pt: alignTop ? 0.3 : 0 }}
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
						icon: dotIcon(selectedStatus.color),
						label: 'Status',
						popoverKey: 'status',
						children: pillValue(selectedStatus.color, selectedStatus.name, true),
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
						children: (
							<Stack direction="row" spacing={-0.75}>
								{selectedAssignee ? (
									<Avatar sx={{ width: 24, height: 24, border: '2px solid', borderColor: cardBg, fontSize: '0.68rem', fontWeight: 700 }}>
										{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
									</Avatar>
								) : (
									<Avatar sx={{ width: 24, height: 24, border: '2px solid', borderColor: cardBg, bgcolor: 'transparent', color: 'text.secondary' }}>
										<PersonOutline sx={{ fontSize: 14 }} />
									</Avatar>
								)}
							</Stack>
						),
					})}
				</Stack>
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
		</>
	);
};

export default TaskDetailsPanel;
