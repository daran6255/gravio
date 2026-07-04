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
	IconButton,
	alpha,
} from '@mui/material';
import {
	ChevronRightOutlined,
	CheckCircleOutline,
	MoreHorizOutlined,
	ArrowDropDownOutlined,
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

	const [expanded, setExpanded] = useState(true);

	// Filter Subtasks
	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
	const doneStatus = statuses.find((s) => s.is_done_status);
	const completedCount = subtasks.filter((st) => st.status_id === doneStatus?.id).length;
	const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

	return (
		<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper' }}>
			{/* Collapsible Header */}
			<Box
				onClick={() => setExpanded(!expanded)}
				sx={{
					px: 2.25,
					py: 1.5,
					borderBottom: expanded ? '1px solid' : 'none',
					borderColor: 'divider',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
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
						<Box
							sx={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 0.5,
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(139,124,246,0.15)' : 'rgba(139,124,246,0.08)',
								border: '1px solid',
								borderColor: alpha(theme.palette.primary.main, 0.3),
								color: 'primary.main',
								px: 1.25,
								py: 0.25,
								borderRadius: '10px',
								fontSize: '0.75rem',
								fontWeight: 800,
							}}
						>
							<CheckCircleOutline style={{ fontSize: 13 }} />
							{completedCount} of {subtasks.length}
						</Box>
					)}
				</Stack>
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
										bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
										'& .MuiLinearProgress-bar': {
											borderRadius: '3px',
											background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
										},
									}}
								/>
							</Stack>

							{/* Checklist Rows */}
							<Stack spacing={0.75} sx={{ mt: 1 }}>
								{subtasks.map((st) => {
									const subStatus = statuses.find((s) => s.id === st.status_id) || statuses[0];
									const subAssignee = owners.find((o) => o.id === st.assignee_id);
									const isSubDone = subStatus.is_done_status;
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
												borderColor: 'divider',
												bgcolor: 'background.paper',
												transition: 'all 0.15s',
												'&:hover': {
													bgcolor: theme.palette.action.hover,
													borderColor: 'primary.main',
												},
											}}
										>
											<Stack direction="row" spacing={1.5} alignItems="center">
												{/* Check circle icon */}
												<CheckCircleOutline
													style={{
														fontSize: 16,
														color: isSubDone ? theme.palette.primary.main : theme.palette.text.secondary,
														opacity: isSubDone ? 1 : 0.4,
													}}
												/>
												{/* TASK Badge */}
												<Box
													sx={{
														bgcolor: alpha(theme.palette.primary.main, 0.1),
														border: '1px solid',
														borderColor: 'primary.main',
														color: 'primary.main',
														px: 1,
														py: 0.15,
														borderRadius: '4px',
														fontSize: '0.65rem',
														fontWeight: 800,
														letterSpacing: '0.04em',
													}}
												>
													TASK
												</Box>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 600,
														color: isSubDone ? 'text.secondary' : 'text.primary',
														textDecoration: isSubDone ? 'line-through' : 'none',
													}}
												>
													{st.title} <span style={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>#{st.id}</span>
												</Typography>
											</Stack>
											
											<Stack direction="row" spacing={1.25} alignItems="center">
												{subAssignee && (
													<Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
														{(subAssignee.full_name || subAssignee.email)[0]?.toUpperCase()}
													</Avatar>
												)}
												<IconButton size="small" sx={{ color: 'text.secondary' }}>
													<MoreHorizOutlined fontSize="small" style={{ fontSize: 16 }} />
												</IconButton>
											</Stack>
										</Box>
									);
								})}
							</Stack>
						</Stack>
					) : (
						<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', textAlign: 'center', py: 3 }}>
							No sub-tasks. Click "Create sub-issue" to begin.
						</Typography>
					)}

					{/* Create sub-issue button */}
					<Button
						variant="outlined"
						size="small"
						onClick={() => onAddSubtask(task)}
						endIcon={<ArrowDropDownOutlined />}
						sx={{
							mt: 2.25,
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '6px',
							borderColor: 'divider',
							color: 'text.primary',
							bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
							'&:hover': {
								borderColor: theme.palette.primary.main,
								bgcolor: theme.palette.action.hover,
							},
						}}
					>
						Create sub-issue
					</Button>
				</Box>
			</Collapse>
		</Box>
	);
};

export default SubtasksList;
