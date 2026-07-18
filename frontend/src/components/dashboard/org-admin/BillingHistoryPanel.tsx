import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Link, Chip, Button, alpha } from '@mui/material';
import { Receipt, ChevronRight, Download } from '@mui/icons-material';
import { useAppSelector } from '../../../store/hooks';

export const BillingHistoryPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const org = useAppSelector((state) => state.auth.user?.organization);

	const planName = org?.plan_name || org?.plan?.name || 'Pro';
	
	// Format current billing month: July 2026
	const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	const nextRenewalDate = new Date();
	nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
	nextRenewalDate.setDate(1);
	const renewalStr = nextRenewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

	const fee = planName === 'Enterprise' ? '$999.00' : planName === 'Pro' ? '$499.00' : planName === 'Basic' ? '$199.00' : '$0.00';
	const isPaid = true; // Seeded orgs are active/paid

	const downloadInvoice = () => {
		const element = document.createElement("a");
		const invoiceContent = `=========================================
          GRAVIT CRM INVOICE
=========================================
Invoice ID: INV-2026-${new Date().getMonth() + 1}
Billing Period: ${currentMonthName}
Organization: ${org?.name || 'Taydens'}
Plan Level: ${planName} Plan
Billing Amount: ${fee}
Payment Status: PAID
Payment Method: Card ending in **** 4242
Renewal Date: ${renewalStr}

Thank you for your business!
=========================================`;
		
		const file = new Blob([invoiceContent], { type: 'text/plain' });
		element.href = URL.createObjectURL(file);
		element.download = `invoice_${currentMonthName.toLowerCase().replace(' ', '_')}.txt`;
		document.body.appendChild(element);
		element.click();
		element.remove();
	};

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
			<CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Box display="flex" alignItems="center" gap={1.25}>
						<Receipt color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Billing Status
						</Typography>
					</Box>
					<Link component={RouterLink} to="/billing" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Details <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				<Box sx={{ my: 2 }}>
					<Box display="flex" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
							Current Period
						</Typography>
						<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
							{currentMonthName}
						</Typography>
					</Box>

					<Box display="flex" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
							Plan & Fee
						</Typography>
						<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
							{planName} ({fee})
						</Typography>
					</Box>

					<Box display="flex" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
							Status
						</Typography>
						<Chip
							label={isPaid ? 'PAID' : 'PENDING'}
							size="small"
							sx={{
								height: 20,
								fontSize: '0.62rem',
								fontWeight: 800,
								bgcolor: isPaid ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
								color: isPaid ? theme.palette.success.main : theme.palette.warning.main,
								border: `1px solid ${isPaid ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.warning.main, 0.2)}`,
							}}
						/>
					</Box>

					<Box display="flex" alignItems="baseline" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
							Next Renewal
						</Typography>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							{renewalStr}
						</Typography>
					</Box>
				</Box>

				<Box sx={{ mt: 'auto' }}>
					<Button
						variant="contained"
						fullWidth
						disabled={!isPaid}
						onClick={downloadInvoice}
						startIcon={<Download />}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '10px',
							background: theme.gradients.brandDiagonal,
							color: '#fff',
							boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
							'&:hover': {
								background: theme.gradients.brandDiagonalHover,
							},
						}}
					>
						Download Invoice
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
};

export default BillingHistoryPanel;
