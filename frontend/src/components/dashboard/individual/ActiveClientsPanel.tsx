import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, alpha } from '@mui/material';
import { Business } from '@mui/icons-material';
import crmService from '../../../services/crmService';
import type { Company } from '../../../models/crm/company';

const STATUS_LABEL: Record<Company['status'], string> = {
	customer: 'Customer',
	partner: 'Partner',
	prospect: 'Prospect',
	churned: 'Churned',
};

export const ActiveClientsPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [clients, setClients] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		crmService.listCompanies({ page: 1, pageSize: 20 })
			.then((res) => {
				if (!cancelled) setClients(res.items);
			})
			.catch(() => {
				if (!cancelled) setClients([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => { cancelled = true; };
	}, []);

	const cardBg = theme.gradients.card;

	return (
		<Card sx={{
			borderRadius: '16px',
			border: `1px solid ${theme.palette.divider}`,
			boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			height: '100%',
			background: cardBg,
			backdropFilter: 'blur(20px)',
		}}>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<Business color="primary" sx={{ fontSize: 20 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						Active Clients (Companies)
					</Typography>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{[1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={44} sx={{ borderRadius: 1.5 }} />)}
					</Box>
				) : clients.length === 0 ? (
					<Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 4 }}>
						<Typography variant="body2" color="text.secondary">No client companies found.</Typography>
					</Box>
				) : (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow sx={{ '& th': { bgcolor: 'transparent', fontWeight: 800, fontSize: '0.68rem', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` } }}>
									<TableCell>Company Name</TableCell>
									<TableCell>Location</TableCell>
									<TableCell>Size</TableCell>
									<TableCell align="right">Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{clients.map((c) => {
									const statusColor =
										c.status === 'customer' || c.status === 'partner'
											? theme.palette.success.main
											: c.status === 'churned'
												? theme.palette.error.main
												: theme.palette.warning.main;
									return (
										<TableRow key={c.public_id} hover sx={{ '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, py: 1.25 } }}>
											<TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }}>{c.name}</TableCell>
											<TableCell sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>{c.address?.city || c.address?.country || c.address?.location || '—'}</TableCell>
											<TableCell>
												<Chip
													label={c.size ? c.size.charAt(0).toUpperCase() + c.size.slice(1) : '—'}
													size="small"
													sx={{
														height: 18,
														fontSize: '0.6rem',
														fontWeight: 800,
														bgcolor: alpha(theme.palette.primary.main, 0.1),
														color: theme.palette.primary.main
													}}
												/>
											</TableCell>
											<TableCell align="right">
												<Chip
													label={STATUS_LABEL[c.status]}
													size="small"
													sx={{
														height: 18,
														fontSize: '0.6rem',
														fontWeight: 800,
														bgcolor: alpha(statusColor, 0.1),
														color: statusColor
													}}
												/>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);
};

export default ActiveClientsPanel;
