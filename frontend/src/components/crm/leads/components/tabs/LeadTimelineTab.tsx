import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import { NotesTimeline } from '../../../shared';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchEntityActivities, clearActivities } from '../../../../../store/slices/crmSlice';
import type { Lead } from '../../../../../models/crm/lead';

interface LeadTimelineTabProps {
	lead: Lead;
}

export const LeadTimelineTab: React.FC<LeadTimelineTabProps> = ({ lead }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (lead.id) {
			dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }));
		}
		return () => {
			dispatch(clearActivities());
		};
	}, [lead.id, dispatch]);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
			<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Activity History</Typography>
				<PremiumTooltip title="Timeline trace of logged phone calls, emails, notes, tasks, and meetings. Helps keep your sales outreach history transparent." arrow placement="right">
					<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
				</PremiumTooltip>
			</Box>
			<NotesTimeline activities={activities} loading={activitiesLoading} />
		</Box>
	);
};
