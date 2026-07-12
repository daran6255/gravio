import React, { useState, useEffect } from 'react';
import {
	Box, Container, Typography, Button, Card, CardContent, Divider, Grid,
	Alert, Stack, alpha, useTheme
} from '@mui/material';
import {
	Download as DownloadIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { responsiveStyles } from '../../../theme';
import { hrPayslipApi } from '../../../services/hrService';
import { fetchPayslips, fetchPayslip } from '../../../store/slices/hrSlice';
import type { HRPayslip } from '../../../models/hr';
import useToast from '../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

const EmployeePayslipsPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const payslips = useAppSelector((state) => state.hr.payslips);

	const [selectedPayslip, setSelectedPayslip] = useState<HRPayslip | null>(null);

	const loadPayslips = async () => {
		try {
			// standard users can only see their own (the backend filters it anyway)
			const res = await dispatch(fetchPayslips({ user_id: currentUser?.id })).unwrap();
			if (res.length > 0) {
				handleViewPayslip(res[0].public_id);
			}
		} catch {
			error('Failed to load payslips history');
		}
	};

	useEffect(() => {
		if (currentUser?.id) {
			loadPayslips();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser]);

	const handleViewPayslip = async (publicId: string) => {
		try {
			const res = await dispatch(fetchPayslip(publicId)).unwrap();
			setSelectedPayslip(res);
		} catch {
			error('Failed to fetch payslip details');
		}
	};

	const handleDownloadPdf = (publicId: string) => {
		const url = hrPayslipApi.getPdfUrl(publicId);
		window.open(url, '_blank');
	};

	const getMonthName = (monthNum: number) => {
		return new Date(2020, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
	};

	return (
		<Container maxWidth="xl" sx={responsiveStyles.pageContainer}>
			<PageHeader
				title="My Payslips Summary"
				subtitle="View your earnings breakdown, tax deductions, and download official PDF payslips"
			/>
			<Grid container spacing={3}>
				{/* List on left */}
				<Grid size={{ xs: 12, md: 5 }}>
					<Card sx={{ height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
						<CardContent sx={{ p: 2 }}>
							<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
								Payslips History
							</Typography>
							<Divider sx={{ mb: 2 }} />

							{payslips.length === 0 ? (
								<Alert severity="info">No payslips have been processed for your profile yet.</Alert>
							) : (
								<Stack spacing={1.5}>
									{payslips.map((slip) => (
										<Box
											key={slip.id}
											onClick={() => handleViewPayslip(slip.public_id)}
											sx={{
												p: 2,
												borderRadius: 2,
												cursor: 'pointer',
												border: `1px solid ${selectedPayslip?.id === slip.id ? theme.palette.primary.main : alpha(theme.palette.divider, 0.7)}`,
												bgcolor: selectedPayslip?.id === slip.id ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
												transition: 'all 0.15s ease',
												'&:hover': {
													borderColor: theme.palette.primary.main,
													bgcolor: alpha(theme.palette.primary.main, 0.02)
												}
											}}
										>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
												<Typography variant="subtitle2" fontWeight={700}>
													{slip.month ? getMonthName(slip.month) : 'Month'} {slip.year}
												</Typography>
												<Typography variant="body2" fontWeight={700} color="primary.main">
													₹{slip.net_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
												</Typography>
											</Box>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<Typography variant="caption" color="text.secondary">
													Gross: ₹{slip.gross_earnings.toLocaleString('en-IN')} | Ded: ₹{slip.total_deductions.toLocaleString('en-IN')}
												</Typography>
												<Button
													size="small"
													startIcon={<DownloadIcon />}
													sx={{ fontSize: '0.75rem', p: 0 }}
													onClick={(e) => {
														e.stopPropagation();
														handleDownloadPdf(slip.public_id);
													}}
												>
													PDF
												</Button>
											</Box>
										</Box>
									))}
								</Stack>
							)}
						</CardContent>
					</Card>
				</Grid>

				{/* Preview on right */}
				<Grid size={{ xs: 12, md: 7 }}>
					{selectedPayslip ? (
						<Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
							<CardContent sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
									<Box>
										<Typography variant="h6" fontWeight={700} color="primary.main">
											{selectedPayslip.month ? getMonthName(selectedPayslip.month) : 'Month'} {selectedPayslip.year} Payslip
										</Typography>
										<Typography variant="caption" color="text.secondary">
											Generated on {new Date(selectedPayslip.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
										</Typography>
									</Box>
									<Button
										variant="contained"
										startIcon={<DownloadIcon />}
										onClick={() => handleDownloadPdf(selectedPayslip.public_id)}
									>
										Download PDF
									</Button>
								</Box>

								<Divider sx={{ mb: 3 }} />

								{/* Info fields */}
								<Grid container spacing={2} sx={{ mb: 3 }}>
									<Grid size={{ xs: 6, sm: 4 }}>
										<Typography variant="caption" color="text.disabled" display="block">EMPLOYEE NAME</Typography>
										<Typography variant="body2" fontWeight={600}>{selectedPayslip.employee_name || currentUser?.full_name}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<Typography variant="caption" color="text.disabled" display="block">EMPLOYEE ID</Typography>
										<Typography variant="body2" fontWeight={600} fontFamily="monospace">{selectedPayslip.employee_id || '—'}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<Typography variant="caption" color="text.disabled" display="block">PAN NUMBER</Typography>
										<Typography variant="body2" fontWeight={600}>{selectedPayslip.pan_number || '—'}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<Typography variant="caption" color="text.disabled" display="block">DEPARTMENT</Typography>
										<Typography variant="body2" fontWeight={600}>{selectedPayslip.department_name || '—'}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<Typography variant="caption" color="text.disabled" display="block">DESIGNATION</Typography>
										<Typography variant="body2" fontWeight={600}>{selectedPayslip.designation_name || '—'}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 4 }}>
										<Typography variant="caption" color="text.disabled" display="block">LOP DAYS</Typography>
										<Typography variant="body2" fontWeight={600}>{selectedPayslip.lop_days}</Typography>
									</Grid>
								</Grid>

								<Divider sx={{ mb: 3 }} />

								{/* Earnings & Deductions breakdowns */}
								<Grid container spacing={4}>
									<Grid size={{ xs: 12, sm: 6 }}>
										<Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
											Earnings Breakdown
										</Typography>
										<Stack spacing={1}>
											{Object.entries(selectedPayslip.earnings_breakdown).map(([k, v]) => (
												<Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
													<Typography variant="body2" color="text.secondary">{k}</Typography>
													<Typography variant="body2" fontWeight={600}>₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
												</Box>
											))}
											<Divider sx={{ my: 1 }} />
											<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
												<Typography variant="body2" fontWeight={700}>Gross Earnings</Typography>
												<Typography variant="body2" fontWeight={700}>₹{selectedPayslip.gross_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
											</Box>
										</Stack>
									</Grid>

									<Grid size={{ xs: 12, sm: 6 }}>
										<Typography variant="subtitle2" fontWeight={700} color="error.main" gutterBottom>
											Deductions Breakdown
										</Typography>
										<Stack spacing={1}>
											{Object.entries(selectedPayslip.deductions_breakdown).map(([k, v]) => (
												<Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
													<Typography variant="body2" color="text.secondary">{k}</Typography>
													<Typography variant="body2" fontWeight={600}>₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
												</Box>
											))}
											<Divider sx={{ my: 1 }} />
											<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
												<Typography variant="body2" fontWeight={700}>Total Deductions</Typography>
												<Typography variant="body2" fontWeight={700}>₹{selectedPayslip.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
											</Box>
										</Stack>
									</Grid>
								</Grid>

								<Box
									sx={{
										mt: 4,
										p: 2,
										borderRadius: 2,
										bgcolor: alpha(theme.palette.success.main, 0.08),
										border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center'
									}}
								>
									<Typography variant="subtitle1" fontWeight={700} color="success.main">
										NET TAKE HOME PAY
									</Typography>
									<Typography variant="h6" fontWeight={800} color="success.main">
										₹{selectedPayslip.net_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
									</Typography>
								</Box>
							</CardContent>
						</Card>
					) : (
						<Alert severity="info">Select a payslip from the list to preview details.</Alert>
					)}
				</Grid>
			</Grid>
		</Container>
	);
};

export default EmployeePayslipsPage;
