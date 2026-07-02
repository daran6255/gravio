import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
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
