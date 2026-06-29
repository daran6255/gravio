import React, { useEffect } from 'react';
import { Stack } from '@mui/material';
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

	return (
		<Stack spacing={2}>
			<NotesComposer
				entityType="deal"
				entityId={deal.id}
				onCreated={() => dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }))}
			/>
			<NotesTimeline activities={activities} loading={activitiesLoading} />
		</Stack>
	);
};
