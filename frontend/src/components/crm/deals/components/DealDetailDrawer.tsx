import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, Divider, TextField, InputAdornment } from '@mui/material';
import { Business, Person } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { NotesComposer, NotesTimeline } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEntityActivities, clearActivities, updateDeal } from '../../../../store/slices/crmSlice';
import type { Deal } from '../../../../models/crm/deal';

interface DealDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	deal: Deal | null;
}

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({ open, onClose, deal }) => {
	const dispatch = useAppDispatch();
	const { activities, activitiesLoading, companyOptions, contactOptions } = useAppSelector((state) => state.crm);

	const [value, setValue] = useState('');
	const [closeDate, setCloseDate] = useState('');

	useEffect(() => {
		if (open && deal) {
			dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }));
			setValue(deal.value != null ? String(deal.value) : '');
			setCloseDate(deal.close_date || '');
		} else {
			dispatch(clearActivities());
		}
	}, [open, deal, dispatch]);

	if (!deal) return null;

	const company = companyOptions.find((c) => c.id === deal.company_id);
	const contact = contactOptions.find((c) => c.id === deal.contact_id);

	const saveValue = () => {
		const numeric = value ? Number(value) : undefined;
		if (numeric !== deal.value) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { value: numeric } }));
		}
	};

	const saveCloseDate = () => {
		if (closeDate !== (deal.close_date || '')) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { close_date: closeDate || undefined } }));
		}
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={deal.title}
			width={520}
			headerExtra={<StatusBadge label={deal.status} status={deal.status} type="deal" />}
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
				</Stack>

				<Stack direction="row" spacing={2}>
					<TextField
						label="Value"
						type="number"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onBlur={saveValue}
						size="small"
						fullWidth
						InputProps={{ endAdornment: <InputAdornment position="end">{deal.currency}</InputAdornment> }}
					/>
					<TextField
						label="Probability"
						value={`${deal.probability}%`}
						size="small"
						fullWidth
						disabled
						helperText="Set automatically by stage"
					/>
				</Stack>

				<TextField
					label="Close Date"
					type="date"
					value={closeDate}
					onChange={(e) => setCloseDate(e.target.value)}
					onBlur={saveCloseDate}
					size="small"
					fullWidth
					InputLabelProps={{ shrink: true }}
				/>

				{deal.lost_reason && (
					<Typography variant="body2" color="error.main">Lost reason: {deal.lost_reason}</Typography>
				)}

				<Divider />

				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notes</Typography>
				<NotesComposer
					entityType="deal"
					entityId={deal.id}
					onCreated={() => dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }))}
				/>
				<NotesTimeline activities={activities} loading={activitiesLoading} />
			</Box>
		</DetailDrawer>
	);
};

export default DealDetailDrawer;
