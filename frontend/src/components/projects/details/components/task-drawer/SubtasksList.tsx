import React, { useState } from 'react';
import {
	Box,
	Stack,
	Typography,
	Button,
	Avatar,
	Collapse,
	LinearProgress,
	useTheme,
} from '@mui/material';
import {
	ChevronRightOutlined,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskStatus } from '../../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

interface SubtasksListProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	onAddSubtask: (parent: ProjectTask) => void;
}

export const SubtasksList: React.FC<SubtasksListProps> = ({
	task,
	tasks,
	statuses,
	owners,
	onAddSubtask,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [expanded, setExpanded] = useState(true);

	// Filter Subtasks
	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
	const doneStatus = statuses.find((s) => s.is_done_status);
	const completedCount = subtasks.filter((st) => st.status_id === doneStatus?.id).length;
	const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

	const dotIcon = (color: string) => (
		<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
	);

	return (
		<Box sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper' }}>
			{/* Collapsible Header */}
			<Box
				onClick={() => setExpanded(!expanded)}
				sx={{
					px: 2,
					py: 1.5,
					borderBottom: expanded ? '1px solid' : 'none',
					borderColor: 'divider',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
					cursor: 'pointer',
					userSelect: 'none',
				}}
			>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<ChevronRightOutlined
						fontSize="small"
						sx={{
							transform: expanded ? 'rotate(90deg)' : 'none',
							transition: 'transform 0.2s',
							color: 'text.secondary',
						}}
					/>
					<Typography variant="subtitle2" sx={{ fontWeight: 750, letterSpacing: '-0.01em' }}>
						Sub-issues
					</Typography>
					{subtasks.length > 0 && (
						<Typography variant="caption" sx={{ px: 1.25, py: 0.25, bgcolor: 'primary.main', color: 'white', borderRadius: '10px', fontWeight: 800 }}>
							{completedCount} of {subtasks.length}
						</Typography>
					)}
				</Stack>
				
				<Button
					size="small"
					onClick={(e) => {
						e.stopPropagation();
						onAddSubtask(task);
					}}
					sx={{ textTransform: 'none', fontWeight: 700 }}
				>
					+ Add Sub-task
				</Button>
			</Box>

			{/* Collapsible Body */}
			<Collapse in={expanded}>
				<Box sx={{ p: 2.25 }}>
					{subtasks.length > 0 ? (
						<Stack spacing={2}>
							{/* Progress Bar */}
							<Stack spacing={0.75}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
										Progress
									</Typography>
									<Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
										{progressPercent}% Complete
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={progressPercent}
									sx={{
										height: 6,
										borderRadius: '3px',
										bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
										'& .MuiLinearProgress-bar': {
											borderRadius: '3px',
											background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
										},
									}}
								/>
							</Stack>

							{/* Checklist Rows */}
							<Stack spacing={1} sx={{ mt: 1 }}>
								{subtasks.map((st) => {
									const subStatus = statuses.find((s) => s.id === st.status_id) || statuses[0];
									const subAssignee = owners.find((o) => o.id === st.assignee_id);
									return (
										<Box
											key={st.id}
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												p: 1.5,
												borderRadius: '8px',
												border: '1px solid',
												borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
												bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
												transition: 'all 0.15s',
												'&:hover': {
													bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
													borderColor: 'primary.main',
												},
											}}
										>
											<Stack direction="row" spacing={2} alignItems="center">
												{dotIcon(subStatus.color)}
												<Typography variant="body2" sx={{ fontWeight: 600 }}>
													{st.title}
												</Typography>
											</Stack>
											{subAssignee && (
												<Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
													{(subAssignee.full_name || subAssignee.email)[0]?.toUpperCase()}
												</Avatar>
											)}
										</Box>
									);
								})}
							</Stack>
						</Stack>
					) : (
						<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', textAlign: 'center', py: 3 }}>
							No sub-tasks. Click "+ Add Sub-task" to begin.
						</Typography>
					)}
				</Box>
			</Collapse>
		</Box>
	);
};

export default SubtasksList;
