import React from 'react';
import { Box, Typography } from '@mui/material';
import { NotesComposer, NotesTimeline } from '../../../shared';
import { fetchEntityActivities } from '../../../../../store/slices/crmSlice';
import { useAppDispatch } from '../../../../../store/hooks';
import type { Company } from '../../../../../models/crm/company';

interface CompanyNotesTabProps {
	company: Company;
	activities: any[];
	activitiesLoading: boolean;
}

export const CompanyNotesTab: React.FC<CompanyNotesTabProps> = ({ company, activities, activitiesLoading }) => {
	const dispatch = useAppDispatch();

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notes</Typography>
			<NotesComposer
				entityType="company"
				entityId={company.id}
				onCreated={() => dispatch(fetchEntityActivities({ entityType: 'company', entityId: company.id }))}
			/>
			<NotesTimeline activities={activities} loading={activitiesLoading} />
		</Box>
	);
};

export default CompanyNotesTab;
