import React from 'react';
import { Popover, Stack, Box, Typography, Avatar, TextField, Button, Divider, alpha, useTheme } from '@mui/material';
import { CheckOutlined } from '@mui/icons-material';
import type { ProjectTaskStatus, ProjectTaskTag } from '../../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import { DatePicker } from '../../../../common/form';
import { TaskTagsInput } from '../TaskTagsInput';

interface TaskCreatePopoversProps {
	statusAnchor: HTMLElement | null;
	setStatusAnchor: (el: HTMLElement | null) => void;
	statusId: number;
	setStatusId: (val: number) => void;
	statuses: ProjectTaskStatus[];

	assigneeAnchor: HTMLElement | null;
	setAssigneeAnchor: (el: HTMLElement | null) => void;
	assigneeId: number | null;
	setAssigneeId: (val: number | null) => void;
	owners: CRMOwnerOption[];

	priorityAnchor: HTMLElement | null;
	setPriorityAnchor: (el: HTMLElement | null) => void;
	priority: LeadPriority;
	setPriority: (val: LeadPriority) => void;
	priorities: { value: LeadPriority; label: string; color: string }[];

	typeAnchor: HTMLElement | null;
	setTypeAnchor: (el: HTMLElement | null) => void;
	taskType: { name: string; color: string };
	setTaskType: (val: { name: string; color: string }) => void;
	taskTypes: { name: string; color: string }[];
	newTypeName: string;
	setNewTypeName: (val: string) => void;
	presetColors: string[];

	milestoneAnchor: HTMLElement | null;
	setMilestoneAnchor: (el: HTMLElement | null) => void;
	milestone?: { name: string; color: string };
	setMilestone: (val: { name: string; color: string } | undefined) => void;
	milestones: { name: string; color: string }[];
	newMilestoneName: string;
	setNewMilestoneName: (val: string) => void;

	labelsAnchor: HTMLElement | null;
	setLabelsAnchor: (el: HTMLElement | null) => void;
	selectedTags: ProjectTaskTag[];
	setSelectedTags: (tags: ProjectTaskTag[]) => void;
	existingTags: ProjectTaskTag[];

	dueDateAnchor: HTMLElement | null;
	setDueDateAnchor: (el: HTMLElement | null) => void;
	dueDate?: string;
	setDueDate: (val?: string) => void;

	estimateAnchor: HTMLElement | null;
	setEstimateAnchor: (el: HTMLElement | null) => void;
	estimatedHours?: number;
	setEstimatedHours: (val?: number) => void;
}

export const TaskCreatePopovers: React.FC<TaskCreatePopoversProps> = ({
	statusAnchor,
	setStatusAnchor,
	statusId,
	setStatusId,
	statuses,
	assigneeAnchor,
	setAssigneeAnchor,
	assigneeId,
	setAssigneeId,
	owners,
	priorityAnchor,
	setPriorityAnchor,
	priority,
	setPriority,
	priorities,
	typeAnchor,
	setTypeAnchor,
	taskType,
	setTaskType,
	taskTypes,
	newTypeName,
	setNewTypeName,
	presetColors,
	milestoneAnchor,
	setMilestoneAnchor,
	milestone,
	setMilestone,
	milestones,
	newMilestoneName,
	setNewMilestoneName,
	labelsAnchor,
	setLabelsAnchor,
	selectedTags,
	setSelectedTags,
	existingTags,
	dueDateAnchor,
	setDueDateAnchor,
	dueDate,
	setDueDate,
	estimateAnchor,
	setEstimateAnchor,
	estimatedHours,
	setEstimatedHours,
}) => {
	const theme = useTheme();

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	return (
		<>
			{/* Status Popover */}
			<Popover
				open={Boolean(statusAnchor)}
				anchorEl={statusAnchor}
				onClose={() => setStatusAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Stack sx={{ minWidth: 180, py: 0.5 }}>
					{statuses.map((s) => (
						<Box
							key={s.id}
							onClick={() => { setStatusId(s.id); setStatusAnchor(null); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer',
								bgcolor: s.id === statusId ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: theme.palette.action.hover },
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
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
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
							'&:hover': { bgcolor: theme.palette.action.hover },
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
								'&:hover': { bgcolor: theme.palette.action.hover },
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
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
			>
				<Stack sx={{ minWidth: 160, py: 0.5 }}>
					{priorities.map((p) => (
						<Box
							key={p.value}
							onClick={() => { setPriority(p.value); setPriorityAnchor(null); }}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer',
								bgcolor: p.value === priority ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
								'&:hover': { bgcolor: theme.palette.action.hover },
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
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', p: 1.5 } }}
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
										'&:hover': { bgcolor: theme.palette.action.hover },
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
										const color = presetColors[Math.floor(Math.random() * presetColors.length)];
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

			{/* Milestone Popover */}
			<Popover
				open={Boolean(milestoneAnchor)}
				anchorEl={milestoneAnchor}
				onClose={() => setMilestoneAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', p: 1.5 } }}
			>
				<Stack sx={{ minWidth: 220, gap: 1.5 }}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
						Select Milestone
					</Typography>
					<Stack spacing={0.5}>
						{milestones.map((m) => {
							const isSelected = (milestone?.name || '').toLowerCase() === m.name.toLowerCase();
							return (
								<Box
									key={m.name}
									onClick={() => {
										setMilestone({ name: m.name, color: m.color });
										setMilestoneAnchor(null);
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
										'&:hover': { bgcolor: theme.palette.action.hover },
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
						{milestones.length === 0 && (
							<Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', px: 1.5, py: 1 }}>
								No milestones yet
							</Typography>
						)}
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
										const color = presetColors[Math.floor(Math.random() * presetColors.length)];
										setMilestone({ name: newMilestoneName.trim(), color });
										setNewMilestoneName('');
										setMilestoneAnchor(null);
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
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
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
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
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
				PaperProps={{ sx: { borderRadius: '8px', mt: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
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
									borderColor: estimatedHours === h ? 'primary.main' : theme.palette.divider,
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
		</>
	);
};
