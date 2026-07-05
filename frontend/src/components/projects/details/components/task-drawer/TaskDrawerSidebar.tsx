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
	SettingsOutlined,
	ArrowForwardOutlined,
	ContentCopyOutlined,
	DeleteOutline,
	AutoAwesomeOutlined,
	FolderOutlined,
	ChevronRightOutlined,
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

const PRESET_COLORS = ['#FF9800', '#F44336', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#009688', '#3F51B5'];

interface TaskDrawerSidebarProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	projectName: string;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
	onDelete: () => void;
}

export const TaskDrawerSidebar: React.FC<TaskDrawerSidebarProps> = ({
	task,
	tasks,
	statuses,
	owners,
	existingTags,
	projectName,
	onUpdateField,
	onDelete,
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

	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#161b22' : '#ffffff';
	const hoverBg = isDark ? '#21262d' : '#f3f4f6';

	const [popover, setPopover] = useState<{ key: string; anchorEl: HTMLElement } | null>(null);

	const openPopover = (key: string) => (e: React.MouseEvent<HTMLElement>) => {
		setPopover({ key, anchorEl: e.currentTarget });
	};
	const closePopover = () => setPopover(null);

	const selectedAssignee = owners.find((o) => o.id === task.assignee_id) || null;
	const selectedStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];
	const selectedPriority = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[1];

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	// Renders a row inside the Projects Card
	const CardRow = ({
		label,
		valueElement,
		popoverKey,
	}: {
		label: string;
		valueElement: React.ReactNode;
		popoverKey: string;
	}) => (
		<Stack
			direction="row"
			justifyContent="space-between"
			alignItems="center"
			onClick={openPopover(popoverKey)}
			sx={{
				py: 1,
				px: 1.5,
				cursor: 'pointer',
				borderRadius: '6px',
				'&:hover': { bgcolor: hoverBg },
			}}
		>
			<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
				{label}
			</Typography>
			<Stack direction="row" alignItems="center" spacing={1}>
				{valueElement}
			</Stack>
		</Stack>
	);

	return (
		<Box
			sx={{
				width: '100%',
				p: 3.5,
				bgcolor: isDark ? '#0d1117' : '#f6f8fa',
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
				borderLeft: 'none',
			}}
		>
			{/* Assignees */}
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
						Assignees
					</Typography>
					<IconButton size="small" onClick={openPopover('assignee')} sx={{ color: 'text.secondary' }}>
						<SettingsOutlined fontSize="inherit" />
					</IconButton>
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					spacing={1.5}
					onClick={openPopover('assignee')}
					sx={{
						p: 1.25,
						borderRadius: '10px',
						border: '1px solid',
						borderColor: borderColor,
						bgcolor: 'background.paper',
						cursor: 'pointer',
						'&:hover': { borderColor: 'primary.main', bgcolor: hoverBg },
					}}
				>
					{selectedAssignee ? (
						<>
							<Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
								{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
							</Avatar>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{selectedAssignee.full_name || selectedAssignee.email}
							</Typography>
						</>
					) : (
						<>
							<Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent', border: '1.5px dashed', borderColor: 'text.secondary', color: 'text.secondary' }}>
								<PersonOutline fontSize="inherit" style={{ fontSize: 13 }} />
							</Avatar>
							<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
								No assignee
							</Typography>
						</>
					)}
				</Stack>
			</Box>

			{/* Labels (Tags) */}
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
						Labels
					</Typography>
					<IconButton size="small" onClick={openPopover('tags')} sx={{ color: 'text.secondary' }}>
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
							borderColor: borderColor,
							bgcolor: 'background.paper',
							'&:hover': { borderColor: 'primary.main', bgcolor: hoverBg },
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
							borderColor: borderColor,
							bgcolor: 'background.paper',
							textAlign: 'center',
							transition: 'all 0.2s',
							'&:hover': { borderColor: 'primary.main', bgcolor: hoverBg },
						}}
					>
						<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
							None yet
						</Typography>
					</Box>
				)}
			</Box>

			{/* Type */}
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
						Type
					</Typography>
				</Stack>
				<Box
					onClick={openPopover('type')}
					sx={{
						p: 1.25,
						borderRadius: '10px',
						border: '1px dashed',
						borderColor: borderColor,
						bgcolor: 'background.paper',
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						cursor: 'pointer',
						transition: 'all 0.15s',
						'&:hover': {
							borderColor: 'primary.main',
							bgcolor: hoverBg,
						}
					}}
				>
					{(() => {
						const currentType = task.custom_fields?.task_type || { name: 'Task', color: '#FF9800' };
						return (
							<Box
								sx={{
									bgcolor: alpha(currentType.color, 0.12),
									border: '1px solid',
									borderColor: currentType.color,
									color: currentType.color,
									px: 1.25,
									py: 0.25,
									borderRadius: '100px',
									fontSize: '0.7rem',
									fontWeight: 800,
									letterSpacing: '0.03em',
								}}
							>
								{currentType.name.toUpperCase()}
							</Box>
						);
					})()}
				</Box>
			</Box>

			<Divider />

			{/* Projects card (collapsible structure from screenshot) */}
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
						Projects
					</Typography>
				</Stack>
				
				<Box
					sx={{
						border: '1px solid',
						borderColor: borderColor,
						borderRadius: '10px',
						bgcolor: cardBg,
						overflow: 'hidden',
					}}
				>
					{/* Projects Card Header */}
					<Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: borderColor, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)' }}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<FolderOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2" sx={{ fontWeight: 700 }}>
								{projectName}
							</Typography>
						</Stack>
						<ChevronRightOutlined fontSize="small" sx={{ transform: 'rotate(90deg)', color: 'text.secondary' }} />
					</Box>

					{/* Projects Card Content Rows */}
					<Stack sx={{ p: 1 }}>
						<CardRow
							label="Status"
							popoverKey="status"
							valueElement={
								<Box sx={{ px: 1.25, py: 0.25, bgcolor: selectedStatus.color, color: 'white', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
									{selectedStatus.name}
								</Box>
							}
						/>
						<CardRow
							label="Priority"
							popoverKey="priority"
							valueElement={
								<Box sx={{ px: 1.25, py: 0.25, bgcolor: isDark ? '#281a52' : '#f0ebf8', color: isDark ? '#a371f7' : '#6f42c1', border: '1px solid', borderColor: isDark ? '#4c2889' : '#d1c4e9', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
									{selectedPriority.label}
								</Box>
							}
						/>
						<CardRow
							label="Estimate"
							popoverKey="estimatedHours"
							valueElement={
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{task.estimated_hours != null ? `${task.estimated_hours}h` : '—'}
								</Typography>
							}
						/>
						<CardRow
							label="Start Date"
							popoverKey="startDate"
							valueElement={
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{task.start_date ? dayjs(task.start_date).format('MMM D, YYYY') : '—'}
								</Typography>
							}
						/>
						<CardRow
							label="Target Date"
							popoverKey="dueDate"
							valueElement={
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{task.due_date ? dayjs(task.due_date).format('MMM D, YYYY') : '—'}
								</Typography>
							}
						/>
						<CardRow
							label="Billing"
							popoverKey="billingType"
							valueElement={
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{task.billing_type === 'billable' ? 'Billable' : 'Non-billable'}
								</Typography>
							}
						/>
						<CardRow
							label="Reminder"
							popoverKey="reminder"
							valueElement={
								<Typography variant="body2" sx={{ fontWeight: 600, color: task.custom_fields?.reminder_date ? 'primary.main' : 'text.primary' }}>
									{task.custom_fields?.reminder_date ? dayjs(task.custom_fields.reminder_date).format('MMM D, YYYY') : '—'}
								</Typography>
							}
						/>
					</Stack>
				</Box>
			</Box>

			{/* Participants */}
			<Box>
				<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
					Participants
				</Typography>
				<Stack direction="row" spacing={-0.75}>
					{selectedAssignee ? (
						<Avatar sx={{ width: 28, height: 28, border: '2px solid', borderColor: 'background.paper', fontSize: '0.75rem', fontWeight: 700 }}>
							{(selectedAssignee.full_name || selectedAssignee.email)[0]?.toUpperCase()}
						</Avatar>
					) : (
						<Avatar sx={{ width: 28, height: 28, border: '2px solid', borderColor: 'background.paper', bgcolor: 'transparent', color: 'text.secondary' }}>
							<PersonOutline fontSize="small" />
						</Avatar>
					)}
				</Stack>
			</Box>

			<Divider />

			{/* Actions list */}
			<Stack spacing={1.5}>
				<Button
					onClick={() => {}}
					startIcon={<AutoAwesomeOutlined />}
					sx={{
						justifyContent: 'flex-start',
						textTransform: 'none',
						fontWeight: 600,
						color: 'text.primary',
						fontSize: '0.825rem',
						'&:hover': { bgcolor: hoverBg },
					}}
				>
					Open in GitHub Copilot app
				</Button>
				<Button
					onClick={() => {}}
					startIcon={<ArrowForwardOutlined />}
					sx={{
						justifyContent: 'flex-start',
						textTransform: 'none',
						fontWeight: 600,
						color: 'text.primary',
						fontSize: '0.825rem',
						'&:hover': { bgcolor: hoverBg },
					}}
				>
					Transfer task
				</Button>
				<Button
					onClick={() => {}}
					startIcon={<ContentCopyOutlined />}
					sx={{
						justifyContent: 'flex-start',
						textTransform: 'none',
						fontWeight: 600,
						color: 'text.primary',
						fontSize: '0.825rem',
						'&:hover': { bgcolor: hoverBg },
					}}
				>
					Clone task
				</Button>
				<Button
					onClick={onDelete}
					startIcon={<DeleteOutline />}
					sx={{
						justifyContent: 'flex-start',
						textTransform: 'none',
						fontWeight: 600,
						color: 'error.main',
						fontSize: '0.825rem',
						'&:hover': { bgcolor: isDark ? 'rgba(244,67,54,0.1)' : 'rgba(244,67,54,0.05)' },
					}}
				>
					Delete task
				</Button>
			</Stack>

			{/* POPPOVERS */}
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

			{/* Reminder Picker Popover */}
			<Popover
				open={popover?.key === 'reminder'}
				anchorEl={popover?.anchorEl}
				onClose={closePopover}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker
						label="Reminder Date"
						value={task.custom_fields?.reminder_date || null}
						onChange={(v) => {
							onUpdateField({
								custom_fields: {
									...task.custom_fields,
									reminder_date: v || undefined
								}
							});
							closePopover();
						}}
						format="DD-MMM-YYYY"
					/>
				</Box>
			</Popover>

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
		</Box>
	);
};

export default TaskDrawerSidebar;
