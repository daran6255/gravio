import React from 'react';
import { Box, TextField, MenuItem, Stack } from '@mui/material';
import type { CRMActivityType } from '../../../../models/crm/crmActivity';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

const TYPE_OPTIONS: CRMActivityType[] = ['note', 'call', 'email', 'meeting', 'task', 'whatsapp'];

interface ActivityFeedFiltersProps {
	type: string;
	onTypeChange: (value: string) => void;
	ownerId: number | '';
	onOwnerChange: (value: number | '') => void;
	owners: CRMOwnerOption[];
	dateFrom: string;
	onDateFromChange: (value: string) => void;
	dateTo: string;
	onDateToChange: (value: string) => void;
}

export const ActivityFeedFilters: React.FC<ActivityFeedFiltersProps> = ({
	type,
	onTypeChange,
	ownerId,
	onOwnerChange,
	owners,
	dateFrom,
	onDateFromChange,
	dateTo,
	onDateToChange,
}) => {
	return (
		<Box sx={{ p: 2, mb: 2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
				<TextField
					select
					label="Type"
					value={type}
					onChange={(e) => onTypeChange(e.target.value)}
					size="small"
					sx={{ minWidth: 140 }}
				>
					<MenuItem value="">All Types</MenuItem>
					{TYPE_OPTIONS.map((t) => (
						<MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Owner"
					value={ownerId}
					onChange={(e) => onOwnerChange(e.target.value === '' ? '' : Number(e.target.value))}
					size="small"
					sx={{ minWidth: 160 }}
				>
					<MenuItem value="">All Owners</MenuItem>
					{owners.map((o) => (
						<MenuItem key={o.id} value={o.id}>{o.full_name || o.email}</MenuItem>
					))}
				</TextField>

				<TextField
					type="date"
					label="From"
					value={dateFrom}
					onChange={(e) => onDateFromChange(e.target.value)}
					size="small"
					InputLabelProps={{ shrink: true }}
				/>

				<TextField
					type="date"
					label="To"
					value={dateTo}
					onChange={(e) => onDateToChange(e.target.value)}
					size="small"
					InputLabelProps={{ shrink: true }}
				/>
			</Stack>
		</Box>
	);
};

export default ActivityFeedFilters;
