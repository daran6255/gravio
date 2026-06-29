import React, { useEffect, useState } from 'react';
import { Box, Stack, IconButton, Tooltip, Tabs, Tab, useTheme } from '@mui/material';
import { Edit } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchEntityActivities,
	clearActivities,
	fetchLinkedContacts,
	fetchLinkedDeals,
	clearLinkedRecords,
} from '../../../../store/slices/crmSlice';
import type { Company } from '../../../../models/crm/company';

// Import subcomponents from tabs subdirectory
import {
	CompanyDetailsTab,
	CompanyContactsTab,
	CompanyDealsTab,
	CompanyNotesTab,
} from './tabs';

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
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [tab, setTab] = useState(0);
	const [prevCompanyId, setPrevCompanyId] = useState<number | undefined>(company?.id);

	if (company?.id !== prevCompanyId) {
		setPrevCompanyId(company?.id);
		setTab(0);
	}

	const {
		activities,
		activitiesLoading,
		linkedContacts,
		linkedContactsLoading,
		linkedDeals,
		linkedDealsLoading,
	} = useAppSelector((state) => state.crm);

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
			width={600}
			disablePadding={true}
			headerExtra={<StatusBadge label={company.status} status={company.status} type="company" />}
			headerActions={
				<Stack direction="row" spacing={1} sx={{ mr: 1 }}>
					<Tooltip title="Edit Company">
						<IconButton
							size="small"
							onClick={() => {
								onClose();
								onEdit(company);
							}}
							sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
						>
							<Edit fontSize="small" />
						</IconButton>
					</Tooltip>
				</Stack>
			}
		>
			{/* Tabs Navigation */}
			<Tabs
				value={tab}
				onChange={(_, newValue) => setTab(newValue)}
				variant="fullWidth"
				sx={{
					borderBottom: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					'& .MuiTab-root': {
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.8rem',
						minHeight: 44,
					}
				}}
			>
				<Tab label="Details" />
				<Tab label={`Contacts (${linkedContacts.length})`} />
				<Tab label={`Deals (${linkedDeals.length})`} />
				<Tab label="Notes" />
			</Tabs>

			{/* Scrollable drawer body */}
			<Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overscrollBehavior: 'contain' }}>
				{tab === 0 && <CompanyDetailsTab company={company} address={address} />}
				{tab === 1 && <CompanyContactsTab company={company} linkedContacts={linkedContacts} linkedContactsLoading={linkedContactsLoading} />}
				{tab === 2 && <CompanyDealsTab linkedDeals={linkedDeals} linkedDealsLoading={linkedDealsLoading} />}
				{tab === 3 && <CompanyNotesTab company={company} activities={activities} activitiesLoading={activitiesLoading} />}
			</Box>
		</DetailDrawer>
	);
};

export default CompanyDetailDrawer;
