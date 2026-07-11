import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Grid, Card, CardContent, Paper, Stack,
	Skeleton, useTheme, alpha, Table, TableBody, TableCell,
	TableContainer, TableHead, TableRow
} from '@mui/material';
import {
	People as PeopleIcon, TrendingDown as AttritionIcon,
	EventAvailable as LeaveIcon, AccountBalanceWallet as CostIcon,
	PieChart as PieIcon, Timeline as LineIcon, BarChart as BarIcon
} from '@mui/icons-material';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import HRLayout from '../../components/hr/HRLayout';
import { hrAnalyticsApi } from '../../services/hrService';
import type {
	HeadcountReport,
	AttritionReport,
	LeaveSummaryReport,
	PayrollCostReport
} from '../../models/hr';
import useToast from '../../hooks/useToast';

const AnalyticsDashboardPage: React.FC = () => {
	const theme = useTheme();
	const { error } = useToast();

	const [headcount, setHeadcount] = useState<HeadcountReport | null>(null);
	const [attrition, setAttrition] = useState<AttritionReport | null>(null);
	const [leaves, setLeaves] = useState<LeaveSummaryReport | null>(null);
	const [payroll, setPayroll] = useState<PayrollCostReport | null>(null);
	const [loading, setLoading] = useState(true);

	const loadAnalytics = async () => {
		setLoading(true);
		try {
			const hc = await hrAnalyticsApi.getHeadcount();
			setHeadcount(hc);

			const attr = await hrAnalyticsApi.getAttrition();
			setAttrition(attr);

			const lv = await hrAnalyticsApi.getLeavesSummary();
			setLeaves(lv);

			const pr = await hrAnalyticsApi.getPayrollCosts();
			setPayroll(pr);
		} catch (e: any) {
			error('Failed to load reports analytics');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAnalytics();
	}, []);

	// Headcount chart data
	const getHeadcountPieData = () => {
		if (!headcount) return [];
		return Object.entries(headcount.department_distribution).map(([dept, count], idx) => ({
			id: idx,
			value: count,
			label: dept
		}));
	};

	// Attrition line chart data
	const getAttritionChartData = () => {
		if (!attrition) return { months: [], joiners: [], leavers: [], headcount: [] };
		const months = attrition.timeline.map(t => t.month_year);
		const joiners = attrition.timeline.map(t => t.joiners);
		const leavers = attrition.timeline.map(t => t.leavers);
		const hc = attrition.timeline.map(t => t.headcount);
		return { months, joiners, leavers, headcount: hc };
	};

	// Leaves chart data
	const getLeavesChartData = () => {
		if (!leaves) return { categories: [], used: [], remaining: [] };
		const categories = leaves.leave_type_balances.map(b => b.type);
		const used = leaves.leave_type_balances.map(b => b.used);
		const remaining = leaves.leave_type_balances.map(b => b.remaining);
		return { categories, used, remaining };
	};

	// Payroll chart data
	const getPayrollChartData = () => {
		if (!payroll) return { months: [], gross: [], net: [] };
		const months = payroll.monthly_trend.map(t => t.month_year);
		const gross = payroll.monthly_trend.map(t => t.gross_total);
		const net = payroll.monthly_trend.map(t => t.net_total);
		return { months, gross, net };
	};

	const attData = getAttritionChartData();
	const lvsData = getLeavesChartData();
	const prData = getPayrollChartData();

	return (
		<HRLayout
			title="HR Analytics & Insights"
			subtitle="GreytHR-style aggregated reports on workforce headcount, leaves patterns, attrition, and payroll budgets."
		>
			<Box sx={{ pb: 5 }}>
				{loading ? (
					<Stack spacing={4}>
						<Grid container spacing={3}>
							{[1, 2, 3, 4].map(i => (
								<Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
									<Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
								</Grid>
							))}
						</Grid>
						<Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
					</Stack>
				) : (
					<Stack spacing={4}>
						{/* Key KPI Stats */}
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card sx={{ borderRadius: 3.5, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', p: 1 }}>
									<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', borderRadius: 3, m: 1.5 }}>
										<PeopleIcon />
									</Box>
									<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
										<Typography variant="caption" color="text.secondary" fontWeight={700}>Active Headcount</Typography>
										<Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
											{headcount?.total_count || 0}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card sx={{ borderRadius: 3.5, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', p: 1 }}>
									<Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main', borderRadius: 3, m: 1.5 }}>
										<AttritionIcon />
									</Box>
									<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
										<Typography variant="caption" color="text.secondary" fontWeight={700}>Attrition Rate (12M)</Typography>
										<Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
											{attrition?.annual_attrition_rate || 0}%
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card sx={{ borderRadius: 3.5, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', p: 1 }}>
									<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.08), color: 'warning.main', borderRadius: 3, m: 1.5 }}>
										<LeaveIcon />
									</Box>
									<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
										<Typography variant="caption" color="text.secondary" fontWeight={700}>Approved Leaves</Typography>
										<Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
											{leaves?.total_approved_requests || 0}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card sx={{ borderRadius: 3.5, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', p: 1 }}>
									<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.08), color: 'success.main', borderRadius: 3, m: 1.5 }}>
										<CostIcon />
									</Box>
									<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
										<Typography variant="caption" color="text.secondary" fontWeight={700}>Current Monthly Net</Typography>
										<Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
											₹{(payroll?.current_month_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>

						{/* Charts Row 1: Headcount and Leaves */}
						<Grid container spacing={4}>
							{/* Headcount Department Breakdown */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Paper sx={{ p: 3.5, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
										<PieIcon color="primary" />
										<Typography variant="h6" fontWeight={800}>Headcount by Department</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'center', height: 260 }}>
										{getHeadcountPieData().length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ m: 'auto' }}>No Headcount Data</Typography>
										) : (
											<PieChart
												series={[
													{
														data: getHeadcountPieData(),
														innerRadius: 40,
														outerRadius: 100,
														paddingAngle: 3,
														cornerRadius: 5,
													},
												]}
												width={420}
												height={240}
											/>
										)}
									</Box>
								</Paper>
							</Grid>

							{/* Leaves Utilisation */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Paper sx={{ p: 3.5, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
										<BarIcon color="warning" />
										<Typography variant="h6" fontWeight={800}>Leave Balance Averages (Days)</Typography>
									</Box>
									<Box sx={{ height: 260 }}>
										{lvsData.categories.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>No Leaves Data</Typography>
										) : (
											<BarChart
												xAxis={[{ scaleType: 'band', data: lvsData.categories }]}
												series={[
													{ data: lvsData.used, label: 'Average Used', color: theme.palette.warning.main },
													{ data: lvsData.remaining, label: 'Average Remaining', color: theme.palette.success.main }
												]}
												height={240}
											/>
										)}
									</Box>
								</Paper>
							</Grid>
						</Grid>

						{/* Charts Row 2: Payroll Budget and Attrition */}
						<Grid container spacing={4}>
							{/* Payroll Monthly Expenditure */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Paper sx={{ p: 3.5, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
										<CostIcon color="success" />
										<Typography variant="h6" fontWeight={800}>Payroll Cost Trends</Typography>
									</Box>
									<Box sx={{ height: 260 }}>
										{prData.months.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>No Payroll Data</Typography>
										) : (
											<BarChart
												xAxis={[{ scaleType: 'band', data: prData.months }]}
												series={[
													{ data: prData.gross, label: 'Gross Pay', color: theme.palette.info.light },
													{ data: prData.net, label: 'Net Payout', color: theme.palette.success.main }
												]}
												height={240}
											/>
										)}
									</Box>
								</Paper>
							</Grid>

							{/* Joiners vs Leavers Progression */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Paper sx={{ p: 3.5, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
										<LineIcon color="error" />
										<Typography variant="h6" fontWeight={800}>Employee Influx & Headcount Trend</Typography>
									</Box>
									<Box sx={{ height: 260 }}>
										{attData.months.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>No Attrition Data</Typography>
										) : (
											<LineChart
												xAxis={[{ scaleType: 'point', data: attData.months }]}
												series={[
													{ data: attData.joiners, label: 'Joiners', color: theme.palette.success.main },
													{ data: attData.leavers, label: 'Leavers', color: theme.palette.error.main },
													{ data: attData.headcount, label: 'Headcount Progress', color: theme.palette.primary.main }
												]}
												height={240}
											/>
										)}
									</Box>
								</Paper>
							</Grid>
						</Grid>

						{/* Leaves Table Summary */}
						{leaves && leaves.leave_type_balances.length > 0 && (
							<Paper sx={{ p: 3.5, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
								<Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
									Average Balances Breakdown
								</Typography>
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Average Allocated</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Average Used</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Average Remaining</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{leaves.leave_type_balances.map((row, idx) => (
												<TableRow key={idx}>
													<TableCell sx={{ fontWeight: 600 }}>{row.type}</TableCell>
													<TableCell>{row.allocated} Days</TableCell>
													<TableCell>{row.used} Days</TableCell>
													<TableCell>{row.remaining} Days</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Paper>
						)}
					</Stack>
				)}
			</Box>
		</HRLayout>
	);
};

export default AnalyticsDashboardPage;
