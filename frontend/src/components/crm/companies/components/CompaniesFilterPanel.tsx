import React from 'react';
import { Box, Typography, Stack, TextField, MenuItem, Button, useTheme, alpha } from '@mui/material';
import { FilterAltOff, HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../common/PremiumTooltip';
import { COMPANY_SIZES } from '../constants';
import type { CompanyStatus, CompanySize } from '../../../../models/crm/company';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import type { CRMCompanyStats } from '../../../../models/crm/crmStats';

interface StatusOption {
	value: CompanyStatus | '';
	label: string;
	count: number;
}

interface CompaniesFilterPanelProps {
	stats: CRMCompanyStats | null;
	status: CompanyStatus | '';
	industry: string | '';
	size: CompanySize | '';
	ownerId: number | '';
	owners: CRMOwnerOption[];
	onStatusChange: (status: CompanyStatus | '') => void;
	onIndustryChange: (industry: string | '') => void;
	onSizeChange: (size: CompanySize | '') => void;
	onOwnerChange: (ownerId: number | '') => void;
	onClear: () => void;
}

export const CompaniesFilterPanel: React.FC<CompaniesFilterPanelProps> = ({
	stats,
	status,
	industry,
	size,
	ownerId,
	owners,
	onStatusChange,
	onIndustryChange,
	onSizeChange,
	onOwnerChange,
	onClear,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const hasActiveFilters = !!(status || industry || size || ownerId);

	const statusOptions: StatusOption[] = [
		{ value: '', label: 'All Companies', count: stats?.total_companies ?? 0 },
		{ value: 'prospect', label: 'Prospect', count: stats?.prospect_count ?? 0 },
		{ value: 'customer', label: 'Customer', count: stats?.customer_count ?? 0 },
		{ value: 'churned', label: 'Churned', count: stats?.churned_count ?? 0 },
		{ value: 'partner', label: 'Partner', count: stats?.partner_count ?? 0 },
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
				<Box display="flex" alignItems="center" gap={0.5}>
					<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Filters</Typography>
					<PremiumTooltip title="Filter your accounts by lifecycle status, industry, company size, or owner." arrow placement="right">
						<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Box>
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
					label="Industry"
					value={industry}
					onChange={(e) => onIndustryChange(e.target.value)}
					fullWidth
					size="small"
				>
					<MenuItem value="">All Industries</MenuItem>
					{(stats?.by_industry ?? []).map((i) => (
						<MenuItem key={i.industry} value={i.industry}>{i.industry}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Size"
					value={size}
					onChange={(e) => onSizeChange(e.target.value as CompanySize | '')}
					fullWidth
					size="small"
				>
					<MenuItem value="">All Sizes</MenuItem>
					{COMPANY_SIZES.map((s) => (
						<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
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

export default CompaniesFilterPanel;
