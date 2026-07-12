import React from 'react';
import { Box, Button, Checkbox, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
	CheckCircleOutline as CheckedIcon, RadioButtonUnchecked as UncheckedIcon,
	Person as PersonIcon, Schedule as TimeIcon, WarningAmberRounded as OverdueIcon,
} from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import type { HRChecklistInstance, HRChecklistTemplate } from '../../../../models/hr';

interface TrackerDetailDialogProps {
	open: boolean;
	onClose: () => void;
	instance: HRChecklistInstance | null;
	template: HRChecklistTemplate | undefined;
	onToggleTask: (taskId: string, currentlyCompleted: boolean) => void;
}

const TrackerDetailDialog: React.FC<TrackerDetailDialogProps> = ({ open, onClose, instance, template, onToggleTask }) => {
	const theme = useTheme();
	const today = new Date().toISOString().split('T')[0];

	if (!instance) return null;
	const isOnboarding = instance.checklist_type === 'onboarding';

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={instance.employee_name || 'Checklist Tracker'}
			subtitle={`Template: ${instance.template_name}`}
			maxWidth="md"
			actions={
				<Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: 'text.secondary' }}>
					Close
				</Button>
			}
		>
			<Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
				<Chip
					label={instance.status === 'completed' ? 'COMPLETED' : 'PENDING'}
					color={instance.status === 'completed' ? 'success' : 'warning'}
					sx={{ fontWeight: 800 }}
				/>
			</Stack>

			{instance.status === 'completed' && (
				<Box sx={{ p: 1.75, borderRadius: '14px', bgcolor: alpha(theme.palette.success.main, 0.08), mb: 2.5 }}>
					<Typography variant="caption" color="success.main" fontWeight={700}>
						{isOnboarding
							? 'All tasks complete — employee status set to Active.'
							: `All tasks complete — employee status set to ${(instance.others?.exit_reason === 'terminated') ? 'Terminated' : 'Resigned'}.`}
					</Typography>
				</Box>
			)}

			<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
				Checklist Tasks Progress
			</Typography>

			<Stack spacing={1.5}>
				{(template?.tasks || []).map((task) => {
					const taskState = instance.task_statuses[task.id] || { completed: false, completed_by_id: null, completed_at: null, due_date: null };
					const isOverdue = !taskState.completed && !!taskState.due_date && taskState.due_date < today;

					return (
						<Box
							key={task.id}
							sx={{
								p: 2, borderRadius: '14px', border: '1px solid',
								borderColor: taskState.completed
									? alpha(theme.palette.success.main, 0.4)
									: isOverdue ? alpha(theme.palette.error.main, 0.4) : 'divider',
								bgcolor: taskState.completed
									? alpha(theme.palette.success.main, 0.03)
									: isOverdue ? alpha(theme.palette.error.main, 0.03) : 'transparent',
								display: 'flex', alignItems: 'center', justifyContent: 'space-between',
							}}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Checkbox
									icon={<UncheckedIcon />}
									checkedIcon={<CheckedIcon color="success" />}
									checked={taskState.completed}
									onChange={() => onToggleTask(task.id, taskState.completed)}
								/>
								<Box>
									<Typography
										variant="body2"
										fontWeight={700}
										sx={{
											textDecoration: taskState.completed ? 'line-through' : 'none',
											color: taskState.completed ? 'text.secondary' : 'text.primary',
										}}
									>
										{task.title}
									</Typography>
									<Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
										<Chip label={`Requires: ${task.role_required.toUpperCase()}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
										{isOverdue && (
											<Chip icon={<OverdueIcon sx={{ fontSize: '0.7rem !important' }} />} label="Overdue" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem' }} />
										)}
									</Stack>
								</Box>
							</Box>

							<Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
								{taskState.completed ? (
									<>
										<Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<PersonIcon sx={{ fontSize: '0.8rem' }} /> Marked done
										</Typography>
										{taskState.completed_at && (
											<Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
												<TimeIcon sx={{ fontSize: '0.8rem' }} />
												{new Date(taskState.completed_at).toLocaleString()}
											</Typography>
										)}
									</>
								) : taskState.due_date ? (
									<Typography variant="caption" color={isOverdue ? 'error.main' : 'text.disabled'} fontWeight={isOverdue ? 700 : 400}>
										Due {new Date(taskState.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
									</Typography>
								) : null}
							</Box>
						</Box>
					);
				})}
			</Stack>
		</BaseDialog>
	);
};

export default TrackerDetailDialog;
