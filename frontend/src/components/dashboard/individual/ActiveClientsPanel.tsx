import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, alpha } from '@mui/material';
import { Business } from '@mui/icons-material';
import orgAdminService from '../../../services/orgAdminService';
import type { Organization } from '../../../models/auth';

export const ActiveClientsPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [clients, setClients] = useState<Organization[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		orgAdminService.listOrganizations(1, 20)
			.then((res) => {
				if (!cancelled) {
					// Filter out 'Taydens' (the main tenant) to list client companies
					const clientList = res.items.filter(org => org.name !== 'Taydens');
					setClients(clientList);
				}
			})
			.catch(() => {
				if (!cancelled) setClients([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => { cancelled = true; };
	}, []);

	const cardBg = isDark
		? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
		: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)';

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
									<TableCell>Account Tier</TableCell>
									<TableCell align="right">Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{clients.map((c) => (
									<TableRow key={c.public_id} hover sx={{ '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, py: 1.25 } }}>
										<TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }}>{c.name}</TableCell>
										<TableCell sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>{c.location || '—'}</TableCell>
										<TableCell>
											<Chip
												label={c.plan?.name || 'Pro'}
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
												label={c.is_active ? 'ACTIVE' : 'INACTIVE'}
												size="small"
												sx={{
													height: 18,
													fontSize: '0.6rem',
													fontWeight: 800,
													bgcolor: c.is_active ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
													color: c.is_active ? theme.palette.success.main : theme.palette.error.main
												}}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);
};

export default ActiveClientsPanel;
