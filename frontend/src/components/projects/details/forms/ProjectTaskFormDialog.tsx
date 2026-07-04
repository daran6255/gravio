import React, { useState } from 'react';
import {
	Box,
	Stack,
	TextField,
	Typography,
	Button,
	IconButton,
	Tooltip,
	Popover,
	CircularProgress,
	useTheme,
	alpha,
	Avatar,
	Grid,
} from '@mui/material';
import {
	NotificationsActiveOutlined,
	PersonOutline,
	FlagOutlined,
	CalendarMonthOutlined,
	ScheduleOutlined,
	LocalOfferOutlined,
	AttachMoneyOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { BaseDialog } from '../../../common/dialogbox';
import { RichTextEditor, DatePicker } from '../../../common/form';
import { SetReminderDialog } from '../../../crm/shared';
import useToast from '../../../../hooks/useToast';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag, BillingType } from '../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { MetaPill } from './MetaPill';
import { TaskTagsInput } from './TaskTagsInput';

const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#4CAF50' },
	{ value: 'medium', label: 'Medium', color: '#2196F3' },
	{ value: 'high', label: 'High', color: '#FF9800' },
	{ value: 'urgent', label: 'Urgent', color: '#F44336' },
];

type PopoverKey = 'status' | 'priority' | 'assignee' | 'startDate' | 'dueDate' | 'estimatedHours' | 'billingType' | 'tags';

interface ProjectTaskFormDialogProps {
	open: boolean;
	onClose: () => void;
	task?: ProjectTask | null;
	parentTask?: ProjectTask | null;
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	/** Tags already used elsewhere in this project, offered as reusable suggestions. */
	existingTags: ProjectTaskTag[];
	submitting: boolean;
	onSubmit: (payload: ProjectTaskCreate | ProjectTaskUpdate) => Promise<void>;
}

