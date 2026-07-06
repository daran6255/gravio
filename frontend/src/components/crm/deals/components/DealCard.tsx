import React from 'react';
import { Box, Typography, Stack, Tooltip, useTheme, Avatar, alpha } from '@mui/material';
import { KanbanCard } from '../../../common/kanban';
import { DataTableActions, type TableMenuAction } from '../../../common/table';
import { Visibility, Edit, DeleteOutline, Business as BusinessIcon } from '@mui/icons-material';
import type { Deal } from '../../../../models/crm/deal';
import { formatMoney, formatRate } from '../../../../utils/currency';
import useDateTime from '../../../../hooks/useDateTime';

interface DealCardProps {
	deal: Deal;
	companyName?: string;
	onView: (deal: Deal) => void;
	onEdit: (deal: Deal) => void;
	onDelete: (deal: Deal) => void;
	owner?: any;
}

const getProbabilityColor = (prob: number) => {
	if (prob >= 75) return '#10B981';
	if (prob >= 40) return '#F59E0B';
	return '#8B7CF6';
};

const formatValue = (value?: number, currency?: string) => {
	if (value == null) return null;
	return formatMoney(value, currency);
};

const getInitials = (name?: string, email?: string) => {
	if (name) {
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return parts[0].slice(0, 2).toUpperCase();
	}
	if (email) {
		return email.slice(0, 2).toUpperCase();
	}
	return 'U';
};

export const DealCard: React.FC<DealCardProps> = ({ deal, companyName, onView, onEdit, onDelete, owner }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { formatDate } = useDateTime();
	const actions: TableMenuAction<Deal>[] = [
		{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onView(deal) },
		{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(deal) },
		{ label: 'Delete', icon: <DeleteOutline fontSize="small" />, onClick: () => onDelete(deal), color: 'error.main', divider: true },
	];

	const totalTasks = deal.task_count || 0;
	const completedTasks = deal.completed_task_count || 0;
	const inProgressTasks = deal.in_progress_task_count || 0;
	const pendingTasks = Math.max(totalTasks - completedTasks - inProgressTasks, 0);

	const probColor = getProbabilityColor(deal.probability || 0);

	return (
		<KanbanCard id={deal.public_id} data={{ item: deal }} onClick={() => onView(deal)}>
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
				<Typography 
					variant="body2" 
					sx={{ 
						fontWeight: 800, 
						pr: 1, 
						lineHeight: 1.3,
						color: isDark ? 'text.primary' : '#1e293b' 
					}}
				>
					{deal.title}
				</Typography>
				<Box onClick={(e) => e.stopPropagation()} sx={{ mt: -0.5, mr: -0.5 }}>
					<DataTableActions item={deal} actions={actions} tooltipTitle="Deal Actions" />
				</Box>
			</Stack>

			{companyName && (
				<Box 
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.5,
						px: 1,
						py: 0.25,
						borderRadius: '6px',
						bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
						mb: 1.5,
						width: 'fit-content'
					}}
				>
					<BusinessIcon sx={{ fontSize: '0.72rem', color: 'text.secondary' }} />
					<Typography 
						variant="caption" 
						sx={{ 
							fontWeight: 700, 
							color: 'text.secondary', 
							fontSize: '0.68rem',
							letterSpacing: '0.01em'
						}}
					>
						{companyName}
					</Typography>
				</Box>
			)}

			{/* Deal Tags */}
			{deal.tags && deal.tags.length > 0 && (
				<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1.5, gap: 0.5 }}>
					{deal.tags.map((tag) => (
						<Box
							key={tag}
							sx={{
								px: 1,
								py: 0.25,
								borderRadius: '4px',
								fontSize: '0.625rem',
								fontWeight: 700,
								bgcolor: isDark ? 'rgba(139, 124, 246, 0.12)' : 'rgba(139, 124, 246, 0.08)',
								color: '#8B7CF6',
								textTransform: 'uppercase',
								letterSpacing: '0.02em',
							}}
						>
							{tag}
						</Box>
					))}
				</Stack>
			)}

			{totalTasks > 0 && (
				<Box sx={{ mb: 1.5 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
							Tasks
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontSize: '0.68rem', fontWeight: 800, color: completedTasks === totalTasks ? 'success.main' : 'text.secondary' }}
						>
							{completedTasks}/{totalTasks}
						</Typography>
					</Stack>
					<Tooltip
						title={`${completedTasks} completed · ${inProgressTasks} in progress · ${pendingTasks} yet to start`}
						arrow
					>
						<Box
							sx={{
								display: 'flex',
								width: '100%',
								height: 5,
								borderRadius: 2.5,
								overflow: 'hidden',
								bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
							}}
						>
							{completedTasks > 0 && (
								<Box sx={{ flexBasis: `${(completedTasks / totalTasks) * 100}%`, bgcolor: 'success.main' }} />
							)}
							{inProgressTasks > 0 && (
								<Box sx={{ flexBasis: `${(inProgressTasks / totalTasks) * 100}%`, bgcolor: '#FF9800' }} />
							)}
							{pendingTasks > 0 && (
								<Box sx={{ flexBasis: `${(pendingTasks / totalTasks) * 100}%`, bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
							)}
						</Box>
					</Tooltip>
				</Box>
			)}

			<Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 1 }}>
				<Box sx={{ minWidth: 0 }}>
					{formatValue(deal.value, deal.currency) && (
						<Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981', display: 'block', fontSize: '0.9rem' }}>
							{formatValue(deal.value, deal.currency)}
						</Typography>
					)}
					{deal.display_value != null && deal.display_currency && (
						<Tooltip
							title={`Converted using the exchange rate on ${formatDate(deal.created_at)}${deal.display_rate != null ? ` (${formatRate(deal.currency, deal.display_currency, deal.display_rate)})` : ''}`}
							arrow
						>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.25 }}>
								≈ {formatMoney(deal.display_value, deal.display_currency)}
							</Typography>
						</Tooltip>
					)}
				</Box>
				
				<Stack direction="row" spacing={1} alignItems="center">
					<Box 
						sx={{ 
							px: 1, 
							py: 0.25, 
							borderRadius: '6px', 
							fontSize: '0.68rem', 
							fontWeight: 800, 
							bgcolor: alpha(probColor, 0.08), 
							color: probColor,
							border: `1px solid ${alpha(probColor, 0.15)}`,
							lineHeight: 1
						}}
					>
						{deal.probability}%
					</Box>
					{owner && (
						<Tooltip title={`Owner: ${owner.full_name || owner.email}`} arrow>
							<Avatar
								sx={{
									width: 22,
									height: 22,
									fontSize: '0.625rem',
									fontWeight: 700,
									bgcolor: () => {
										const colors = ['#8B7CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
										const charCodeSum = (owner.full_name || owner.email || '').split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
										return colors[charCodeSum % colors.length];
									},
									color: 'white',
									boxShadow: `0 0 0 2px ${isDark ? '#141822' : '#ffffff'}`,
								}}
							>
								{getInitials(owner.full_name, owner.email)}
							</Avatar>
						</Tooltip>
					)}
				</Stack>
			</Stack>
		</KanbanCard>
	);
};

export default DealCard;
