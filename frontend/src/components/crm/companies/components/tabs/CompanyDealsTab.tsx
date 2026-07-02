import React from 'react';
import { Box, Typography, Stack, Grid, useTheme, alpha } from '@mui/material';
import { AttachMoney, TrendingUp, Handshake } from '@mui/icons-material';
import StatusBadge from '../../../../common/badge/StatusBadge';
import { getCurrencySymbol } from '../../../../../utils/currency';
import type { Deal } from '../../../../../models/crm/deal';

interface CompanyDealsTabProps {
	linkedDeals: Deal[];
	linkedDealsLoading: boolean;
}

const formatValue = (value: number, currency: string) => `${getCurrencySymbol(currency)}${value.toLocaleString()}`;

export const CompanyDealsTab: React.FC<CompanyDealsTabProps> = ({ linkedDeals, linkedDealsLoading }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
	};

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
	};

	const openDeals = linkedDeals.filter((d) => d.status === 'open');
	const wonDeals = linkedDeals.filter((d) => d.status === 'won');

	// Sum open-deal value per currency (a company's deals may occasionally mix currencies)
	const valueByCurrency = openDeals.reduce<Record<string, number>>((acc, d) => {
		if (d.value != null) acc[d.currency] = (acc[d.currency] || 0) + d.value;
		return acc;
	}, {});
	const currencies = Object.keys(valueByCurrency);

	return (
		<Stack spacing={2.5}>
			{/* Summary stats */}
			<Grid container spacing={2}>
				<Grid size={{ xs: 6 }}>
					<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.07em' }}>
								Open Pipeline
							</Typography>
							<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }} noWrap>
								{currencies.length === 0 ? '—' : currencies.map((c) => formatValue(valueByCurrency[c], c)).join(' + ')}
							</Typography>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), p: 1, borderRadius: '50%', color: 'primary.main', display: 'flex', flexShrink: 0 }}>
							<AttachMoney sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
				<Grid size={{ xs: 6 }}>
					<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
						<Box>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.07em' }}>
								Won Deals
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
								{wonDeals.length} / {linkedDeals.length}
							</Typography>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), p: 1, borderRadius: '50%', color: 'success.main', display: 'flex' }}>
							<TrendingUp sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
			</Grid>

			<Typography variant="caption" sx={sectionTitleSx}>All Deals ({linkedDeals.length})</Typography>

			{linkedDealsLoading ? (
				<Typography variant="caption" color="text.secondary">Loading deals...</Typography>
			) : linkedDeals.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1.5 }}>
					<Box sx={{ width: 56, height: 56, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
						<Handshake sx={{ fontSize: 26, color: 'text.disabled' }} />
					</Box>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>No deals yet</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 260 }}>
						Deals linked to this company will show up here.
					</Typography>
				</Box>
			) : (
				<Stack spacing={1.25}>
					{linkedDeals.map((deal) => (
						<Box
							key={deal.public_id}
							sx={{
								...fieldCardSx,
								p: 1.5,
								borderLeft: '3px solid',
								borderLeftColor: deal.status === 'won' ? 'success.main' : deal.status === 'lost' ? 'error.main' : deal.status === 'on_hold' ? 'warning.main' : 'primary.main',
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{deal.title}</Typography>
									<Stack direction="row" spacing={1.5} sx={{ mt: 0.4 }} flexWrap="wrap" useFlexGap>
										{deal.value != null && (
											<Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
												{formatValue(deal.value, deal.currency)}
											</Typography>
										)}
										<Typography variant="caption" color="text.secondary">{deal.probability}% probability</Typography>
										{deal.close_date && (
											<Typography variant="caption" color="text.secondary">
												Closes {new Date(deal.close_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
											</Typography>
										)}
									</Stack>
								</Box>
								<StatusBadge label={deal.status} status={deal.status} type="deal" />
							</Stack>
						</Box>
					))}
				</Stack>
			)}
		</Stack>
	);
};

export default CompanyDealsTab;
