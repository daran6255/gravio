import React, { useEffect } from 'react';
import { Box, Typography, Stack, Divider, IconButton, Tooltip, List, ListItem, ListItemText } from '@mui/material';
import { Edit, Language, Phone, Email, LocationOn, Person, AttachMoney } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { NotesComposer, NotesTimeline } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEntityActivities, clearActivities, fetchLinkedContacts, fetchLinkedDeals, clearLinkedRecords } from '../../../../store/slices/crmSlice';
import type { Company } from '../../../../models/crm/company';

interface CompanyDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	company: Company | null;
	onEdit: (company: Company) => void;
}

const formatAddress = (company: Company) => {
	const { address } = company;
	if (!address) return null;
	return [address.street, address.city, address.state, address.country, address.zip].filter(Boolean).join(', ') || null;
};

export const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({ open, onClose, company, onEdit }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading, linkedContacts, linkedContactsLoading, linkedDeals, linkedDealsLoading } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (open && company) {
			dispatch(fetchEntityActivities({ entityType: 'company', entityId: company.id }));
			dispatch(fetchLinkedContacts(company.id));
			dispatch(fetchLinkedDeals({ companyId: company.id }));
		} else {
			dispatch(clearActivities());
			dispatch(clearLinkedRecords());
		}
	}, [open, company, dispatch]);

	if (!company) return null;

	const address = formatAddress(company);

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={company.name}
			width={520}
			headerExtra={<StatusBadge label={company.status} status={company.status} type="company" />}
			headerActions={
				<Tooltip title="Edit Company">
					<IconButton size="small" onClick={() => onEdit(company)}>
						<Edit fontSize="small" />
					</IconButton>
				</Tooltip>
			}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
				<Stack spacing={1}>
					{company.industry && (
						<Typography variant="body2" color="text.secondary">{company.industry}</Typography>
					)}
					{company.website && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Language fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{company.website}</Typography>
						</Stack>
					)}
					{company.phone && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Phone fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{company.phone}</Typography>
						</Stack>
					)}
					{company.email && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Email fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{company.email}</Typography>
						</Stack>
					)}
					{address && (
						<Stack direction="row" spacing={1} alignItems="center">
							<LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
							<Typography variant="body2">{address}</Typography>
						</Stack>
					)}
				</Stack>

				<Divider />

				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
						Contacts {linkedContacts.length > 0 && `(${linkedContacts.length})`}
					</Typography>
					{linkedContactsLoading ? (
						<Typography variant="caption" color="text.secondary">Loading...</Typography>
					) : linkedContacts.length === 0 ? (
						<Typography variant="caption" color="text.secondary">No contacts linked yet.</Typography>
					) : (
						<List dense disablePadding>
							{linkedContacts.map((contact) => (
								<ListItem key={contact.public_id} sx={{ borderRadius: '8px', px: 1 }}>
									<Person fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
									<ListItemText
										primary={`${contact.first_name} ${contact.last_name || ''}`.trim()}
										secondary={contact.job_title || contact.email}
										primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
										secondaryTypographyProps={{ variant: 'caption' }}
									/>
								</ListItem>
							))}
						</List>
					)}
				</Box>

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

				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notes</Typography>
				<NotesComposer
					entityType="company"
					entityId={company.id}
					onCreated={() => dispatch(fetchEntityActivities({ entityType: 'company', entityId: company.id }))}
				/>
				<NotesTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</DetailDrawer>
	);
};

export default CompanyDetailDrawer;
