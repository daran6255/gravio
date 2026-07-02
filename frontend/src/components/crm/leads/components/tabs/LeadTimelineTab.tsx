import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { HelpOutline, Add, Close } from '@mui/icons-material';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import { NotesComposer, NotesTimeline } from '../../../shared';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchEntityActivities, clearActivities } from '../../../../../store/slices/crmSlice';
import type { Lead } from '../../../../../models/crm/lead';

interface LeadTimelineTabProps {
	lead: Lead;
}

export const LeadTimelineTab: React.FC<LeadTimelineTabProps> = ({ lead }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading } = useAppSelector((state) => state.crm);
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		if (lead.id) {
			dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }));
		}
		return () => {
			dispatch(clearActivities());
		};
	}, [lead.id, dispatch]);

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
	};

	return (
		<Stack spacing={2.5}>
			{/* Activity History Section */}
			<Box>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={0.5}>
						<Typography sx={sectionTitleSx}>Activity History</Typography>
						<PremiumTooltip title="Timeline trace of logged phone calls, emails, notes, tasks, and meetings. Helps keep your sales outreach history transparent." arrow placement="right">
							<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
						</PremiumTooltip>
					</Box>
					<Button
						startIcon={addOpen ? <Close /> : <Add />}
						onClick={() => setAddOpen((v) => !v)}
						variant={addOpen ? 'outlined' : 'contained'}
						size="small"
						sx={{
							borderRadius: '8px',
							textTransform: 'none',
							fontWeight: 700,
							py: 0.5,
							px: 1.5,
							fontSize: '0.75rem',
							flexShrink: 0,
							...(!addOpen && {
								background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
								boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
							}),
						}}
					>
						{addOpen ? 'Cancel' : 'Add Activity'}
					</Button>
				</Box>

				{addOpen && (
					<Box sx={{ mb: 2 }}>
						<NotesComposer
							entityType="lead"
							entityId={lead.id}
							onCreated={() => {
								dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }));
								setAddOpen(false);
							}}
						/>
					</Box>
				)}

				<NotesTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</Stack>
	);
};
