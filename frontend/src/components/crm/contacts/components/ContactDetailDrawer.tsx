import React, { useEffect } from 'react';
import { Box, Typography, Stack, Divider, IconButton, Tooltip, List, ListItem, ListItemText } from '@mui/material';
import { Edit, Business, Phone, Email, Smartphone, AttachMoney } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { ActivityComposer, ActivityTimeline } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEntityActivities, clearActivities, fetchLinkedDeals, clearLinkedRecords } from '../../../../store/slices/crmSlice';
import type { Contact } from '../../../../models/crm/contact';

interface ContactDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
	onEdit: (contact: Contact) => void;
}

export const ContactDetailDrawer: React.FC<ContactDetailDrawerProps> = ({ open, onClose, contact, onEdit }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading, linkedDeals, linkedDealsLoading, companyOptions } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (open && contact) {
			dispatch(fetchEntityActivities({ entityType: 'contact', entityId: contact.id }));
			dispatch(fetchLinkedDeals({ contactId: contact.id }));
		} else {
			dispatch(clearActivities());
			dispatch(clearLinkedRecords());
		}
	}, [open, contact, dispatch]);

	if (!contact) return null;

	const company = companyOptions.find((c) => c.id === contact.company_id);

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={`${contact.first_name} ${contact.last_name || ''}`.trim()}
			subtitle={contact.job_title}
			width={520}
			headerActions={
				<Tooltip title="Edit Contact">
					<IconButton size="small" onClick={() => onEdit(contact)}>
						<Edit fontSize="small" />
					</IconButton>
				</Tooltip>
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
					{contact.phone && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Phone fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{contact.phone}</Typography>
						</Stack>
					)}
					{contact.mobile && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Smartphone fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{contact.mobile}</Typography>
						</Stack>
					)}
					{contact.email && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Email fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{contact.email}</Typography>
						</Stack>
					)}
				</Stack>

				<Divider />

				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
						Open Deals {linkedDeals.length > 0 && `(${linkedDeals.length})`}
					</Typography>
					{linkedDealsLoading ? (
						<Typography variant="caption" color="text.secondary">Loading...</Typography>
					) : linkedDeals.length === 0 ? (
						<Typography variant="caption" color="text.secondary">No deals linked yet.</Typography>
					) : (
						<List dense disablePadding>
							{linkedDeals.map((deal) => (
								<ListItem key={deal.public_id} sx={{ borderRadius: '8px', px: 1 }}>
									<AttachMoney fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
									<ListItemText
										primary={deal.title}
										secondary={deal.value != null ? `${deal.value.toLocaleString()} ${deal.currency}` : undefined}
										primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
										secondaryTypographyProps={{ variant: 'caption' }}
									/>
									<StatusBadge label={deal.status} status={deal.status} type="deal" />
								</ListItem>
							))}
						</List>
					)}
				</Box>

				<Divider />

				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Activity</Typography>
				<ActivityComposer
					entityType="contact"
					entityId={contact.id}
					onCreated={() => dispatch(fetchEntityActivities({ entityType: 'contact', entityId: contact.id }))}
				/>
				<ActivityTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</DetailDrawer>
	);
};

export default ContactDetailDrawer;
