import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { AddButton, CancelButton } from '../../../../common/button';
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
	const [addOpen, setAddOpen] = useState(false);

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
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Typography sx={sectionTitleSx}>Activity History</Typography>
					{addOpen ? (
						<CancelButton
							startIcon={<Close />}
							onClick={() => setAddOpen(false)}
							variant="outlined"
							size="small"
							sx={{ borderRadius: '8px', py: 0.5, px: 1.5, fontSize: '0.75rem', flexShrink: 0 }}
						/>
					) : (
						<AddButton
							onClick={() => setAddOpen(true)}
							size="small"
							sx={{ borderRadius: '8px', py: 0.5, px: 1.5, fontSize: '0.75rem', flexShrink: 0 }}
						>
							Add Activity
						</AddButton>
					)}
				</Box>

				{addOpen && (
					<Box sx={{ mb: 2 }}>
						<NotesComposer
							entityType="deal"
							entityId={deal.id}
							onCreated={() => {
								dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }));
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
