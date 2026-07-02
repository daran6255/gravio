import React, { useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ButtonDialog } from '../../../../common/dialogbox';
import { NotesComposer, NotesTimeline } from '../../../shared';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchEntityActivities, clearActivities } from '../../../../../store/slices/crmSlice';
import type { Deal } from '../../../../../models/crm/deal';

interface DealNotesTabProps {
	deal: Deal;
}

export const DealNotesTab: React.FC<DealNotesTabProps> = ({ deal }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (deal.id) {
			dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }));
		}
		return () => {
			dispatch(clearActivities());
		};
	}, [deal.id, dispatch]);

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
	};

	return (
		<Stack spacing={2.5}>
			<Box>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
					<Typography sx={sectionTitleSx}>Activity History</Typography>
					<ButtonDialog
						buttonLabel="Add Activity"
						title="Log Activity"
						subtitle="Notes, calls, and emails logged here will populate the Timeline."
						maxWidth="sm"
					>
						{({ close }) => (
							<NotesComposer
								entityType="deal"
								entityId={deal.id}
								onCreated={() => {
									dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }));
									close();
								}}
							/>
						)}
					</ButtonDialog>
				</Box>
				<NotesTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</Stack>
	);
};
