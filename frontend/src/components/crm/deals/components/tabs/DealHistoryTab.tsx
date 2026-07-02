import React, { useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress, useTheme } from '@mui/material';
import { History as HistoryIcon, HelpOutline, Add, Delete, CheckCircle, Person, LocalOffer, Payments, SwapHoriz, Edit } from '@mui/icons-material';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchDealHistory } from '../../../../../store/slices/crmSlice';
import useDateTime from '../../../../../hooks/useDateTime';
import type { Deal } from '../../../../../models/crm/deal';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import type { DealHistoryEntry } from '../../../../../models/crm/deal';

interface DealHistoryTabProps {
	deal: Deal;
	owners: CRMOwnerOption[];
}

export const DealHistoryTab: React.FC<DealHistoryTabProps> = ({ deal, owners }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { formatDateTime } = useDateTime();
	const { dealHistory, dealHistoryLoading } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (deal.public_id) {
			dispatch(fetchDealHistory(deal.public_id));
		}
	}, [deal.public_id, dispatch]);

	const getHistoryIcon = (fieldName?: string, action?: string) => {
		const field = fieldName?.toLowerCase() || '';
		const act = action?.toLowerCase() || '';

		if (act === 'create') return <Add sx={{ fontSize: 13, color: 'success.main' }} />;
		if (act === 'delete') return <Delete sx={{ fontSize: 13, color: 'error.main' }} />;

		switch (field) {
			case 'status':
				return <CheckCircle sx={{ fontSize: 13, color: 'success.main' }} />;
			case 'stage_id':
				return <SwapHoriz sx={{ fontSize: 14, color: 'primary.main' }} />;
			case 'owner_id':
				return <Person sx={{ fontSize: 13, color: 'info.main' }} />;
			case 'tags':
				return <LocalOffer sx={{ fontSize: 13, color: 'warning.main' }} />;
			case 'value':
				return <Payments sx={{ fontSize: 13, color: 'success.main' }} />;
			default:
				return <Edit sx={{ fontSize: 12, color: 'text.secondary' }} />;
		}
	};

	const getFieldChangeDescription = (h: DealHistoryEntry) => {
		const field = h.field_name ? h.field_name.replace(/_/g, ' ') : '';
		if (!h.field_name) {
			if (h.action === 'create') return 'created this deal';
			if (h.action === 'delete') return 'deleted this deal';
			return h.action;
		}

		const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);

		let oldVal = h.old_value || '—';
		let newVal = h.new_value || '—';
		if (h.field_name === 'status') {
			oldVal = oldVal.charAt(0).toUpperCase() + oldVal.slice(1);
			newVal = newVal.charAt(0).toUpperCase() + newVal.slice(1);
		}

		return (
			<span>
				changed <strong style={{ textTransform: 'lowercase', color: theme.palette.text.secondary }}>{fieldLabel}</strong> from{' '}
				<span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 4 }}>
					{oldVal}
				</span>
				to{' '}
				<strong style={{ color: h.field_name === 'status' ? theme.palette.success.main : theme.palette.text.primary }}>
					{newVal}
				</strong>
			</span>
		);
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
			<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 3 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Change History</Typography>
				<PremiumTooltip title="A read-only audit trail of who changed what on this deal, and when." arrow placement="right">
					<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
				</PremiumTooltip>
			</Box>

			{dealHistoryLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
					<CircularProgress size={28} />
				</Box>
			) : dealHistory.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1 }}>
					<HistoryIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
					<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>No changes recorded yet</Typography>
				</Box>
			) : (
				<Box sx={{ position: 'relative', pl: 4, py: 1 }}>
					{/* Vertical Line */}
					<Box sx={{
						position: 'absolute',
						left: 17,
						top: 8,
						bottom: 8,
						width: '2px',
						bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					}} />

					<Stack spacing={3}>
						{dealHistory.map((h) => {
							const changedByUser = owners.find((o) => o.id === h.changed_by_user_id);
							const actorName = changedByUser ? (changedByUser.full_name || changedByUser.email) : `User #${h.changed_by_user_id}`;

							return (
								<Box key={h.id} sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
									{/* Circle Marker */}
									<Box sx={{
										position: 'absolute',
										left: -24,
										top: 2,
										width: 20,
										height: 20,
										borderRadius: '50%',
										bgcolor: isDark ? '#1e1e1e' : '#ffffff',
										border: '1.5px solid',
										borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										zIndex: 1,
									}}>
										{getHistoryIcon(h.field_name, h.action)}
									</Box>

									{/* Text Bubble */}
									<Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
										<strong style={{ color: theme.palette.text.primary, marginRight: 6 }}>{actorName}</strong>
										{getFieldChangeDescription(h)}
										<span style={{ color: theme.palette.text.disabled, marginLeft: 6, fontSize: '0.75rem' }}>
											on {formatDateTime(h.changed_at)}
										</span>
									</Typography>
								</Box>
							);
						})}
					</Stack>
				</Box>
			)}
		</Box>
	);
};

export default DealHistoryTab;
