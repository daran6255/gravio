import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Button, Card, CardContent, Divider, Grid,
	Table, TableBody, TableCell, TableContainer, TableHead,
	TableRow, Paper, TextField, Dialog, DialogTitle, DialogContent,
	DialogActions, MenuItem, Select, FormControl, InputLabel,
	IconButton, Chip, Alert, Stack, alpha, useTheme
} from '@mui/material';
import {
	Add as AddIcon,
	PlayArrow as RunIcon,
	Lock as LockIcon,
	Download as DownloadIcon,
	AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import HRLayout from '../../components/hr/HRLayout';
import { hrPayslipApi } from '../../services/hrService';
import {
	fetchPayrollRuns, createPayrollRun, calculatePayrollRun, finalizePayrollRun,
	createVariablePayEntry, fetchPayslips, fetchEmployees
} from '../../store/slices/hrSlice';
import type { HRPayrollRun } from '../../models/hr';
import useToast from '../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const PayrollRunsPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin';

	const { runs, payslips, employees } = useAppSelector((state) => ({
		runs: state.hr.payrollRuns,
		payslips: state.hr.payslips,
		employees: state.hr.employees
	}));
	const [selectedRun, setSelectedRun] = useState<HRPayrollRun | null>(null);

	// Create run states
	const [openCreateDialog, setOpenCreateDialog] = useState(false);
	const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
	const [runYear, setRunYear] = useState(new Date().getFullYear());

	// Variable override states
	const [openVarDialog, setOpenVarDialog] = useState(false);
	const [varUserId, setVarUserId] = useState<number | ''>('');
	const [varCompCode, setVarCompCode] = useState('BONUS');
	const [varAmount, setVarAmount] = useState('');
	const [varEntryType, setVarEntryType] = useState<'earning' | 'deduction'>('earning');
	const [varReason, setVarReason] = useState('');

	const handleSelectRun = async (run: HRPayrollRun) => {
		setSelectedRun(run);
		try {
			await dispatch(fetchPayslips({ run_id: run.id })).unwrap();
		} catch {
			error('Failed to load payslips for this run');
		}
	};

	const loadRuns = async () => {
		try {
			const res = await dispatch(fetchPayrollRuns()).unwrap();
			if (res.length > 0 && !selectedRun) {
				handleSelectRun(res[0]);
			} else if (selectedRun) {
				const updated = res.find(r => r.id === selectedRun.id);
				if (updated) setSelectedRun(updated);
			}
			dispatch(fetchEmployees({ limit: 100 }));
		} catch {
			error('Failed to load payroll runs');
		}
	};

	useEffect(() => {
		loadRuns();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleCreateRun = async () => {
		try {
			const run = await dispatch(createPayrollRun({
				month: Number(runMonth),
				year: Number(runYear)
			})).unwrap();
			success(`Payroll run created for ${runMonth}/${runYear}`);
			setOpenCreateDialog(false);
			handleSelectRun(run);
		} catch (err: any) {
			error(err || 'Failed to create payroll run');
		}
	};

	const handleCalculate = async () => {
		if (!selectedRun) return;
		try {
			success('Recalculating salaries...');
			const updated = await dispatch(calculatePayrollRun(selectedRun.id)).unwrap();
			setSelectedRun(updated);
			await dispatch(fetchPayslips({ run_id: updated.id })).unwrap();
			success('Payroll run calculation complete!');
		} catch (err: any) {
			error(err || 'Failed to calculate payroll');
		}
	};

	const handleFinalize = async () => {
		if (!selectedRun) return;
		if (window.confirm('Are you sure you want to finalize and lock this payroll run? This will generate permanent payslips.')) {
			try {
				const updated = await dispatch(finalizePayrollRun(selectedRun.id)).unwrap();
				setSelectedRun(updated);
				success('Payroll run finalized and locked successfully');
			} catch (err: any) {
				error(err || 'Failed to finalize payroll');
			}
		}
	};

	const handleSaveVariablePay = async () => {
		if (!selectedRun || !varUserId || !varAmount) {
			error('Please fill in all fields');
			return;
		}
		try {
			await dispatch(createVariablePayEntry({
				runId: selectedRun.id,
				payload: {
					user_id: Number(varUserId),
					component_code: varCompCode,
					amount: Number(varAmount),
					entry_type: varEntryType,
					reason: varReason
				}
			})).unwrap();
			success('Variable pay override entry added');
			setOpenVarDialog(false);
			// Recalculate right away to apply changes
			handleCalculate();
		} catch {
			error('Failed to add variable pay override');
		}
	};

	const handleDownloadPdf = (publicId: string) => {
		const url = hrPayslipApi.getPdfUrl(publicId);
		window.open(url, '_blank');
	};

	const getMonthName = (monthNum: number) => {
		return new Date(2020, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
	};

	// Aggregated Totals
	const totalGross = payslips.reduce((acc, curr) => acc + curr.gross_earnings, 0);
	const totalDeductions = payslips.reduce((acc, curr) => acc + curr.total_deductions, 0);
	const totalNet = payslips.reduce((acc, curr) => acc + curr.net_pay, 0);

	return (
		<HRLayout
			title="Payroll Process Engine"
			subtitle="Run monthly payroll engine, post variable earnings/deductions, audit balances, and generate PDF payslips"
		>
			<Grid container spacing={3}>
				{/* Sidebar: Run List */}
				<Grid size={{ xs: 12, md: 3 }}>
					<Card sx={{ height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
						<CardContent sx={{ p: 2 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
								<Typography variant="subtitle2" fontWeight={700}>
									Runs History
								</Typography>
								{isAdmin && (
									<Button size="small" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
										New Run
									</Button>
								)}
							</Box>
							<Divider sx={{ mb: 2 }} />
							<Stack spacing={1}>
								{runs.map((r) => (
									<Button
										key={r.id}
										variant={selectedRun?.id === r.id ? 'contained' : 'outlined'}
										color={selectedRun?.id === r.id ? 'primary' : 'inherit'}
										onClick={() => handleSelectRun(r)}
										fullWidth
										sx={{
											justifyContent: 'space-between',
											textTransform: 'none',
											py: 1,
											px: 1.5,
											borderWidth: selectedRun?.id === r.id ? 0 : 1,
										}}
									>
										<Typography variant="body2" fontWeight={600}>
											{getMonthName(r.month)} {r.year}
										</Typography>
										<Chip
											label={r.status.toUpperCase()}
											size="small"
											color={r.status === 'finalized' ? 'success' : r.status === 'processing' ? 'warning' : 'default'}
											sx={{ height: 18, fontSize: '0.6rem' }}
										/>
									</Button>
								))}
							</Stack>
						</CardContent>
					</Card>
				</Grid>

				{/* Main: Run detail & Payslips grid */}
				<Grid size={{ xs: 12, md: 9 }}>
					{selectedRun ? (
						<Stack spacing={3}>
							{/* Summary Cards */}
							<Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.7)}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
										<Typography variant="h6" fontWeight={700}>
											Payroll Summary — {getMonthName(selectedRun.month)} {selectedRun.year}
										</Typography>
										<Stack direction="row" spacing={1}>
											{selectedRun.status !== 'finalized' && isAdmin && (
												<>
													<Button variant="outlined" startIcon={<RunIcon />} size="small" onClick={handleCalculate}>
														Calculate / Update
													</Button>
													<Button variant="contained" startIcon={<LockIcon />} size="small" color="success" onClick={handleFinalize}>
														Finalize & Lock
													</Button>
												</>
											)}
										</Stack>
									</Box>

									<Grid container spacing={2}>
										<Grid size={{ xs: 12, sm: 4 }}>
											<Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
												<CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
													<Typography variant="caption" color="text.secondary">Gross Earnings</Typography>
													<Typography variant="h6" fontWeight={700} color="primary.main">
														₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</Typography>
												</CardContent>
											</Card>
										</Grid>
										<Grid size={{ xs: 12, sm: 4 }}>
											<Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
												<CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
													<Typography variant="caption" color="text.secondary">Total Deductions</Typography>
													<Typography variant="h6" fontWeight={700} color="error.main">
														₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</Typography>
												</CardContent>
											</Card>
										</Grid>
										<Grid size={{ xs: 12, sm: 4 }}>
											<Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
												<CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
													<Typography variant="caption" color="text.secondary">Net Pay (Take Home)</Typography>
													<Typography variant="h6" fontWeight={700} color="success.main">
														₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</Typography>
												</CardContent>
											</Card>
										</Grid>
									</Grid>
								</CardContent>
							</Card>

							{/* Payslip Audit Table */}
							<Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
										<Typography variant="subtitle2" fontWeight={700}>
											Audit Register ({payslips.length} Employees)
										</Typography>
										{selectedRun.status !== 'finalized' && isAdmin && (
											<Button size="small" startIcon={<MoneyIcon />} onClick={() => setOpenVarDialog(true)}>
												Add Variable / Override
											</Button>
										)}
									</Box>
									<Divider sx={{ mb: 2 }} />

									{payslips.length === 0 ? (
										<Alert severity="info">No records processed. Click "Calculate / Update" above to run calculations.</Alert>
									) : (
										<TableContainer component={Paper} variant="outlined">
											<Table size="small">
												<TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
													<TableRow>
														<TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
														<TableCell sx={{ fontWeight: 700 }}>LOP Days</TableCell>
														<TableCell sx={{ fontWeight: 700 }}>Gross Pay</TableCell>
														<TableCell sx={{ fontWeight: 700 }}>Deductions</TableCell>
														<TableCell sx={{ fontWeight: 700 }}>Net Take-Home</TableCell>
														<TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{payslips.map((slip) => (
														<TableRow key={slip.id}>
															<TableCell>
																<Typography variant="body2" fontWeight={600}>
																	{slip.employee_name || '—'}
																</Typography>
															</TableCell>
															<TableCell>{slip.lop_days}</TableCell>
															<TableCell>₹{slip.gross_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
															<TableCell>₹{slip.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
															<TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
																₹{slip.net_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
															</TableCell>
															<TableCell align="right">
																<IconButton
																	size="small"
																	color="primary"
																	title="View Details / PDF"
																	onClick={() => handleDownloadPdf(slip.public_id)}
																>
																	<DownloadIcon fontSize="small" />
																</IconButton>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TableContainer>
									)}
								</CardContent>
							</Card>
						</Stack>
					) : (
						<Alert severity="info">Create or select a monthly payroll run from the sidebar list.</Alert>
					)}
				</Grid>
			</Grid>

			{/* Create Run Dialog */}
			<Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="xs" fullWidth>
				<DialogTitle>New Payroll Run</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<FormControl fullWidth>
							<InputLabel>Month</InputLabel>
							<Select
								value={runMonth}
								label="Month"
								onChange={(e) => setRunMonth(Number(e.target.value))}
							>
								{Array.from({ length: 12 }).map((_, i) => (
									<MenuItem key={i + 1} value={i + 1}>{getMonthName(i + 1)}</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							label="Year"
							fullWidth
							type="number"
							value={runYear}
							onChange={(e) => setRunYear(Number(e.target.value))}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleCreateRun}>Create Run</Button>
				</DialogActions>
			</Dialog>

			{/* Variable Pay Dialog */}
			<Dialog open={openVarDialog} onClose={() => setOpenVarDialog(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Add Variable Earnings / Deduction Override</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<FormControl fullWidth>
							<InputLabel>Select Employee</InputLabel>
							<Select
								value={varUserId}
								label="Select Employee"
								onChange={(e) => setVarUserId(e.target.value as number)}
							>
								{employees.map((emp) => (
									<MenuItem key={emp.public_id} value={emp.user_id}>{emp.full_name || emp.email}</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel>Component Code</InputLabel>
							<Select
								value={varCompCode}
								label="Component Code"
								onChange={(e) => setVarCompCode(e.target.value)}
							>
								<MenuItem value="BONUS">Bonus (Earning)</MenuItem>
								<MenuItem value="INCENTIVE">Incentive (Earning)</MenuItem>
								<MenuItem value="TDS">TDS Override (Deduction)</MenuItem>
								<MenuItem value="OTHER_DED">Other Deduction (Deduction)</MenuItem>
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel>Type</InputLabel>
							<Select
								value={varEntryType}
								label="Type"
								onChange={(e) => setVarEntryType(e.target.value as 'earning' | 'deduction')}
							>
								<MenuItem value="earning">Earning Addition</MenuItem>
								<MenuItem value="deduction">Deduction Override</MenuItem>
							</Select>
						</FormControl>

						<TextField
							label="Amount (INR)"
							fullWidth
							type="number"
							value={varAmount}
							onChange={(e) => setVarAmount(e.target.value)}
						/>

						<TextField
							label="Reason"
							fullWidth
							value={varReason}
							onChange={(e) => setVarReason(e.target.value)}
							placeholder="Performance bonus / TDS extra deduction"
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenVarDialog(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleSaveVariablePay}>Apply & Re-calculate</Button>
				</DialogActions>
			</Dialog>
		</HRLayout>
	);
};

export default PayrollRunsPage;
