import React, { useEffect } from 'react';
import { Box, Typography, Stack, Divider, IconButton, Tooltip } from '@mui/material';
import { Edit, SwapHoriz, Business, Person, AttachMoney } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { RichTextViewer } from '../../../common/form';
import { getCurrencySymbol } from '../../../../utils/currency';
import { ActivityComposer, ActivityTimeline } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEntityActivities, clearActivities } from '../../../../store/slices/crmSlice';
import type { Lead } from '../../../../models/crm/lead';

interface LeadDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	lead: Lead | null;
	onEdit: (lead: Lead) => void;
	onConvert: (lead: Lead) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ open, onClose, lead, onEdit, onConvert }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading } = useAppSelector((state) => state.crm);
	const { companyOptions, contactOptions } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (open && lead) {
			dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }));
		} else {
			dispatch(clearActivities());
		}
	}, [open, lead, dispatch]);

	if (!lead) return null;

	const company = companyOptions.find((c) => c.id === lead.company_id);
	const contact = contactOptions.find((c) => c.id === lead.contact_id);
	const isConverted = lead.status === 'converted';

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={lead.title}
			width={520}
			headerExtra={<StatusBadge label={lead.status} status={lead.status} type="lead" />}
			headerActions={
				<>
					{!isConverted && (
						<Tooltip title="Convert to Deal">
							<IconButton size="small" onClick={() => onConvert(lead)}>
								<SwapHoriz fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
					<Tooltip title="Edit Lead">
						<IconButton size="small" onClick={() => onEdit(lead)}>
							<Edit fontSize="small" />
						</IconButton>
					</Tooltip>
				</>
			}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
				<Stack spacing={1}>
					{company && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Business fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{company.name}</Typography>
						</Stack>
					)}
					{contact && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Person fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{contact.first_name} {contact.last_name || ''}</Typography>
						</Stack>
					)}
					{lead.estimated_value != null && (
						<Stack direction="row" spacing={1} alignItems="center">
							<AttachMoney fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{getCurrencySymbol(lead.currency)}{lead.estimated_value.toLocaleString()} {lead.currency}</Typography>
						</Stack>
					)}
				</Stack>

				{lead.description && <RichTextViewer html={lead.description} />}

				<Divider />

				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Activity</Typography>
				<ActivityComposer
					entityType="lead"
					entityId={lead.id}
					onCreated={() => dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }))}
				/>
				<ActivityTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</DetailDrawer>
	);
};

export default LeadDetailDrawer;
