import React, { useMemo } from 'react';
import { TableRow, TableCell, Typography, Stack, Checkbox, Chip, Tooltip, useTheme } from '@mui/material';
import { Visibility, Edit, SwapHoriz, DeleteOutline, HelpOutline } from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import StatusBadge from '../../../common/badge/StatusBadge';
import EnterpriseAvatar from '../../../common/avatar/Avatar';
import PremiumTooltip from '../../../common/PremiumTooltip';
import useDateTime from '../../../../hooks/useDateTime';
import type { Lead } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { formatMoney, formatRate } from '../../../../utils/currency';
import { isLeadStale } from '../../../../utils/leadStaleness';

interface LeadsTableProps {
	leads: Lead[];
	owners: CRMOwnerOption[];
	loading: boolean;
	totalCount: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onRefresh: () => void;
	onCreateClick: () => void;
	onRowClick: (lead: Lead) => void;
	onEdit: (lead: Lead) => void;
	onConvert: (lead: Lead) => void;
	onDelete: (lead: Lead) => void;
	selectable?: boolean;
	selectedIds?: Set<string>;
	onToggleSelect?: (publicId: string) => void;
	onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatCurrency = (value?: number, currency?: string) => {
	if (value == null) return '—';
	return formatMoney(value, currency);
};

export const LeadsTable: React.FC<LeadsTableProps> = ({
	leads,
	owners,
	loading,
	totalCount,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	searchTerm,
	onSearchChange,
	onRefresh,
	onCreateClick,
	onRowClick,
	onEdit,
	onConvert,
	onDelete,
	selectable,
	selectedIds,
	onToggleSelect,
	onSelectAll,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { formatDate } = useDateTime();
	const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o])), [owners]);

	const columns: ColumnDefinition<Lead>[] = [
		{
			id: 'title',
			label: (
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
					<span>Lead</span>
					<PremiumTooltip title="The name and primary details of the prospective recruit or candidate." arrow placement="top">
						<HelpOutline sx={{ fontSize: 12, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Stack>
			)
		},
		{
			id: 'status',
			label: (
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
					<span>Status</span>
					<PremiumTooltip title="The candidate's current recruitment pipeline phase (New, Contacted, Qualified, Unqualified, Converted)." arrow placement="top">
						<HelpOutline sx={{ fontSize: 12, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Stack>
			)
		},
		{
			id: 'owner_id',
			label: (
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
					<span>Owner</span>
					<PremiumTooltip title="The team member assigned to manage this lead and qualify them." arrow placement="top">
						<HelpOutline sx={{ fontSize: 12, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Stack>
			),
			hideOnMobile: true
		},
		{
			id: 'priority',
			label: (
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
					<span>Priority</span>
					<PremiumTooltip title="The relative urgency or interest level of the candidate (High, Medium, Low)." arrow placement="top">
						<HelpOutline sx={{ fontSize: 12, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Stack>
			),
			hideOnMobile: true
		},
		{
			id: 'source',
			label: (
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
					<span>Source</span>
					<PremiumTooltip title="The channel where the candidate came from (e.g. Website registration, referral, campaign)." arrow placement="top">
						<HelpOutline sx={{ fontSize: 12, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Stack>
			),
			hideOnMobile: true
		},
		{
			id: 'estimated_value',
			label: (
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: 'inline-flex' }}>
					<span>Value</span>
					<PremiumTooltip title="The estimated placement commission or value associated with this candidate pipeline." arrow placement="top">
						<HelpOutline sx={{ fontSize: 12, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Stack>
			),
			align: 'right',
			hideOnMobile: true
		},
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (lead: Lead) => {
		const owner = lead.owner_id != null ? ownerMap.get(lead.owner_id) : undefined;
		const ownerName = owner?.full_name || owner?.email;

		const actions: TableMenuAction<Lead>[] = [
			{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onRowClick(lead) },
			{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(lead) },
			{
				label: 'Convert to Deal',
				icon: <SwapHoriz fontSize="small" />,
				onClick: () => onConvert(lead),
				hidden: lead.status === 'converted',
				divider: true,
			},
			{
				label: 'Delete',
				icon: <DeleteOutline fontSize="small" />,
				onClick: () => onDelete(lead),
				color: 'error.main',
			},
		];

		return (
			<TableRow
				key={lead.public_id}
				hover
				onClick={() => onRowClick(lead)}
				sx={{ cursor: 'pointer' }}
			>
				{selectable && (
					<TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
						<Checkbox
							size="small"
							checked={selectedIds?.has(lead.public_id) ?? false}
							onChange={() => onToggleSelect?.(lead.public_id)}
						/>
					</TableCell>
				)}
				<TableCell>
					<Stack direction="row" spacing={1} alignItems="center">
						<Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.title}</Typography>
						{isLeadStale(lead) && (
							<PremiumTooltip title="No activity logged in over 14 days" arrow placement="top">
								<Chip
									label="Stale"
									size="small"
									sx={{
										fontSize: '0.65rem',
										fontWeight: 700,
										textTransform: 'uppercase',
										letterSpacing: '0.04em',
										borderRadius: '6px',
										height: 18,
										bgcolor: isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.08)',
										color: '#ef4444',
										border: '1px solid rgba(239, 68, 68, 0.25)',
									}}
								/>
							</PremiumTooltip>
						)}
					</Stack>
				</TableCell>
				<TableCell><StatusBadge label={lead.status} status={lead.status} type="lead" /></TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					{ownerName ? (
						<Stack direction="row" spacing={1} alignItems="center">
							<EnterpriseAvatar name={ownerName} size={24} />
							<Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{ownerName}</Typography>
						</Stack>
					) : (
						<Chip
							label="Unassigned"
							size="small"
							sx={{
								fontSize: '0.68rem',
								fontWeight: 700,
								textTransform: 'uppercase',
								letterSpacing: '0.04em',
								borderRadius: '6px',
								height: 20,
								bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
								color: '#f59e0b',
								border: '1px solid rgba(245, 158, 11, 0.25)',
							}}
						/>
					)}
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textTransform: 'capitalize' }}>{lead.priority}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textTransform: 'capitalize' }}>
					{lead.source ? lead.source.replace('_', ' ') : '—'}
				</TableCell>
				<TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					{lead.display_value != null && lead.display_currency ? (
						<Tooltip
							title={`Original: ${formatCurrency(lead.estimated_value, lead.currency)}${lead.display_rate != null ? ` — converted using the exchange rate on ${formatDate(lead.created_at)} (${formatRate(lead.currency, lead.display_currency, lead.display_rate)})` : ''}`}
							arrow
						>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', cursor: 'help' }}>
								{formatMoney(lead.display_value, lead.display_currency)}
							</Typography>
						</Tooltip>
					) : (
						formatCurrency(lead.estimated_value, lead.currency)
					)}
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={lead} actions={actions} tooltipTitle="Lead Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<DataTable<Lead>
			columns={columns}
			data={leads}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search leads..."
			onRefresh={onRefresh}
			onCreateClick={onCreateClick}
			createButtonText="New Lead"
			canCreate
			renderRow={renderRow}
			emptyMessage="No leads yet. Create your first lead to get started."
			numSelected={selectable ? selectedIds?.size : undefined}
			onSelectAllClick={selectable ? onSelectAll : undefined}
		/>
	);
};

export default LeadsTable;
