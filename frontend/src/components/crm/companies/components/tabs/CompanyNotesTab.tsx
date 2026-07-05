import React, { useState } from 'react';
import { Box, Typography, Stack, Button, useTheme, alpha } from '@mui/material';
import { History, Add, Close } from '@mui/icons-material';
import { NotesComposer, NotesTimeline } from '../../../shared';
import { fetchEntityActivities } from '../../../../../store/slices/crmSlice';
import { useAppDispatch } from '../../../../../store/hooks';
import type { Company } from '../../../../../models/crm/company';
import type { CRMActivity } from '../../../../../models/crm/crmActivity';

interface CompanyNotesTabProps {
	company: Company;
	activities: CRMActivity[];
	activitiesLoading: boolean;
}

export const CompanyNotesTab: React.FC<CompanyNotesTabProps> = ({ company, activities, activitiesLoading }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [addOpen, setAddOpen] = useState(false);

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
	};

	return (
		<Stack spacing={2}>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Stack direction="row" spacing={1} alignItems="center">
					<Box sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08), p: 0.6, borderRadius: '50%', color: 'secondary.main', display: 'flex' }}>
						<History sx={{ fontSize: 15 }} />
					</Box>
					<Typography variant="caption" sx={sectionTitleSx}>Activity History</Typography>
					<Box
						sx={{
							px: 1,
							py: 0.25,
							borderRadius: '999px',
							bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.18 : 0.1),
							color: 'secondary.main',
							fontSize: '0.68rem',
							fontWeight: 700,
						}}
					>
						{activities.length} logged
					</Box>
				</Stack>
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
			</Stack>

			{addOpen && (
				<Box>
					<NotesComposer
						entityType="company"
						entityId={company.id}
						onCreated={() => {
							dispatch(fetchEntityActivities({ entityType: 'company', entityId: company.id }));
							setAddOpen(false);
						}}
					/>
				</Box>
			)}

			<Box sx={{ mt: 1 }}>
				<NotesTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</Stack>
	);
};

export default CompanyNotesTab;
