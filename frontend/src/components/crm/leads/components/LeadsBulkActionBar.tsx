import React from 'react';
import { Box, Typography, TextField, MenuItem, Button, Stack } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { LeadStatus } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];

interface LeadsBulkActionBarProps {
	selectedCount: number;
	owners: CRMOwnerOption[];
	loading: boolean;
	onReassign: (ownerId: number) => void;
	onChangeStatus: (status: LeadStatus) => void;
	onClear: () => void;
}

export const LeadsBulkActionBar: React.FC<LeadsBulkActionBarProps> = ({
	selectedCount,
	owners,
	loading,
	onReassign,
	onChangeStatus,
	onClear,
}) => {
	if (selectedCount === 0) return null;

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				flexWrap: 'wrap',
				gap: 1.5,
				p: 1.5,
				mb: 2,
				borderRadius: '14px',
				border: '1px solid',
				borderColor: 'primary.main',
				bgcolor: 'action.hover',
			}}
		>
			<Typography variant="body2" sx={{ fontWeight: 700, mr: 1 }}>
				{selectedCount} selected
			</Typography>

			<TextField
				select
				size="small"
				label="Reassign Owner"
				value=""
				onChange={(e) => onReassign(Number(e.target.value))}
				disabled={loading}
				sx={{ minWidth: 180 }}
			>
				{owners.map((o) => (
					<MenuItem key={o.id} value={o.id}>{o.full_name || o.email}</MenuItem>
				))}
			</TextField>

			<TextField
				select
				size="small"
				label="Change Status"
				value=""
				onChange={(e) => onChangeStatus(e.target.value as LeadStatus)}
				disabled={loading}
				sx={{ minWidth: 160 }}
			>
				{LEAD_STATUSES.map((s) => (
					<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
				))}
			</TextField>

			<Stack direction="row" sx={{ ml: 'auto' }}>
				<Button
					size="small"
					startIcon={<Close fontSize="small" />}
					onClick={onClear}
					sx={{ textTransform: 'none', fontWeight: 600 }}
				>
					Clear
				</Button>
			</Stack>
		</Box>
	);
};

export default LeadsBulkActionBar;
