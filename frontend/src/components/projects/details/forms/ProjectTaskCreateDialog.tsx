import React, { useState, useEffect } from 'react';
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
	Tab,
	Tabs,
	Checkbox,
	FormControlLabel,
	Divider,
} from '@mui/material';
import {
	CloseOutlined,
	PersonOutline,
	ArrowBackOutlined,
	SellOutlined,
	CategoryOutlined,
	FlagOutlined,
	CalendarTodayOutlined,
	ScheduleOutlined,
	FormatBold,
	FormatItalic,
	FormatQuote,
	Code,
	Link as LinkIcon,
	AttachFile,
	FormatListNumbered,
	FormatListBulleted,
	PlaylistAddCheck,
	AutoAwesomeOutlined,
	CheckOutlined,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskStatus, ProjectTaskTag } from '../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { DatePicker, RichTextViewer } from '../../../common/form';
import { TaskTagsInput } from './TaskTagsInput';
import dayjs from 'dayjs';

const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#4CAF50' },
	{ value: 'medium', label: 'Medium', color: '#2196F3' },
	{ value: 'high', label: 'High', color: '#FF9800' },
	{ value: 'urgent', label: 'Urgent', color: '#F44336' },
];

const PRESET_COLORS = ['#FF9800', '#F44336', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#009688', '#3F51B5'];

interface ProjectTaskCreateDialogProps {
	open: boolean;
	onClose: () => void;
	parentTask?: ProjectTask | null; // using parent task details if adding subtask
	projectName: string;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	submitting: boolean;
	onSubmit: (payload: ProjectTaskCreate, keepOpen?: boolean) => Promise<void>;
}

export const ProjectTaskCreateDialog: React.FC<ProjectTaskCreateDialogProps> = ({
	open,
	onClose,
	parentTask,
	projectName,
	tasks,
	statuses,
	owners,
	existingTags,
	submitting,
	onSubmit,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#0d1117' : '#ffffff';
	const hoverBg = isDark ? '#21262d' : '#f3f4f6';
	const popupBg = isDark ? '#161b22' : '#ffffff';

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [statusId, setStatusId] = useState<number>(statuses[0]?.id || 0);
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [assigneeId, setAssigneeId] = useState<number | null>(null);
	const [taskType, setTaskType] = useState<{ name: string; color: string }>({ name: 'Task', color: '#FF9800' });
	const [selectedTags, setSelectedTags] = useState<ProjectTaskTag[]>([]);
	const [dueDate, setDueDate] = useState<string | undefined>(undefined);
	const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
	const [createMore, setCreateMore] = useState(false);
	const [touched, setTouched] = useState(false);

	// Tabbed editor states
	const [editTab, setEditTab] = useState(0);
	const [isDescFocused, setIsDescFocused] = useState(false);
	const [newTypeName, setNewTypeName] = useState('');

	// Popover anchors
	const [assigneeAnchor, setAssigneeAnchor] = useState<HTMLElement | null>(null);
	const [labelsAnchor, setLabelsAnchor] = useState<HTMLElement | null>(null);
	const [typeAnchor, setTypeAnchor] = useState<HTMLElement | null>(null);
	const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null);
	const [dueDateAnchor, setDueDateAnchor] = useState<HTMLElement | null>(null);
	const [estimateAnchor, setEstimateAnchor] = useState<HTMLElement | null>(null);
	const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);

	const taskTypes = React.useMemo(() => {
		const typesMap = new Map<string, string>();
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

		return Array.from(typesMap.entries()).map(([name, color]) => ({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			color
		}));
	}, [tasks]);

	useEffect(() => {
		if (open) {
			setTitle('');
			setDescription('');
			setStatusId(statuses[0]?.id || 0);
			setPriority('medium');
			setAssigneeId(null);
			setTaskType({ name: 'Task', color: '#FF9800' });
			setSelectedTags([]);
			setDueDate(undefined);
			setEstimatedHours(undefined);
			setTouched(false);
			setEditTab(0);
		}
	}, [open, statuses]);

	const titleError = touched && !title.trim() ? 'Title is required' : '';
	const isValid = !!title.trim();
	const selectedAssignee = owners.find((o) => o.id === assigneeId) || null;
	const selectedStatus = statuses.find((s) => s.id === statusId) || statuses[0];

	const handleCreate = async () => {
		setTouched(true);
		if (!isValid) return;
		
		const payload: ProjectTaskCreate = {
			title: title.trim(),
			description: description.trim() || undefined,
			status_id: statusId,
			priority,
			assignee_id: assigneeId ?? undefined,
			due_date: dueDate || undefined,
			estimated_hours: estimatedHours,
			tags: selectedTags,
			custom_fields: {
				task_type: taskType
			}
		};

		await onSubmit(payload, createMore);

		if (createMore) {
			setTitle('');
			setDescription('');
			setTouched(false);
			setEditTab(0);
		}
	};

	const insertMarkdown = (syntax: string) => {
		const textarea = document.getElementById('create-task-desc-textarea') as HTMLTextAreaElement;
		if (!textarea) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;
		const selected = text.substring(start, end);
		
		let replacement = '';
		if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
		else if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
		else if (syntax === 'code') replacement = `\`${selected || 'code'}\``;
		else if (syntax === 'quote') replacement = `> ${selected || 'quote'}\n`;
		else if (syntax === 'h') replacement = `### ${selected || 'Heading'}\n`;
		else if (syntax === 'link') replacement = `[${selected || 'link text'}](url)`;
		else if (syntax === 'list') replacement = `- ${selected || 'item'}\n`;
		else if (syntax === 'numlist') replacement = `1. ${selected || 'item'}\n`;
		else if (syntax === 'tasklist') replacement = `- [ ] ${selected || 'task'}\n`;
		
		setDescription(text.substring(0, start) + replacement + text.substring(end));
		
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + replacement.length, start + replacement.length);
		}, 0);
	};

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	const renderMetadataPill = ({
		icon,
		label,
		activeLabel,
		isActive,
		onClick,
		color,
	}: {
		icon: React.ReactNode;
		label: string;
		activeLabel?: string;
		isActive: boolean;
		onClick: (e: React.MouseEvent<HTMLElement>) => void;
		color?: string;
	}) => {
		return (
			<Button
				onClick={onClick}
				startIcon={icon}
				sx={{
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.75rem',
					borderRadius: '6px',
					px: 1.5,
					py: 0.5,
					border: '1px solid',
					borderColor: isActive ? (color || theme.palette.primary.main) : borderColor,
					bgcolor: isActive ? alpha(color || theme.palette.primary.main, 0.08) : 'transparent',
					color: isActive ? (color || 'text.primary') : 'text.secondary',
					'&:hover': {
						bgcolor: isActive ? alpha(color || theme.palette.primary.main, 0.14) : hoverBg,
						borderColor: isActive ? (color || theme.palette.primary.main) : borderColor,
					},
					minHeight: '30px',
				}}
			>
				{isActive ? activeLabel : label}
			</Button>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: '12px',
					border: '1px solid',
					borderColor,
					overflow: 'hidden',
					bgcolor: cardBg,
					backgroundImage: 'none',
					boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.12)',
				},
			}}
		>
			{/* Top Header Bar */}
			<Box
				sx={{
					px: 2.5,
					py: 1.5,
					borderBottom: '1px solid',
					borderColor,
					bgcolor: isDark ? '#161b22' : '#f6f8fa',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: hoverBg } }}
					>
						<ArrowBackOutlined style={{ fontSize: 18 }} />
					</IconButton>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.925rem' }}>
						{parentTask 
							? `Create new sub-task in ${projectName}`
							: `Create new task in ${projectName}`}
					</Typography>
				</Stack>
				<IconButton
					onClick={onClose}
					disabled={submitting}
					size="small"
					sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) } }}
				>
					<CloseOutlined style={{ fontSize: 18 }} />
				</IconButton>
			</Box>

			<DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
				{/* Title Field */}
				<Stack spacing={1}>
					<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
						Add a title <Box component="span" sx={{ color: '#F44336' }}>*</Box>
					</Typography>
					<TextField
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						error={!!titleError}
						helperText={titleError}
						autoFocus
						fullWidth
						variant="outlined"
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: '6px',
								fontSize: '0.875rem',
								bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'transparent',
								'& fieldset': { borderColor },
								'&:hover fieldset': { borderColor: isDark ? '#8b949e' : '#858585' },
								'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px' },
							},
						}}
					/>
				</Stack>

				{/* Description Editor Box */}
				<Stack spacing={1}>
					<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
						Add a description
					</Typography>
					<Box
						sx={{
							border: '1px solid',
							borderColor: isDescFocused ? theme.palette.primary.main : borderColor,
							borderRadius: '6px',
							overflow: 'hidden',
							bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'transparent',
							transition: 'border-color 0.15s ease-in-out',
						}}
					>
						{/* Editor Header: Tabs + Formatting Toolbar */}
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								borderBottom: '1px solid',
								borderColor,
								bgcolor: isDark ? '#161b22' : '#f6f8fa',
								px: 1,
							}}
						>
							<Tabs
								value={editTab}
								onChange={(_, v) => setEditTab(v)}
								sx={{
									minHeight: '38px',
									'& .MuiTabs-indicator': { display: 'none' },
									'& .MuiTabs-flexContainer': { gap: '4px', pt: '6px' },
								}}
							>
								{['Write', 'Preview'].map((label) => (
									<Tab
										key={label}
										label={label}
										sx={{
											textTransform: 'none',
											fontWeight: 600,
											fontSize: '0.8rem',
											minWidth: 'auto',
											minHeight: '32px',
											py: 0.5,
											px: 2,
											borderRadius: '6px 6px 0 0',
											color: 'text.secondary',
											border: '1px solid transparent',
											borderBottom: 'none',
											'&.Mui-selected': {
												color: 'text.primary',
												bgcolor: cardBg,
												borderColor,
												borderBottom: '1px solid',
												borderBottomColor: cardBg,
												marginBottom: '-1px',
												position: 'relative',
												zIndex: 2,
											},
										}}
									/>
								))}
							</Tabs>

							{/* Toolbar */}
							{editTab === 0 && (
								<Stack direction="row" spacing={0.25} alignItems="center" sx={{ pr: 1 }}>
									<IconButton size="small" onClick={() => insertMarkdown('h')} title="Heading" sx={{ color: 'text.secondary', p: 0.5 }}>
										<Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>H</Typography>
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('bold')} title="Bold" sx={{ color: 'text.secondary', p: 0.5 }}>
										<FormatBold fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('italic')} title="Italic" sx={{ color: 'text.secondary', p: 0.5 }}>
										<FormatItalic fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('quote')} title="Quote" sx={{ color: 'text.secondary', p: 0.5 }}>
										<FormatQuote fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('code')} title="Code" sx={{ color: 'text.secondary', p: 0.5 }}>
										<Code fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('link')} title="Link" sx={{ color: 'text.secondary', p: 0.5 }}>
										<LinkIcon fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
									<IconButton size="small" onClick={() => insertMarkdown('numlist')} title="Numbered List" sx={{ color: 'text.secondary', p: 0.5 }}>
										<FormatListNumbered fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('list')} title="Bulleted List" sx={{ color: 'text.secondary', p: 0.5 }}>
										<FormatListBulleted fontSize="small" style={{ fontSize: 16 }} />
									</IconButton>
									<IconButton size="small" onClick={() => insertMarkdown('tasklist')} title="Task List" sx={{ color: 'text.secondary', p: 0.5 }}>
										<PlaylistAddCheck fontSize="small" style={{ fontSize: 18 }} />
									</IconButton>
								</Stack>
							)}
						</Box>

						{/* Edit area or Preview Area */}
						{editTab === 0 ? (
							<textarea
								id="create-task-desc-textarea"
								placeholder="Type your description here..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								onFocus={() => setIsDescFocused(true)}
								onBlur={() => setIsDescFocused(false)}
								style={{
									width: '100%',
									minHeight: '130px',
									padding: '16px',
									fontSize: '0.875rem',
									fontFamily: 'inherit',
									backgroundColor: 'transparent',
									border: 'none',
									outline: 'none',
									color: isDark ? '#c9d1d9' : '#24292f',
									resize: 'vertical',
									boxSizing: 'border-box',
								}}
							/>
						) : (
							<Box sx={{ p: 2, minHeight: 130, overflowY: 'auto' }}>
								{description.trim() ? (
									<RichTextViewer html={description} />
								) : (
									<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
										Nothing to preview. Type description in the "Write" tab.
									</Typography>
								)}
							</Box>
						)}

						{/* Editor Footer */}
						<Box
							sx={{
								px: 2,
								py: 1.25,
								borderTop: '1px dashed',
								borderColor,
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)',
							}}
						>
							<Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
								<AttachFile sx={{ fontSize: 16 }} />
								<Typography variant="caption" sx={{ fontWeight: 500 }}>
									Paste, drop, or click to add files
								</Typography>
							</Stack>

							<Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
								<AutoAwesomeOutlined sx={{ fontSize: 14 }} />
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									Write with Copilot
								</Typography>
							</Stack>
						</Box>
					</Box>
				</Stack>

				{/* Metadata Pills Selection Row */}
				<Stack direction="row" flexWrap="wrap" gap={1.25} alignItems="center" sx={{ mt: 1 }}>
					{/* Status Pill */}
					{renderMetadataPill({
						icon: dotIcon(selectedStatus?.color || '#ccc'),
						label: 'Stage',
						activeLabel: selectedStatus?.name,
						isActive: true,
						onClick: (e) => setStatusAnchor(e.currentTarget),
						color: selectedStatus?.color
					})}

					{/* Assignee Pill */}
					{renderMetadataPill({
						icon: <PersonOutline style={{ fontSize: 15 }} />,
						label: 'Assignee',
						activeLabel: selectedAssignee ? (selectedAssignee.full_name || selectedAssignee.email) : 'Assignee',
						isActive: assigneeId !== null,
						onClick: (e) => setAssigneeAnchor(e.currentTarget),
					})}

					{/* Label/Tags Pill */}
					{renderMetadataPill({
						icon: <SellOutlined style={{ fontSize: 14 }} />,
						label: 'Label',
						activeLabel: selectedTags.length > 0 
							? `Labels: ${selectedTags.length}`
							: 'Label',
						isActive: selectedTags.length > 0,
						onClick: (e) => setLabelsAnchor(e.currentTarget),
					})}

					{/* Task Type Pill */}
					{renderMetadataPill({
						icon: <CategoryOutlined style={{ fontSize: 15 }} />,
						label: 'Issue type',
						activeLabel: taskType.name.toUpperCase(),
						isActive: true,
						onClick: (e) => setTypeAnchor(e.currentTarget),
						color: taskType.color
					})}

					{/* Priority Pill */}
					{renderMetadataPill({
						icon: <FlagOutlined style={{ fontSize: 15 }} />,
						label: 'Priority',
						activeLabel: priority.charAt(0).toUpperCase() + priority.slice(1),
						isActive: true,
						onClick: (e) => setPriorityAnchor(e.currentTarget),
						color: PRIORITIES.find((p) => p.value === priority)?.color
					})}

					{/* Due Date Pill */}
					{renderMetadataPill({
						icon: <CalendarTodayOutlined style={{ fontSize: 14 }} />,
						label: 'Due Date',
						activeLabel: dueDate ? dayjs(dueDate).format('MMM D') : 'Due Date',
						isActive: !!dueDate,
						onClick: (e) => setDueDateAnchor(e.currentTarget),
					})}

					{/* Estimate Pill */}
					{renderMetadataPill({
						icon: <ScheduleOutlined style={{ fontSize: 15 }} />,
						label: 'Estimate',
						activeLabel: estimatedHours ? `${estimatedHours}h` : 'Estimate',
						isActive: !!estimatedHours,
						onClick: (e) => setEstimateAnchor(e.currentTarget),
					})}

					{/* Project Label Pill (Static badge style from mockup) */}
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							px: 1.5,
							py: 0.5,
							bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
							border: '1px solid',
							borderColor,
							borderRadius: '6px',
							fontSize: '0.75rem',
							fontWeight: 500,
							color: 'text.secondary',
							minHeight: '30px',
						}}
					>
						Project&nbsp;
						<Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
							{projectName}
						</Box>
					</Box>

					{/* Milestone Pill (Static badge style from mockup) */}
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							px: 1.5,
							py: 0.5,
							bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
							border: '1px solid',
							borderColor,
							borderRadius: '6px',
							fontSize: '0.75rem',
							fontWeight: 500,
							color: 'text.secondary',
							minHeight: '30px',
						}}
					>
						Milestone&nbsp;
						<Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
							General
						</Box>
					</Box>
				</Stack>
			</DialogContent>

			{/* Actions Footer */}
			<DialogActions
				sx={{
					px: 3,
					py: 2.25,
					borderTop: '1px solid',
					borderColor,
					bgcolor: isDark ? '#161b22' : '#f6f8fa',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				{/* Checkbox: Create more */}
				<FormControlLabel
					control={
						<Checkbox
							checked={createMore}
							onChange={(e) => setCreateMore(e.target.checked)}
							color="primary"
							size="small"
						/>
					}
					label={
						<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.secondary' }}>
							{parentTask ? 'Create more sub-tasks' : 'Create more tasks'}
						</Typography>
					}
				/>

				{/* Cancel and Create buttons */}
				<Stack direction="row" spacing={1.5}>
					<Button
						onClick={onClose}
						disabled={submitting}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.825rem',
							borderRadius: '6px',
							color: 'text.primary',
							px: 2.5,
							py: 0.75,
							border: '1px solid',
							borderColor,
							bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
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
							fontSize: '0.825rem',
							px: 3,
							py: 0.75,
							borderRadius: '6px',
							bgcolor: '#2da44e',
							'&:hover': { bgcolor: '#2c974b' },
							'&.Mui-disabled': { bgcolor: isDark ? '#21262d' : '#ebedf0' },
						}}
					>
						{parentTask ? 'Create sub-task' : 'Create task'}
					</Button>
				</Stack>
			</DialogActions>

			{/* POPPOVERS */}

			{/* Status Popover */}
			<Popover
				open={Boolean(statusAnchor)}
				anchorEl={statusAnchor}
				onClose={() => setStatusAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Stack sx={{ minWidth: 180, py: 0.5 }}>
					{statuses.map((s) => (
						<Box
							key={s.id}
							onClick={() => { setStatusId(s.id); setStatusAnchor(null); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer',
								bgcolor: s.id === statusId ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: hoverBg },
							}}
						>
							{dotIcon(s.color)}
							<Typography variant="body2" sx={{ fontWeight: s.id === statusId ? 700 : 600, ml: 1 }}>{s.name}</Typography>
							{s.id === statusId && <CheckOutlined sx={{ fontSize: 16, ml: 'auto', color: 'primary.main' }} />}
						</Box>
					))}
				</Stack>
			</Popover>

			{/* Assignee Popover */}
			<Popover
				open={Boolean(assigneeAnchor)}
				anchorEl={assigneeAnchor}
				onClose={() => setAssigneeAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
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
						{assigneeId === null && <CheckOutlined sx={{ fontSize: 16, ml: 'auto', color: 'primary.main' }} />}
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
							{o.id === assigneeId && <CheckOutlined sx={{ fontSize: 16, ml: 'auto', color: 'primary.main' }} />}
						</Box>
					))}
				</Stack>
			</Popover>

			{/* Priority Popover */}
			<Popover
				open={Boolean(priorityAnchor)}
				anchorEl={priorityAnchor}
				onClose={() => setPriorityAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Stack sx={{ minWidth: 160, py: 0.5 }}>
					{PRIORITIES.map((p) => (
						<Box
							key={p.value}
							onClick={() => { setPriority(p.value); setPriorityAnchor(null); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer',
								bgcolor: p.value === priority ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: hoverBg },
							}}
						>
							{dotIcon(p.color)}
							<Typography variant="body2" sx={{ fontWeight: p.value === priority ? 700 : 600, ml: 1 }}>{p.label}</Typography>
							{p.value === priority && <CheckOutlined sx={{ fontSize: 16, ml: 'auto', color: 'primary.main' }} />}
						</Box>
					))}
				</Stack>
			</Popover>

			{/* Task Type Popover */}
			<Popover
				open={Boolean(typeAnchor)}
				anchorEl={typeAnchor}
				onClose={() => setTypeAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', p: 1.5 } }}
			>
				<Stack sx={{ minWidth: 220, gap: 1.5 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Select Task Type
					</Typography>
					<Stack spacing={0.5}>
						{taskTypes.map((t) => {
							const isSelected = taskType.name.toLowerCase() === t.name.toLowerCase();
							return (
								<Box
									key={t.name}
									onClick={() => {
										setTaskType({ name: t.name, color: t.color });
										setTypeAnchor(null);
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
									{isSelected && <CheckOutlined sx={{ fontSize: 16, color: 'primary.main' }} />}
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
								placeholder="e.g. Design"
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
										setTaskType({ name: newTypeName.trim(), color });
										setNewTypeName('');
										setTypeAnchor(null);
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

			{/* Labels (Tags) Popover */}
			<Popover
				open={Boolean(labelsAnchor)}
				anchorEl={labelsAnchor}
				onClose={() => setLabelsAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Box sx={{ p: 2, width: 320 }}>
					<TaskTagsInput
						value={selectedTags}
						onChange={(newTags) => setSelectedTags(newTags)}
						existingTags={existingTags}
					/>
				</Box>
			</Popover>

			{/* Due Date Popover */}
			<Popover
				open={Boolean(dueDateAnchor)}
				anchorEl={dueDateAnchor}
				onClose={() => setDueDateAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Box sx={{ p: 2, width: 260 }}>
					<DatePicker
						label="Due Date"
						value={dueDate || null}
						onChange={(v) => { setDueDate(v || undefined); setDueDateAnchor(null); }}
						format="DD-MMM-YYYY"
					/>
				</Box>
			</Popover>

			{/* Estimate Popover */}
			<Popover
				open={Boolean(estimateAnchor)}
				anchorEl={estimateAnchor}
				onClose={() => setEstimateAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: popupBg, border: '1px solid', borderColor, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Stack spacing={1.5} sx={{ p: 2, width: 220 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
						Quick Select
					</Typography>
					<Stack direction="row" flexWrap="wrap" gap={1}>
						{[1, 2, 4, 8, 16, 24].map((h) => (
							<Button
								key={h}
								variant="outlined"
								size="small"
								onClick={() => { setEstimatedHours(h); setEstimateAnchor(null); }}
								sx={{
									borderRadius: '100px',
									fontSize: '0.75rem',
									py: 0.5,
									minWidth: '45px',
									borderColor: estimatedHours === h ? 'primary.main' : borderColor,
									bgcolor: estimatedHours === h ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
									color: estimatedHours === h ? 'primary.main' : 'text.primary',
								}}
							>
								{h}h
							</Button>
						))}
					</Stack>
					<TextField
						label="Custom Hours"
						type="number"
						value={estimatedHours || ''}
						onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)}
						fullWidth
						size="small"
						autoComplete="off"
						onKeyDown={(e) => { if (e.key === 'Enter') setEstimateAnchor(null); }}
					/>
				</Stack>
			</Popover>
		</Dialog>
	);
};

export default ProjectTaskCreateDialog;
