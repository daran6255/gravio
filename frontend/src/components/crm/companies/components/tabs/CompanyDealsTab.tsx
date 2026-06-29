import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Stack, useTheme } from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
import StatusBadge from '../../../../common/badge/StatusBadge';
import type { Deal } from '../../../../../models/crm/deal';

interface CompanyDealsTabProps {
	linkedDeals: Deal[];
	linkedDealsLoading: boolean;
}

export const CompanyDealsTab: React.FC<CompanyDealsTabProps> = ({ linkedDeals, linkedDealsLoading }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box>
			<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
				Open Deals ({linkedDeals.length})
			</Typography>
			{linkedDealsLoading ? (
				<Typography variant="caption" color="text.secondary">Loading deals...</Typography>
			) : linkedDeals.length === 0 ? (
				<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
					No deals linked yet.
				</Typography>
			) : (
				<List dense disablePadding>
					{linkedDeals.map((deal) => (
						<ListItem
							key={deal.public_id}
							sx={{
								borderRadius: '8px',
								mb: 1.25,
								border: '1px solid',
								borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
								bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
								px: 1.5,
								py: 1,
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center'
							}}
						>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<AttachMoney fontSize="small" sx={{ color: 'text.secondary' }} />
								<ListItemText
									primary={deal.title}
									secondary={deal.value != null ? `${deal.value.toLocaleString()} ${deal.currency}` : '—'}
									primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
									secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
								/>
							</Stack>
							<StatusBadge label={deal.status} status={deal.status} type="deal" />
						</ListItem>
					))}
				</List>
			)}
		</Box>
	);
};

export default CompanyDealsTab;
