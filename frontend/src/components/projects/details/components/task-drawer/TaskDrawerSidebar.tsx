import React, { useState } from 'react';
import {
	Box,
	Stack,
	Typography,
	IconButton,
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
	CalendarMonthOutlined,
	ScheduleOutlined,
	AttachMoneyOutlined,
	SettingsOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import { DatePicker } from '../../../../common/form';
import { TaskTagsInput } from '../../forms/TaskTagsInput';

const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#4CAF50' },
	{ value: 'medium', label: 'Medium', color: '#2196F3' },
	{ value: 'high', label: 'High', color: '#FF9800' },
	{ value: 'urgent', label: 'Urgent', color: '#F44336' },
];

interface TaskDrawerSidebarProps {
	task: ProjectTask;
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
}

export const TaskDrawerSidebar: React.FC<TaskDrawerSidebarProps> = ({
	task,
	owners,
	existingTags,
	onUpdateField,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [popover, setPopover] = useState<{ key: string; anchorEl: HTMLElement } | null>(null);

	const openPopover = (key: string) => (e: React.MouseEvent<HTMLElement>) => {
		setPopover({ key, anchorEl: e.currentTarget });
	};
	const closePopover = () => setPopover(null);

	const selectedAssignee = owners.find((o) => o.id === task.assignee_id) || null;
	const selectedPriority = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[1];

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	// Renders a property row in the sheet
	const PropertyRow = ({
		label,
		icon,
		valueElement,
		popoverKey,
	}: {
		label: string;
		icon: React.ReactNode;
		valueElement: React.ReactNode;
		popoverKey: string;
	}) => (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
				<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
					{label}
				</Typography>
				<IconButton size="small" onClick={openPopover(popoverKey)} sx={{ color: 'text.secondary', opacity: 0.7, '&:hover': { opacity: 1 } }}>
					<SettingsOutlined fontSize="inherit" />
				</IconButton>
			</Stack>
			<Box
				onClick={openPopover(popoverKey)}
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
					p: 1.25,
					borderRadius: '10px',
					cursor: 'pointer',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
					transition: 'all 0.2s',
					'&:hover': {
						bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
						borderColor: 'primary.main',
					},
				}}
			>
				{icon}
				{valueElement}
			</Box>
		</Box>
	);

	return (
		<Box
			sx={{
				width: { xs: '100%', md: '280px', lg: '320px' },
				p: 3.5,
				bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
				borderLeft: { md: '1px solid' },
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
			}}
		>
			{/* Assignees */}
			<PropertyRow
				label="Assignees"
				popoverKey="assignee"
				icon={
					selectedAssignee ? (
						<Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
							{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
						</Avatar>
					) : (
						<Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent', border: '1.5px dashed', borderColor: 'text.secondary', color: 'text.secondary' }}>
							<PersonOutline fontSize="inherit" style={{ fontSize: 14 }} />
						</Avatar>
					)
				}
				valueElement={
					<Typography variant="body2" sx={{ fontWeight: 600, color: selectedAssignee ? 'text.primary' : 'text.secondary', fontStyle: selectedAssignee ? 'normal' : 'italic' }}>
						{selectedAssignee ? (selectedAssignee.full_name || selectedAssignee.email) : 'No assignee'}
					</Typography>
				}
			/>

			{/* Priority */}
			<PropertyRow
				label="Priority"
				popoverKey="priority"
				icon={dotIcon(selectedPriority.color)}
				valueElement={
					<Typography variant="body2" sx={{ fontWeight: 700, color: selectedPriority.color }}>
						{selectedPriority.label}
					</Typography>
				}
			/>

			{/* Labels (Tags) */}
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
						Labels
					</Typography>
					<IconButton size="small" onClick={openPopover('tags')} sx={{ color: 'text.secondary', opacity: 0.7, '&:hover': { opacity: 1 } }}>
						<SettingsOutlined fontSize="inherit" />
					</IconButton>
				</Stack>
				{task.tags && task.tags.length > 0 ? (
					<Stack
						direction="row"
						flexWrap="wrap"
						gap={0.75}
						onClick={openPopover('tags')}
						sx={{
							p: 1.25,
							borderRadius: '10px',
							cursor: 'pointer',
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
							bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
							'&:hover': {
								bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
								borderColor: 'primary.main',
							},
						}}
					>
						{task.tags.map((t) => (
							<Box
								key={t.name}
								sx={{
									px: 1.25,
									py: 0.25,
									bgcolor: alpha(t.color, 0.12),
									color: t.color,
									border: '1px solid',
									borderColor: t.color,
									borderRadius: '100px',
									fontSize: '0.75rem',
									fontWeight: 700,
								}}
							>
								{t.name}
							</Box>
						))}
					</Stack>
				) : (
					<Box
						onClick={openPopover('tags')}
						sx={{
							p: 1.5,
							borderRadius: '10px',
							cursor: 'pointer',
							border: '1px dashed',
							borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
							bgcolor: 'background.paper',
							textAlign: 'center',
							transition: 'all 0.2s',
							'&:hover': { borderColor: 'primary.main', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
						}}
					>
						<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
							None yet
						</Typography>
					</Box>
				)}
			</Box>

			<Divider />

			{/* Start Date */}
			<PropertyRow
				label="Start Date"
				popoverKey="startDate"
				icon={<CalendarMonthOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />}
				valueElement={
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{task.start_date ? dayjs(task.start_date).format('MMM D, YYYY') : 'Choose a date'}
					</Typography>
				}
			/>

			{/* Due Date */}
			<PropertyRow
				label="Due Date"
				popoverKey="dueDate"
				icon={<CalendarMonthOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />}
				valueElement={
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{task.due_date ? dayjs(task.due_date).format('MMM D, YYYY') : 'Choose a date'}
					</Typography>
				}
			/>

			{/* Estimate Hours */}
			<PropertyRow
				label="Estimate Hours"
				popoverKey="estimatedHours"
				icon={<ScheduleOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />}
				valueElement={
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{task.estimated_hours != null ? `${task.estimated_hours} Hours` : 'Not set'}
					</Typography>
				}
			/>

			{/* Billing Type */}
			<PropertyRow
				label="Billing"
				popoverKey="billingType"
				icon={<AttachMoneyOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />}
				valueElement={
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{task.billing_type === 'billable' ? 'Billable' : 'Non-billable'}
					</Typography>
				}
			/>

			{/* POPPOVERS */}
			{/* Assignee Picker */}
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
							onClick={() => { onUpdateField({ assignee_id: o.id }); closePopover(); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2.25, py: 1.25, cursor: 'pointer',
								bgcolor: o.id === task.assignee_id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
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

			{/* Priority Picker */}
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
								'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
							}}
						>
							{dotIcon(p.color)}
							<Typography variant="body2" sx={{ fontWeight: 600 }}>{p.label}</Typography>
						</Box>
					))}
				</Stack>
			</Popover>

			{/* Start Date */}
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

			{/* Due Date */}
			<Popover
				open={popover?.key === 'dueDate'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker label="Due Date" value={task.due_date || null} onChange={(v) => { onUpdateField({ due_date: v || undefined }); closePopover(); }} format="DD-MMM-YYYY" minDate={task.start_date || undefined} />
				</Box>
			</Popover>

			{/* Estimate Hours */}
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

			{/* Billing */}
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
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>Billable</Typography>
					</Box>
					<Box
						onClick={() => { onUpdateField({ billing_type: 'non_billable' }); closePopover(); }}
						sx={{
							px: 2.25, py: 1.25, cursor: 'pointer',
							bgcolor: task.billing_type === 'non_billable' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>Non-billable</Typography>
					</Box>
				</Stack>
			</Popover>

			{/* Tags */}
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
		</Box>
	);
};

export default TaskDrawerSidebar;
