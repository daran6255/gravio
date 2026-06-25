import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Stack, Checkbox } from '@mui/material';
import { useAppDispatch } from '../../../../store/hooks';
import { updateActivity } from '../../../../store/slices/crmSlice';
import type { CRMActivity } from '../../../../models/crm/crmActivity';

interface MyTasksWidgetProps {
	tasks: CRMActivity[];
}

const isOverdue = (dueDate?: string) => !!dueDate && new Date(dueDate) < new Date();

const formatDue = (iso: string) => new Date(iso).toLocaleString(undefined, {
	month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

export const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({ tasks }) => {
	const dispatch = useAppDispatch();
	const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

	const visibleTasks = tasks.filter((t) => !completedIds.has(t.public_id));

	const handleComplete = (task: CRMActivity) => {
		setCompletedIds((prev) => new Set(prev).add(task.public_id));
		dispatch(updateActivity({ publicId: task.public_id, payload: { is_completed: true } }));
	};

	return (
		<Card sx={{ borderRadius: '16px', height: '100%' }}>
			<CardContent>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
					My Tasks {visibleTasks.length > 0 && `(${visibleTasks.length})`}
				</Typography>
				{visibleTasks.length === 0 ? (
					<Box sx={{ py: 6, textAlign: 'center' }}>
						<Typography variant="body2" color="text.secondary">You're all caught up.</Typography>
					</Box>
				) : (
					<Stack spacing={1}>
						{visibleTasks.map((task) => {
							const overdue = isOverdue(task.due_date);
							return (
								<Stack
									key={task.public_id}
									direction="row"
									alignItems="flex-start"
									spacing={1}
									sx={{
										p: 1,
										borderRadius: '10px',
										border: '1px solid',
										borderColor: overdue ? 'error.main' : 'divider',
										bgcolor: overdue ? 'rgba(244, 67, 54, 0.04)' : 'transparent',
									}}
								>
									<Checkbox size="small" checked={false} onChange={() => handleComplete(task)} sx={{ p: 0.25, mt: 0.25 }} />
									<Box sx={{ minWidth: 0 }}>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>{task.subject}</Typography>
										{task.due_date && (
											<Typography variant="caption" color={overdue ? 'error.main' : 'text.secondary'}>
												{overdue ? 'Overdue · ' : 'Due '}{formatDue(task.due_date)}
											</Typography>
										)}
									</Box>
								</Stack>
							);
						})}
					</Stack>
				)}
			</CardContent>
		</Card>
	);
};

export default MyTasksWidget;
