import React from 'react';
import { Box, Typography, Stack, Checkbox, IconButton, Tooltip } from '@mui/material';
import { Notes, Call, Email, Groups, CheckCircleOutline, WhatsApp, DeleteOutline } from '@mui/icons-material';
import type { CRMActivity, CRMActivityType } from '../../../models/crm/crmActivity';
import { useAppDispatch } from '../../../store/hooks';
import { updateActivity, deleteActivity } from '../../../store/slices/crmSlice';

const ICONS: Record<CRMActivityType, React.ReactNode> = {
	note: <Notes fontSize="small" />,
	call: <Call fontSize="small" />,
	email: <Email fontSize="small" />,
	meeting: <Groups fontSize="small" />,
	task: <CheckCircleOutline fontSize="small" />,
	whatsapp: <WhatsApp fontSize="small" />,
};

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, {
	month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

interface ActivityTimelineProps {
	activities: CRMActivity[];
	loading?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, loading }) => {
	const dispatch = useAppDispatch();

	if (loading) {
		return <Typography variant="body2" color="text.secondary">Loading activity…</Typography>;
	}

	if (activities.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 3 }}>
				<Typography variant="body2" color="text.secondary">No activity yet. Log a call, note, or task above.</Typography>
			</Box>
		);
	}

	return (
		<Stack spacing={1.5}>
			{activities.map((activity) => (
				<Box
					key={activity.public_id}
					sx={{
						display: 'flex',
						gap: 1.5,
						p: 1.5,
						borderRadius: '12px',
						border: '1px solid',
						borderColor: 'divider',
						opacity: activity.is_completed ? 0.6 : 1,
					}}
				>
					<Box sx={{
						width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						bgcolor: 'action.hover', color: 'text.secondary',
					}}>
						{ICONS[activity.type]}
					</Box>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
							<Typography
								variant="body2"
								sx={{
									fontWeight: 600,
									textDecoration: activity.is_completed ? 'line-through' : 'none',
								}}
							>
								{activity.subject}
							</Typography>
							<Stack direction="row" alignItems="center" spacing={0.25}>
								{activity.type === 'task' && (
									<Checkbox
										size="small"
										checked={activity.is_completed}
										onChange={(e) => dispatch(updateActivity({
											publicId: activity.public_id,
											payload: { is_completed: e.target.checked },
										}))}
									/>
								)}
								<Tooltip title="Delete">
									<IconButton size="small" onClick={() => dispatch(deleteActivity(activity.public_id))}>
										<DeleteOutline fontSize="small" />
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>
						{activity.description && (
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
								{activity.description}
							</Typography>
						)}
						<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
							{activity.due_date ? `Due ${formatDate(activity.due_date)} · ` : ''}
							Logged {formatDate(activity.created_at)}
						</Typography>
					</Box>
				</Box>
			))}
		</Stack>
	);
};

export default ActivityTimeline;
