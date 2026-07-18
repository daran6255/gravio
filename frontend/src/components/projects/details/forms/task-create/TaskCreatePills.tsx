import React from 'react';
import { Box, Stack, Button, Tooltip, useTheme, alpha } from '@mui/material';
import {
	PersonOutline,
	SellOutlined,
	CategoryOutlined,
	FlagOutlined,
	CalendarTodayOutlined,
	ScheduleOutlined,
	WorkspacePremiumOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTaskStatus, ProjectTaskTag } from '../../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

interface TaskCreatePillsProps {
	selectedStatus?: ProjectTaskStatus;
	selectedAssignee: CRMOwnerOption | null;
	selectedTags: ProjectTaskTag[];
	taskType: { name: string; color: string };
	milestone?: { name: string; color: string };
	priority: LeadPriority;
	dueDate?: string;
	estimatedHours?: number;
	projectName: string;
	assigneeId: number | null;
	priorities: { value: LeadPriority; label: string; color: string }[];

	setStatusAnchor: (el: HTMLElement | null) => void;
	setAssigneeAnchor: (el: HTMLElement | null) => void;
	setLabelsAnchor: (el: HTMLElement | null) => void;
	setTypeAnchor: (el: HTMLElement | null) => void;
	setMilestoneAnchor: (el: HTMLElement | null) => void;
	setPriorityAnchor: (el: HTMLElement | null) => void;
	setDueDateAnchor: (el: HTMLElement | null) => void;
	setEstimateAnchor: (el: HTMLElement | null) => void;
}

export const TaskCreatePills: React.FC<TaskCreatePillsProps> = ({
	selectedStatus,
	selectedAssignee,
	selectedTags,
	taskType,
	milestone,
	priority,
	dueDate,
	estimatedHours,
	projectName,
	assigneeId,
	priorities,
	setStatusAnchor,
	setAssigneeAnchor,
	setLabelsAnchor,
	setTypeAnchor,
	setMilestoneAnchor,
	setPriorityAnchor,
	setDueDateAnchor,
	setEstimateAnchor,
}) => {
	const theme = useTheme();

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
		tooltip,
	}: {
		icon: React.ReactNode;
		label: string;
		activeLabel?: string;
		isActive: boolean;
		onClick: (e: React.MouseEvent<HTMLElement>) => void;
		color?: string;
		tooltip?: string;
	}) => {
		const pillButton = (
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
					borderColor: isActive ? (color || theme.palette.primary.main) : theme.palette.divider,
					bgcolor: isActive ? alpha(color || theme.palette.primary.main, 0.08) : 'transparent',
					color: isActive ? (color || 'text.primary') : 'text.secondary',
					'&:hover': {
						bgcolor: isActive ? alpha(color || theme.palette.primary.main, 0.14) : theme.palette.action.hover,
						borderColor: isActive ? (color || theme.palette.primary.main) : theme.palette.divider,
					},
					minHeight: '30px',
				}}
			>
				{isActive ? activeLabel : label}
			</Button>
		);

		if (tooltip) {
			return (
				<Tooltip title={tooltip} arrow>
					<span>{pillButton}</span>
				</Tooltip>
			);
		}

		return pillButton;
	};

	return (
		<Stack direction="row" flexWrap="wrap" gap={1.25} alignItems="center" sx={{ mt: 1 }}>
			{/* Status Pill */}
			{renderMetadataPill({
				icon: dotIcon(selectedStatus?.color || '#ccc'),
				label: 'Stage',
				activeLabel: selectedStatus?.name,
				isActive: true,
				onClick: (e) => setStatusAnchor(e.currentTarget),
				color: selectedStatus?.color,
				tooltip: 'Select the workflow stage for this task'
			})}

			{/* Assignee Pill */}
			{renderMetadataPill({
				icon: <PersonOutline style={{ fontSize: 15 }} />,
				label: 'Assignee',
				activeLabel: selectedAssignee ? (selectedAssignee.full_name || selectedAssignee.email) : 'Assignee',
				isActive: assigneeId !== null,
				onClick: (e) => setAssigneeAnchor(e.currentTarget),
				tooltip: 'Assign this task to a team member'
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
				tooltip: 'Categorize this task with labels'
			})}

			{/* Task Type Pill */}
			{renderMetadataPill({
				icon: <CategoryOutlined style={{ fontSize: 15 }} />,
				label: 'Issue type',
				activeLabel: taskType.name.toUpperCase(),
				isActive: true,
				onClick: (e) => setTypeAnchor(e.currentTarget),
				color: taskType.color,
				tooltip: 'Select the nature of work (e.g., Task, Bug, Feature)'
			})}

			{/* Priority Pill */}
			{renderMetadataPill({
				icon: <FlagOutlined style={{ fontSize: 15 }} />,
				label: 'Priority',
				activeLabel: priority.charAt(0).toUpperCase() + priority.slice(1),
				isActive: true,
				onClick: (e) => setPriorityAnchor(e.currentTarget),
				color: priorities.find((p) => p.value === priority)?.color,
				tooltip: 'Set the priority level'
			})}

			{/* Due Date Pill */}
			{renderMetadataPill({
				icon: <CalendarTodayOutlined style={{ fontSize: 14 }} />,
				label: 'Due Date',
				activeLabel: dueDate ? dayjs(dueDate).format('MMM D') : 'Due Date',
				isActive: !!dueDate,
				onClick: (e) => setDueDateAnchor(e.currentTarget),
				tooltip: 'Select the target deadline/due date for this task'
			})}

			{/* Estimate Pill */}
			{renderMetadataPill({
				icon: <ScheduleOutlined style={{ fontSize: 15 }} />,
				label: 'Estimate',
				activeLabel: estimatedHours ? `${estimatedHours}h` : 'Estimate',
				isActive: !!estimatedHours,
				onClick: (e) => setEstimateAnchor(e.currentTarget),
				tooltip: 'Set the estimated effort in hours'
			})}

			{/* Project Label Pill (Static badge style from mockup) */}
			<Tooltip title="The project this task belongs to" arrow>
				<Box
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						px: 1.5,
						py: 0.5,
						bgcolor: theme.palette.action.selected,
						border: '1px solid',
						borderColor: theme.palette.divider,
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
			</Tooltip>

			{/* Milestone Pill */}
			{renderMetadataPill({
				icon: <WorkspacePremiumOutlined style={{ fontSize: 15 }} />,
				label: 'Milestone',
				activeLabel: milestone?.name.toUpperCase(),
				isActive: !!milestone,
				onClick: (e) => setMilestoneAnchor(e.currentTarget),
				color: milestone?.color,
				tooltip: 'The milestone this task is associated with'
			})}
		</Stack>
	);
};