export const ProjectTaskFormDialog: React.FC<ProjectTaskFormDialogProps> = ({
	open, onClose, task, parentTask, statuses, owners, existingTags, submitting, onSubmit,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const isEdit = !!task;

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [statusId, setStatusId] = useState<number | ''>('');
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [assigneeId, setAssigneeId] = useState<number | null>(null);
	const [dueDate, setDueDate] = useState<string | null>(null);
	const [startDate, setStartDate] = useState<string | null>(null);
	const [estimatedHours, setEstimatedHours] = useState('');
	const [actualHours, setActualHours] = useState('');
	const [billingType, setBillingType] = useState<BillingType>('billable');
	const [tags, setTags] = useState<ProjectTaskTag[]>([]);
	const [touched, setTouched] = useState(false);
	const [reminderOpen, setReminderOpen] = useState(false);
	const [popover, setPopover] = useState<{ key: PopoverKey; anchorEl: HTMLElement } | null>(null);

	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setTitle(task?.title || '');
			setDescription(task?.description || '');
			setStatusId(task?.status_id ?? '');
			setPriority(task?.priority || 'medium');
			setAssigneeId(task?.assignee_id ?? null);
			setDueDate(task?.due_date || null);
			setStartDate(task?.start_date || null);
			setEstimatedHours(task?.estimated_hours != null ? String(task.estimated_hours) : '');
			setActualHours(task?.actual_hours != null ? String(task.actual_hours) : '');
			setBillingType(task?.billing_type || 'billable');
			setTags(task?.tags || []);
			setTouched(false);
		}
	}

	const titleError = touched && !title.trim() ? 'Title is required' : '';
	const isValid = !!title.trim();
	const selectedAssignee = owners.find((o) => o.id === assigneeId) || null;
	const selectedStatus = statuses.find((s) => s.id === statusId);
	const selectedPriority = PRIORITIES.find((p) => p.value === priority)!;

	const openPopover = (key: PopoverKey) => (e: React.MouseEvent<HTMLElement>) => setPopover({ key, anchorEl: e.currentTarget });
	const closePopover = () => setPopover(null);

	const handleSave = async () => {
		setTouched(true);
		if (!isValid) return;
		try {
			await onSubmit({
				title: title.trim(),
				description: description.trim() || undefined,
				status_id: statusId || undefined,
				priority,
				assignee_id: assigneeId ?? undefined,
				due_date: dueDate || undefined,
				start_date: startDate || undefined,
				estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
				actual_hours: actualHours ? Number(actualHours) : undefined,
				billing_type: billingType,
				tags: tags.length ? tags : undefined,
			});
		} catch (err: any) {
			toast.error(err || 'Failed to save task');
		}
	};

	const dotIcon = (color: string) => <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />;

	const startDateLabel = startDate ? `Start: ${dayjs(startDate).format('MMM D')}` : 'Start Date';
	const dueDateLabel = dueDate ? `Due: ${dayjs(dueDate).format('MMM D')}` : 'Due Date';
	const tagsLabel = tags.length ? `${tags.length} tag${tags.length === 1 ? '' : 's'}` : 'Tags';

	const title_ = parentTask ? 'Edit Sub-task' : 'Edit Task';
	const subtitle = task?.title || '';

	return (
		<>
			<BaseDialog
				open={open}
				onClose={onClose}
				title={title_}
				subtitle={subtitle}
				maxWidth="sm"
				loading={submitting}
				actions={
					<>
						{isEdit && (
							<Tooltip title="Set Reminder">
								<IconButton
									onClick={() => setReminderOpen(true)}
									sx={{ mr: 'auto', color: 'text.secondary' }}
								>
									<NotificationsActiveOutlined fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
						<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
							Cancel
						</Button>
						<Button
							variant="contained"
							onClick={handleSave}
							disabled={submitting}
							sx={{
								color: 'white', textTransform: 'none', fontWeight: 700, px: 4, minWidth: 140, borderRadius: '10px', boxShadow: 'none',
								background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
								'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' },
								'&.Mui-disabled': { background: theme.palette.action.disabledBackground },
							}}
						>
							{submitting ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Save Changes' : 'Create'}
						</Button>
					</>
				}
			>
				<Stack spacing={2.5}>
					<TextField
						label="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
						fullWidth
						autoFocus
						error={!!titleError}
						helperText={titleError}
						InputProps={{ sx: { fontSize: '1.1rem', fontWeight: 600 } }}
					/>

					<RichTextEditor
						label="Description"
						value={description}
						onChange={setDescription}
						placeholder="What does this task involve?"
						minHeight={140}
						variant="standard"
					/>

					<Stack direction="row" flexWrap="wrap" gap={1}>
						<MetaPill
							icon={selectedStatus ? dotIcon(selectedStatus.color) : <FlagOutlined sx={{ fontSize: 16 }} />}
							label={selectedStatus?.name || 'Status'}
							active={!!selectedStatus}
							onClick={openPopover('status')}
						/>
						<MetaPill
							icon={dotIcon(selectedPriority.color)}
							label={selectedPriority.label}
							active
							onClick={openPopover('priority')}
						/>
						<MetaPill
							icon={<PersonOutline sx={{ fontSize: 16 }} />}
							label={selectedAssignee ? (selectedAssignee.full_name || selectedAssignee.email) : 'Assignee'}
							active={!!selectedAssignee}
							onClick={openPopover('assignee')}
						/>
						<MetaPill
							icon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
							label={startDateLabel}
							active={!!startDate}
							onClick={openPopover('startDate')}
						/>
						<MetaPill
							icon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
							label={dueDateLabel}
							active={!!dueDate}
							onClick={openPopover('dueDate')}
						/>
						<MetaPill
							icon={<ScheduleOutlined sx={{ fontSize: 16 }} />}
							label={estimatedHours ? `${estimatedHours}h est.` : 'Est. Hours'}
							active={!!estimatedHours}
							onClick={openPopover('estimatedHours')}
						/>
						<MetaPill
							icon={<AttachMoneyOutlined sx={{ fontSize: 16 }} />}
							label={billingType === 'billable' ? 'Billable' : 'Non-billable'}
							active={billingType === 'non_billable'}
							onClick={openPopover('billingType')}
						/>
						<MetaPill
							icon={<LocalOfferOutlined sx={{ fontSize: 16 }} />}
							label={tagsLabel}
							active={tags.length > 0}
							onClick={openPopover('tags')}
						/>
					</Stack>
				</Stack>
			</BaseDialog>

			<Popover
				open={popover?.key === 'status'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Stack sx={{ minWidth: 180, py: 0.5 }}>
					{statuses.map((s) => (
						<Box
							key={s.id}
							onClick={() => { setStatusId(s.id); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, cursor: 'pointer',
								bgcolor: s.id === statusId ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
							}}
						>
							{dotIcon(s.color)}
							<Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
						</Box>
					))}
				</Stack>
			</Popover>

			<Popover
				open={popover?.key === 'priority'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Stack sx={{ minWidth: 160, py: 0.5 }}>
					{PRIORITIES.map((p) => (
						<Box
							key={p.value}
							onClick={() => { setPriority(p.value); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, cursor: 'pointer',
								bgcolor: p.value === priority ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
							}}
						>
							{dotIcon(p.color)}
							<Typography variant="body2" sx={{ fontWeight: 600 }}>{p.label}</Typography>
						</Box>
					))}
				</Stack>
			</Popover>

			<Popover
				open={popover?.key === 'assignee'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Stack sx={{ minWidth: 240, py: 0.5, maxHeight: 300, overflowY: 'auto' }}>
					<Box
						onClick={() => { setAssigneeId(null); closePopover(); }}
						sx={{
							display: 'flex', alignItems: 'center', px: 2, py: 1.25, cursor: 'pointer',
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
							onClick={() => { setAssigneeId(o.id); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, cursor: 'pointer',
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

			<Popover
				open={popover?.key === 'startDate'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker label="Start Date" value={startDate} onChange={(v) => setStartDate(v || null)} format="DD-MMM-YYYY" />
				</Box>
			</Popover>

			<Popover
				open={popover?.key === 'dueDate'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker label="Due Date" value={dueDate} onChange={(v) => setDueDate(v || null)} format="DD-MMM-YYYY" minDate={startDate || undefined} />
				</Box>
			</Popover>

			<Popover
				open={popover?.key === 'estimatedHours'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Stack spacing={1.5} sx={{ p: 2, width: 220 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
						Quick Select
					</Typography>
					<Grid container spacing={1}>
						{[1, 2, 4, 8, 16, 24].map((h) => (
							<Grid size={{ xs: 4 }} key={h}>
								<Button
									variant="outlined"
									size="small"
									fullWidth
									onClick={() => { setEstimatedHours(String(h)); closePopover(); }}
									sx={{
										borderRadius: '100px',
										fontSize: '0.75rem',
										py: 0.5,
										borderColor: estimatedHours === String(h) ? 'primary.main' : 'divider',
										bgcolor: estimatedHours === String(h) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
										color: estimatedHours === String(h) ? 'primary.main' : 'text.primary',
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
						value={estimatedHours}
						onChange={(e) => setEstimatedHours(e.target.value)}
						fullWidth
						size="small"
						autoComplete="off"
						slotProps={{ htmlInput: { min: 0, step: 0.5, autoComplete: 'new-password' } }}
						autoFocus
						onKeyDown={(e) => { if (e.key === 'Enter') closePopover(); }}
					/>
				</Stack>
			</Popover>

			<Popover
				open={popover?.key === 'billingType'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Stack sx={{ minWidth: 160, py: 0.5 }}>
					<Box
						onClick={() => { setBillingType('billable'); closePopover(); }}
						sx={{
							px: 2, py: 1.25, cursor: 'pointer',
							bgcolor: billingType === 'billable' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>Billable</Typography>
					</Box>
					<Box
						onClick={() => { setBillingType('non_billable'); closePopover(); }}
						sx={{
							px: 2, py: 1.25, cursor: 'pointer',
							bgcolor: billingType === 'non_billable' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>Non-billable</Typography>
					</Box>
				</Stack>
			</Popover>

			<Popover
				open={popover?.key === 'tags'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 320 }}>
					<TaskTagsInput value={tags} onChange={setTags} existingTags={existingTags} />
				</Box>
			</Popover>

			{task && (
				<SetReminderDialog
					open={reminderOpen}
					onClose={() => setReminderOpen(false)}
					entityType="project_task"
					entityId={task.id}
					entityLabel={task.title}
					defaultDueDate={task.due_date}
				/>
			)}
		</>
	);
};

export default ProjectTaskFormDialog;
