import React from 'react';
import { Box, Typography, Stack, TextField, MenuItem, Button, useTheme, alpha } from '@mui/material';
import { FilterAltOff } from '@mui/icons-material';
import { LEAD_SOURCES, LEAD_PRIORITIES } from '../constants';
import type { LeadStatus, LeadSource, LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import type { CRMLeadStats } from '../../../../models/crm/crmStats';

interface StatusOption {
	value: LeadStatus | '';
	label: string;
	count: number;
}

interface LeadsFilterPanelProps {
	stats: CRMLeadStats | null;
	status: LeadStatus | '';
	priority: LeadPriority | '';
	source: LeadSource | '';
	ownerId: number | '';
	owners: CRMOwnerOption[];
	onStatusChange: (status: LeadStatus | '') => void;
	onPriorityChange: (priority: LeadPriority | '') => void;
	onSourceChange: (source: LeadSource | '') => void;
	onOwnerChange: (ownerId: number | '') => void;
	onClear: () => void;
}

export const LeadsFilterPanel: React.FC<LeadsFilterPanelProps> = ({
	stats,
	status,
	priority,
	source,
	ownerId,
	owners,
	onStatusChange,
	onPriorityChange,
	onSourceChange,
	onOwnerChange,
	onClear,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const hasActiveFilters = !!(status || priority || source || ownerId);

	const statusOptions: StatusOption[] = [
		{ value: '', label: 'All Leads', count: stats?.total_leads ?? 0 },
		{ value: 'new', label: 'New', count: stats?.new_count ?? 0 },
		{ value: 'contacted', label: 'Contacted', count: stats?.contacted_count ?? 0 },
		{ value: 'qualified', label: 'Qualified', count: stats?.qualified_count ?? 0 },
		{ value: 'unqualified', label: 'Unqualified', count: stats?.unqualified_count ?? 0 },
		{ value: 'converted', label: 'Converted', count: stats?.converted_count ?? 0 },
	];

	return (
		<Box
			sx={{
				borderRadius: '16px',
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
				bgcolor: 'background.paper',
				p: 2.5,
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Filters</Typography>
				{hasActiveFilters && (
					<Button
						size="small"
						startIcon={<FilterAltOff fontSize="small" />}
						onClick={onClear}
						sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
					>
						Clear
					</Button>
				)}
			</Stack>

			<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
				Status
			</Typography>
			<Stack spacing={0.5} sx={{ mt: 1, mb: 2.5 }}>
				{statusOptions.map((opt) => {
					const active = status === opt.value;
					return (
						<Box
							key={opt.label}
							onClick={() => onStatusChange(opt.value)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								px: 1.25,
								py: 0.75,
								borderRadius: '10px',
								cursor: 'pointer',
								bgcolor: active ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1) : 'transparent',
								color: active ? 'primary.main' : 'text.secondary',
								transition: 'background-color 0.15s',
								'&:hover': { bgcolor: active ? alpha(theme.palette.primary.main, isDark ? 0.22 : 0.14) : 'action.hover' },
							}}
						>
							<Typography variant="body2" sx={{ fontWeight: active ? 700 : 500 }}>{opt.label}</Typography>
							<Typography variant="caption" sx={{ fontWeight: 700 }}>{opt.count}</Typography>
						</Box>
					);
				})}
			</Stack>

			<Stack spacing={2}>
				<TextField
					select
					label="Priority"
					value={priority}
					onChange={(e) => onPriorityChange(e.target.value as LeadPriority | '')}
					fullWidth
					size="small"
				>
					<MenuItem value="">All Priorities</MenuItem>
					{LEAD_PRIORITIES.map((p) => (
						<MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Source"
					value={source}
					onChange={(e) => onSourceChange(e.target.value as LeadSource | '')}
					fullWidth
					size="small"
				>
					<MenuItem value="">All Sources</MenuItem>
					{LEAD_SOURCES.map((s) => (
						<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Owner"
					value={ownerId}
					onChange={(e) => onOwnerChange(e.target.value === '' ? '' : Number(e.target.value))}
					fullWidth
					size="small"
				>
					<MenuItem value="">All Owners</MenuItem>
					{owners.map((o) => (
						<MenuItem key={o.id} value={o.id}>{o.full_name || o.email}</MenuItem>
					))}
				</TextField>
			</Stack>
		</Box>
	);
};

export default LeadsFilterPanel;
