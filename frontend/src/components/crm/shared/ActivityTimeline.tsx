import React from 'react';
import { Checkbox, IconButton, Tooltip } from '@mui/material';
import { Notes, Call, Email, Groups, CheckCircleOutline, WhatsApp, DeleteOutline } from '@mui/icons-material';
import type { CRMActivity, CRMActivityType } from '../../../models/crm/crmActivity';
import { useAppDispatch } from '../../../store/hooks';
import { updateActivity, deleteActivity } from '../../../store/slices/crmSlice';
import { Timeline, type TimelineItemDef } from '../../common/timeline';
import { RichTextViewer } from '../../common/form';

const TONES: Record<CRMActivityType, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
	note: {
		icon: <Notes sx={{ fontSize: 16 }} />,
		color: '#10B981', // green
		bgColor: 'rgba(16, 185, 129, 0.1)',
		borderColor: 'rgba(16, 185, 129, 0.2)',
	},
	call: {
		icon: <Call sx={{ fontSize: 16 }} />,
		color: '#8B5CF6', // purple
		bgColor: 'rgba(139, 92, 246, 0.1)',
		borderColor: 'rgba(139, 92, 246, 0.2)',
	},
	email: {
		icon: <Email sx={{ fontSize: 16 }} />,
		color: '#3B82F6', // blue
		bgColor: 'rgba(59, 130, 246, 0.1)',
		borderColor: 'rgba(59, 130, 246, 0.2)',
	},
	meeting: {
		icon: <Groups sx={{ fontSize: 16 }} />,
		color: '#EC4899', // pink
		bgColor: 'rgba(236, 72, 153, 0.1)',
		borderColor: 'rgba(236, 72, 153, 0.2)',
	},
	task: {
		icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
		color: '#F59E0B', // amber
		bgColor: 'rgba(245, 158, 11, 0.1)',
		borderColor: 'rgba(245, 158, 11, 0.2)',
	},
	whatsapp: {
		icon: <WhatsApp sx={{ fontSize: 16 }} />,
		color: '#25D366', // green
		bgColor: 'rgba(37, 211, 102, 0.1)',
		borderColor: 'rgba(37, 211, 102, 0.2)',
	},
};

const PREFIXES: Record<CRMActivityType, string> = {
	note: 'Logged Note',
	call: 'Logged Call',
	email: 'Logged Email',
	meeting: 'Scheduled Meeting',
	task: 'Logged Task',
	whatsapp: 'WhatsApp Message',
};

const formatDate = (iso: string) => {
	const date = new Date(iso);
	const now = new Date();
	
	const timeString = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	const isToday = date.toDateString() === now.toDateString();
	
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	const isYesterday = date.toDateString() === yesterday.toDateString();

	if (isToday) {
		return `Today, ${timeString}`;
	}
	if (isYesterday) {
		return `Yesterday, ${timeString}`;
	}
	
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	}) + `, ${timeString}`;
};

interface ActivityTimelineProps {
	activities: CRMActivity[];
	loading?: boolean;
	showEntityType?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, loading, showEntityType }) => {
	const dispatch = useAppDispatch();

	const timelineItems: TimelineItemDef[] = activities.map((activity) => {
		const formattedDue = activity.due_date ? `Due ${formatDate(activity.due_date)}` : '';
		const entityInfo = showEntityType ? `On ${activity.entity_type} #${activity.entity_id}` : '';
		const subtitleParts = [entityInfo, formattedDue].filter(Boolean);
		const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined;

		const tone = TONES[activity.type] || TONES.note;
		const titlePrefix = PREFIXES[activity.type] || 'Logged Activity';

		return {
			id: activity.public_id,
			title: `${titlePrefix}: ${activity.subject}`,
			subtitle,
			description: activity.description ? <RichTextViewer html={activity.description} /> : undefined,
			timestamp: formatDate(activity.created_at),
			icon: tone.icon,
			iconColor: tone.color,
			iconBgColor: tone.bgColor,
			iconBorderColor: tone.borderColor,
			isCompleted: activity.is_completed,
			actions: (
				<>
					{activity.type === 'task' && (
						<Checkbox
							size="small"
							checked={activity.is_completed}
							onChange={(e) => dispatch(updateActivity({
								publicId: activity.public_id,
								payload: { is_completed: e.target.checked },
							}))}
							sx={{
								color: 'text.secondary',
								'&.Mui-checked': { color: 'success.main' },
								p: 0.5,
							}}
						/>
					)}
					<Tooltip title="Delete">
						<IconButton 
							size="small" 
							onClick={() => dispatch(deleteActivity(activity.public_id))}
							sx={{
								color: 'text.disabled',
								'&:hover': { color: 'error.main' },
								p: 0.5,
							}}
						>
							<DeleteOutline sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
				</>
			)
		};
	});

	return (
		<Timeline
			items={timelineItems}
			loading={loading}
			emptyMessage="No activity yet. Log a call, note, or task above."
		/>
	);
};

export default ActivityTimeline;
