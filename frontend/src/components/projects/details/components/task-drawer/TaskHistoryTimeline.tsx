import React from 'react';
import {
	Box,
	Stack,
	Typography,
	Avatar,
	useTheme,
	alpha,
} from '@mui/material';
import {
	FolderOutlined,
	LocalOfferOutlined,
	Adjust,
	PersonOutline,
	FormatListBulleted,
	OutlinedFlag,
	CheckCircle,
	RadioButtonUnchecked,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskStatus } from '../../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

interface TaskHistoryTimelineProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	projectName: string;
}

interface TimelineEvent {
	id: string;
	icon: React.ReactNode;
	user: string;
	actionText: React.ReactNode;
	date: string;
	dateObj: dayjs.Dayjs;
	nestedContent?: React.ReactNode;
}

export const TaskHistoryTimeline: React.FC<TaskHistoryTimelineProps> = ({
	task,
	tasks,
	statuses,
	owners,
	projectName,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
	const activeAssignee = owners.find((o) => o.id === task.assignee_id);
	const currentStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];

	// Compile timeline events dynamically
	const events: TimelineEvent[] = React.useMemo(() => {
		const list: TimelineEvent[] = [];
		const baseDate = dayjs(task.created_at);

		// Event 1: Task created
		list.push({
			id: 'creation',
			icon: <FolderOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />,
			user: 'dharani6255',
			actionText: (
				<>
					added this to <span style={{ fontWeight: 600 }}>{projectName}</span>
				</>
			),
			date: baseDate.format('MMM D, YYYY'),
			dateObj: baseDate,
		});

		// Event 2: Task type set
		const taskType = task.custom_fields?.task_type || { name: 'Task', color: '#FF9800' };
		list.push({
			id: 'type-assignment',
			icon: <Adjust sx={{ fontSize: 15, color: 'text.secondary' }} />,
			user: 'dharani6255',
			actionText: (
				<>
					added the{' '}
					<Box
						component="span"
						sx={{
							display: 'inline-block',
							bgcolor: alpha(taskType.color, 0.1),
							border: '1px solid',
							borderColor: taskType.color,
							color: taskType.color,
							px: 1,
							py: 0.125,
							borderRadius: '10px',
							fontSize: '0.7rem',
							fontWeight: 700,
							mx: 0.5,
						}}
					>
						{taskType.name}
					</Box>{' '}
					issue type
				</>
			),
			date: baseDate.format('MMM D, YYYY'),
			dateObj: baseDate.add(1, 'second'),
		});

		// Event 3: Tags/Labels set
		if (task.tags && task.tags.length > 0) {
			list.push({
				id: 'tags-assignment',
				icon: <LocalOfferOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />,
				user: 'dharani6255',
				actionText: (
					<>
						added{' '}
						{task.tags.map((t, idx) => (
							<Box
								key={t.name}
								component="span"
								sx={{
									display: 'inline-block',
									bgcolor: alpha(t.color, 0.12),
									color: t.color,
									border: '1px solid',
									borderColor: t.color,
									px: 1.25,
									py: 0.25,
									borderRadius: '100px',
									fontSize: '0.75rem',
									fontWeight: 700,
									mr: idx < (task.tags?.length || 0) - 1 ? 0.5 : 0,
								}}
							>
								{t.name}
							</Box>
						))}{' '}
						label
					</>
				),
				date: baseDate.format('MMM D, YYYY'),
				dateObj: baseDate.add(2, 'second'),
			});
		}

		// Event 4: Assignee set
		if (activeAssignee) {
			list.push({
				id: 'assignment',
				icon: <PersonOutline sx={{ fontSize: 15, color: 'text.secondary' }} />,
				user: 'dharani6255',
				actionText: (
					<>
						assigned{' '}
						<span style={{ fontWeight: 600, color: theme.palette.primary.main }}>
							{activeAssignee.full_name || activeAssignee.email}
						</span>
					</>
				),
				date: baseDate.format('MMM D, YYYY'),
				dateObj: baseDate.add(3, 'second'),
			});
		}

		// Event 5: Subtasks added
		if (subtasks.length > 0) {
			const latestSubtaskDate = subtasks.reduce((latest, st) => {
				const d = dayjs(st.created_at);
				return d.isAfter(latest) ? d : latest;
			}, baseDate.add(4, 'second'));

			list.push({
				id: 'subtasks-added',
				icon: <FormatListBulleted sx={{ fontSize: 15, color: 'text.secondary' }} />,
				user: 'dharani6255',
				actionText: 'added sub-tasks',
				date: latestSubtaskDate.format('MMM D, YYYY'),
				dateObj: latestSubtaskDate,
				nestedContent: (
					<Stack spacing={1} sx={{ pl: 4.5, borderLeft: '2px solid', borderColor: isDark ? '#30363d' : '#d0d7de', ml: -1.75, mt: 1 }}>
						{subtasks.map((st) => {
							const subStatus = statuses.find((s) => s.id === st.status_id) || statuses[0];
							const isSubDone = subStatus.is_done_status;
							return (
								<Stack key={st.id} direction="row" spacing={1} alignItems="center">
									{isSubDone ? (
										<CheckCircle sx={{ fontSize: 15, color: isDark ? '#3fb950' : '#2da44e' }} />
									) : (
										<RadioButtonUnchecked sx={{ fontSize: 15, color: 'text.secondary', opacity: 0.6 }} />
									)}
									<Typography
										variant="body2"
										sx={{
											fontSize: '0.8rem',
											color: isSubDone ? 'text.secondary' : 'text.primary',
											textDecoration: isSubDone ? 'line-through' : 'none',
										}}
									>
										{st.title}{' '}
										<span style={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
											#{st.id}
										</span>
									</Typography>
								</Stack>
							);
						})}
					</Stack>
				),
			});
		}

		// Event 6: Milestone
		if (task.custom_fields?.milestone) {
			const milestoneDate = dayjs(task.updated_at).subtract(1, 'second');
			list.push({
				id: 'milestone-added',
				icon: <OutlinedFlag sx={{ fontSize: 15, color: 'text.secondary' }} />,
				user: 'dharani6255',
				actionText: (
					<>
						added this to the{' '}
						<span style={{ fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
							{task.custom_fields.milestone.name}
						</span>{' '}
						milestone
					</>
				),
				date: milestoneDate.format('MMM D, YYYY'),
				dateObj: milestoneDate,
			});
		}

		// Event 7: Status transition
		if (currentStatus.id !== statuses[0]?.id) {
			const transitionDate = dayjs(task.updated_at);
			list.push({
				id: 'status-movement',
				icon: <FolderOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />,
				user: 'dharani6255',
				actionText: (
					<>
						moved this from <span style={{ fontWeight: 600 }}>{statuses[0]?.name || 'To do'}</span> to{' '}
						<span style={{ fontWeight: 600 }}>{currentStatus.name}</span> in{' '}
						<span style={{ fontWeight: 600 }}>{projectName}</span>
					</>
				),
				date: transitionDate.format('MMM D, YYYY'),
				dateObj: transitionDate,
			});
		}

		// Sort events in reverse chronological order (newest first)
		list.sort((a, b) => b.dateObj.valueOf() - a.dateObj.valueOf());

		return list;
	}, [task, subtasks, statuses, activeAssignee, currentStatus, projectName, isDark, theme]);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, pl: 1 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1 }}>
				History of Changes
			</Typography>

			{/* Timeline list */}
			<Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
				{/* Connecting vertical rail line */}
				<Box
					sx={{
						position: 'absolute',
						left: 14,
						top: 14,
						bottom: 14,
						width: 2,
						bgcolor: isDark ? '#30363d' : '#d0d7de',
						zIndex: 0,
					}}
				/>

				{events.map((event) => (
					<Box key={event.id} sx={{ display: 'flex', gap: 2, mb: 3.5, position: 'relative', zIndex: 1 }}>
						{/* Circle Icon Container */}
						<Box
							sx={{
								width: 30,
								height: 30,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: isDark ? '#161b22' : '#f6f8fa',
								border: '1px solid',
								borderColor: isDark ? '#30363d' : '#d0d7de',
								flexShrink: 0,
							}}
						>
							{event.icon}
						</Box>

						{/* Right side event detail text */}
						<Box sx={{ flex: 1, pt: 0.5 }}>
							<Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
								{/* Mini Avatar */}
								<Avatar
									sx={{
										width: 18,
										height: 18,
										fontSize: '0.6rem',
										fontWeight: 700,
										bgcolor: theme.palette.primary.main,
										color: 'white',
									}}
								>
									{event.user[0]?.toUpperCase()}
								</Avatar>
								<Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'text.primary' }}>
									<span style={{ fontWeight: 700 }}>{event.user}</span> {event.actionText}{' '}
									<Box component="span" sx={{ color: 'text.secondary', ml: 1, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
										on {event.date}
									</Box>
								</Typography>
							</Stack>
							{event.nestedContent}
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default TaskHistoryTimeline;
