import React, { useState, useEffect } from 'react';
import {
	Box, Container, Grid, Typography, Card, CardContent, Button, Chip, Tabs, Tab,
	Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
	Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
	FormControl, InputLabel, Select, MenuItem, Stack, Checkbox,
	FormControlLabel, Tooltip, Skeleton, Divider,
	alpha, useTheme
} from '@mui/material';
import {
	Add as AddIcon,
	Check as ApproveIcon,
	Close as RejectIcon,
	CancelOutlined as CancelIcon,
	Settings as SettingsIcon,
	CalendarMonthOutlined as CalendarIcon,
	HistoryOutlined as HistoryIcon,
	PeopleAltOutlined as PeopleIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { responsiveStyles } from '../../../theme';
import {
	fetchLeaveTypes, fetchMyLeaveBalances, fetchMyLeaveRequests, fetchPendingLeaveRequests,
	createLeaveRequest, createLeaveType, cancelLeaveRequest, approveRejectLeaveRequest
} from '../../../store/slices/hrSlice';
import type {
	HRLeaveTypeListItem, HRLeaveBalanceResponse,
	HRLeaveRequestCreate, HRLeaveTypeCreate
} from '../../../models/hr';
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '../../../models/hr';
import useToast from '../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

// ---------------------------------------------------------------------------
// Apply Leave Dialog
// ---------------------------------------------------------------------------

interface ApplyLeaveDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: () => void;
	leaveTypes: HRLeaveTypeListItem[];
	balances: HRLeaveBalanceResponse[];
}

const ApplyLeaveDialog: React.FC<ApplyLeaveDialogProps> = ({ open, onClose, onSave, leaveTypes, balances }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const [saving, setSaving] = useState(false);

	const [form, setForm] = useState<HRLeaveRequestCreate>({
		leave_type_id: 0,
		from_date: new Date().toISOString().split('T')[0],
		to_date: new Date().toISOString().split('T')[0],
		is_half_day: false,
		half_day_session: 'forenoon',
		reason: '',
	});

	useEffect(() => {
		if (leaveTypes.length > 0 && !form.leave_type_id) {
			setForm((f) => ({ ...f, leave_type_id: leaveTypes[0].id }));
		}
	}, [leaveTypes, open]);

	const selectedBalance = balances.find((b) => b.leave_type_id === form.leave_type_id);
	const selectedLeaveType = leaveTypes.find((t) => t.id === form.leave_type_id);

	// Compute days requested
	const fromD = new Date(form.from_date);
	const toD = new Date(form.to_date);
	let requestedDays = 0;
	if (!isNaN(fromD.getTime()) && !isNaN(toD.getTime()) && toD >= fromD) {
		requestedDays = form.is_half_day ? 0.5 : (toD.getTime() - fromD.getTime()) / (1000 * 3600 * 24) + 1;
	}

	const handleSave = async () => {
		if (form.leave_type_id === 0) return;
		setSaving(true);
		try {
			await dispatch(createLeaveRequest(form)).unwrap();
			dispatch(fetchMyLeaveBalances(undefined));
			success('Leave request submitted successfully');
			onSave();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to submit leave request');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
			<DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
			<DialogContent>
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<FormControl fullWidth>
						<InputLabel>Leave Type</InputLabel>
						<Select
							value={form.leave_type_id}
							label="Leave Type"
							onChange={(e) => setForm({ ...form, leave_type_id: e.target.value as number })}
						>
							{leaveTypes.map((t) => (
								<MenuItem key={t.id} value={t.id}>{t.name} ({t.code})</MenuItem>
							))}
						</Select>
					</FormControl>

					{selectedBalance && (
						<Box
							sx={{
								p: 1.5,
								borderRadius: 2,
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
							}}
						>
							<Typography variant="caption" color="text.secondary">
								Available Balance for this year: <strong>{selectedBalance.allocated - selectedBalance.used - selectedBalance.pending} days</strong>
								{selectedLeaveType?.is_lop && ' (Loss of Pay Allowed)'}
							</Typography>
						</Box>
					)}

					<Stack direction="row" spacing={2}>
						<TextField
							type="date"
							label="From Date"
							fullWidth
							InputLabelProps={{ shrink: true }}
							value={form.from_date}
							onChange={(e) => setForm({ ...form, from_date: e.target.value })}
						/>
						<TextField
							type="date"
							label="To Date"
							fullWidth
							InputLabelProps={{ shrink: true }}
							value={form.to_date}
							onChange={(e) => setForm({ ...form, to_date: e.target.value })}
							disabled={form.is_half_day}
						/>
					</Stack>

					<FormControlLabel
						control={
							<Checkbox
								checked={form.is_half_day || false}
								onChange={(e) => {
									const checked = e.target.checked;
									setForm({
										...form,
										is_half_day: checked,
										to_date: checked ? form.from_date : form.to_date,
									});
								}}
							/>
						}
						label="Half Day Request"
					/>

					{form.is_half_day && (
						<FormControl fullWidth>
							<InputLabel>Session</InputLabel>
							<Select
								value={form.half_day_session || 'forenoon'}
								label="Session"
								onChange={(e) => setForm({ ...form, half_day_session: e.target.value as string })}
							>
								<MenuItem value="forenoon">Forenoon (First half)</MenuItem>
								<MenuItem value="afternoon">Afternoon (Second half)</MenuItem>
							</Select>
						</FormControl>
					)}

					<TextField
						label="Reason for Leave"
						required
						multiline
						rows={3}
						value={form.reason}
						onChange={(e) => setForm({ ...form, reason: e.target.value })}
					/>

					{requestedDays > 0 && (
						<Typography variant="subtitle2" color="primary.main" fontWeight={700}>
							Total Requested: {requestedDays} day{requestedDays !== 1 ? 's' : ''}
						</Typography>
					)}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} disabled={saving}>Cancel</Button>
				<Button
					variant="contained"
					onClick={handleSave}
					disabled={saving || requestedDays <= 0 || !form.reason?.trim()}
				>
					{saving ? 'Submitting…' : 'Submit Application'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ---------------------------------------------------------------------------
// Leave Type Config Dialog
// ---------------------------------------------------------------------------

interface LeaveTypeDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: () => void;
}

const LeaveTypeDialog: React.FC<LeaveTypeDialogProps> = ({ open, onClose, onSave }) => {
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState<HRLeaveTypeCreate>({
		name: '',
		code: '',
		description: '',
		default_allocation: 12.0,
		is_carry_forward: false,
		max_carry_forward: 0.0,
		is_lop: false,
	});

	const handleSave = async () => {
		if (!form.name.trim() || !form.code.trim()) return;
		setSaving(true);
		try {
			await dispatch(createLeaveType(form)).unwrap();
			success('Leave policy created');
			onSave();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to save policy');
		} finally {
			setForm({ name: '', code: '', description: '', default_allocation: 12.0, is_carry_forward: false, max_carry_forward: 0.0, is_lop: false });
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
			<DialogTitle sx={{ fontWeight: 700 }}>Add Leave Policy Type</DialogTitle>
			<DialogContent>
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Policy Name (e.g. Sick Leave)"
						required fullWidth
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
					/>
					<TextField
						label="Code (e.g. SL)"
						required fullWidth
						value={form.code}
						onChange={(e) => setForm({ ...form, code: e.target.value })}
					/>
					<TextField
						label="Description"
						fullWidth multiline rows={2}
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
					/>
					<TextField
						type="number"
						label="Default Allocation (Days per Year)"
						fullWidth
						value={form.default_allocation}
						onChange={(e) => setForm({ ...form, default_allocation: parseFloat(e.target.value) || 0 })}
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={form.is_carry_forward}
								onChange={(e) => setForm({ ...form, is_carry_forward: e.target.checked })}
							/>
						}
						label="Carry Forward remaining balances to next year"
					/>
					{form.is_carry_forward && (
						<TextField
							type="number"
							label="Max Carry Forward days"
							fullWidth
							value={form.max_carry_forward}
							onChange={(e) => setForm({ ...form, max_carry_forward: parseFloat(e.target.value) || 0 })}
						/>
					)}
					<FormControlLabel
						control={
							<Checkbox
								checked={form.is_lop}
								onChange={(e) => setForm({ ...form, is_lop: e.target.checked })}
							/>
						}
						label="Loss of Pay (LOP) policy type (deduct payment when exhausted)"
					/>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} disabled={saving}>Cancel</Button>
				<Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim() || !form.code.trim()}>
					{saving ? 'Creating…' : 'Create'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

const LeaveDashboardPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const userRole = currentUser?.role || 'developer';

	const isHrAdmin = userRole === 'admin' || userRole === 'hr_admin';
	const isManager = isHrAdmin || userRole === 'hr_manager' || userRole === 'manager';

	const {
		leaveTypes, leaveTypesLoading,
		myLeaveBalances: balances, myLeaveBalancesLoading,
		myLeaveRequests: myRequests, myLeaveRequestsLoading,
		pendingLeaveRequests: pendingApprovals
	} = useAppSelector((state) => state.hr);
	const loading = leaveTypesLoading || myLeaveBalancesLoading || myLeaveRequestsLoading;

	const [activeTab, setActiveTab] = useState(0);

	// Modals
	const [applyOpen, setApplyOpen] = useState(false);
	const [policyOpen, setPolicyOpen] = useState(false);

	const fetchData = () => {
		dispatch(fetchLeaveTypes(undefined));
		dispatch(fetchMyLeaveBalances(undefined));
		dispatch(fetchMyLeaveRequests(undefined));
		if (isManager) {
			dispatch(fetchPendingLeaveRequests());
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleCancel = async (publicId: string) => {
		if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
		try {
			await dispatch(cancelLeaveRequest(publicId)).unwrap();
			success('Leave request cancelled');
		} catch {
			error('Failed to cancel request');
		}
	};

	const handleApproval = async (publicId: string, status: 'approved' | 'rejected') => {
		const notes = window.prompt(`Add approval/rejection notes (optional):`);
		if (notes === null) return;
		try {
			await dispatch(approveRejectLeaveRequest({ publicId, payload: { status, manager_notes: notes } })).unwrap();
			success(`Leave request ${status}`);
		} catch {
			error('Failed to process approval');
		}
	};

	const actionButtons = (
		<Stack direction="row" spacing={1.5}>
			{isHrAdmin && (
				<Button
					variant="outlined"
					startIcon={<SettingsIcon />}
					size="small"
					onClick={() => setPolicyOpen(true)}
					sx={{ fontWeight: 600 }}
				>
					Configure Policies
				</Button>
			)}
			<Button
				variant="contained"
				startIcon={<AddIcon />}
				size="small"
				onClick={() => setApplyOpen(true)}
				sx={{ fontWeight: 600 }}
			>
				Apply Leave
			</Button>
		</Stack>
	);

	return (
		<Container maxWidth="xl" sx={responsiveStyles.pageContainer}>
			<Stack spacing={3}>
				<PageHeader
					title="Leave Management"
					subtitle="Track leaves, verify balances, and manage team approvals"
					action={actionButtons}
				/>
			{loading ? (
				<Stack spacing={3}>
					<Skeleton variant="rounded" height={120} />
					<Skeleton variant="rounded" height={260} />
				</Stack>
			) : (
				<Stack spacing={4}>
					{/* Balance cards */}
					<Grid container spacing={2}>
						{balances.map((bal) => {
							const available = bal.allocated - bal.used - bal.pending;
							return (
								<Grid size={{ xs: 12, sm: 6, md: 3 }} key={bal.public_id}>
									<Card
										sx={{
											border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
											background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
											boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.02)}`,
										}}
									>
										<CardContent sx={{ p: 2.5 }}>
											<Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
												{bal.leave_type_name?.toUpperCase()} ({bal.leave_type_code})
											</Typography>
											<Typography variant="h4" fontWeight={800} color={bal.is_lop ? 'error.main' : 'primary.main'}>
												{bal.is_lop ? 'LOP' : available}
												{!bal.is_lop && <Typography variant="caption" sx={{ ml: 0.5, fontSize: '0.9rem' }}>days</Typography>}
											</Typography>
											<Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
												Available Balance
											</Typography>
											<Divider sx={{ my: 1 }} />
											<Grid container spacing={1} sx={{ mt: 0.5 }}>
												<Grid size={6}>
													<Typography variant="caption" color="text.secondary" display="block">Allocated: <strong>{bal.allocated}</strong></Typography>
												</Grid>
												<Grid size={6}>
													<Typography variant="caption" color="text.secondary" display="block">Used: <strong>{bal.used}</strong></Typography>
												</Grid>
												{bal.pending > 0 && (
													<Grid size={12}>
														<Typography variant="caption" color="warning.main" display="block">Pending Approval: <strong>{bal.pending}</strong></Typography>
													</Grid>
												)}
											</Grid>
										</CardContent>
									</Card>
								</Grid>
							);
						})}
					</Grid>

					{/* Navigation tabs */}
					<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
						<Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
							<Tab label="My Leave History" icon={<HistoryIcon />} iconPosition="start" />
							{isManager && (
								<Tab
									label={`Pending Approvals (${pendingApprovals.length})`}
									icon={<PeopleIcon />}
									iconPosition="start"
									disabled={pendingApprovals.length === 0 && !isHrAdmin}
								/>
							)}
							{isHrAdmin && <Tab label="Leave Policies" icon={<SettingsIcon />} iconPosition="start" />}
						</Tabs>
					</Box>

					{/* Tab 0: Personal Leave History */}
					{activeTab === 0 && (
						<TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
							<Table>
								<TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
									<TableRow>
										<TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>From Date</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>To Date</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{myRequests.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 6 }}>
												<CalendarIcon sx={{ fontSize: '2.5rem', color: 'text.disabled', mb: 1 }} />
												<Typography variant="subtitle2" color="text.secondary">No leave applications yet.</Typography>
											</TableCell>
										</TableRow>
									) : (
										myRequests.map((req) => (
											<TableRow key={req.public_id}>
												<TableCell sx={{ fontWeight: 600 }}>{req.leave_type_name}</TableCell>
												<TableCell>{new Date(req.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
												<TableCell>{new Date(req.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
												<TableCell>{req.total_days} day{req.total_days !== 1 ? 's' : ''}</TableCell>
												<TableCell>
													<Tooltip title={req.reason || 'No reason'}>
														<Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>{req.reason || '—'}</Typography>
													</Tooltip>
												</TableCell>
												<TableCell>
													<Chip
														label={LEAVE_STATUS_LABELS[req.status]}
														color={LEAVE_STATUS_COLORS[req.status]}
														size="small"
														sx={{ fontWeight: 600 }}
													/>
												</TableCell>
												<TableCell>
													{(req.status === 'pending' || (req.status === 'approved' && new Date(req.from_date) > new Date())) ? (
														<Button
															variant="text"
															size="small"
															color="error"
															startIcon={<CancelIcon />}
															onClick={() => handleCancel(req.public_id)}
														>
															Cancel
														</Button>
													) : (
														<Typography variant="caption" color="text.disabled">—</Typography>
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{/* Tab 1: Pending Approvals (Manager View) */}
					{activeTab === 1 && isManager && (
						<TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
							<Table>
								<TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
									<TableRow>
										<TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>From Date</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>To Date</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
										<TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{pendingApprovals.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 6 }}>
												<ApproveIcon sx={{ fontSize: '2.5rem', color: 'text.disabled', mb: 1 }} />
												<Typography variant="subtitle2" color="text.secondary">All caught up! No pending leave requests.</Typography>
											</TableCell>
										</TableRow>
									) : (
										pendingApprovals.map((req) => (
											<TableRow key={req.public_id}>
												<TableCell>
													<Typography variant="subtitle2" fontWeight={700}>{req.employee_name || 'Unknown'}</Typography>
													<Typography variant="caption" color="text.disabled">{req.employee_code || '—'}</Typography>
												</TableCell>
												<TableCell>{req.leave_type_name}</TableCell>
												<TableCell>{new Date(req.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
												<TableCell>{new Date(req.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
												<TableCell>{req.total_days} day{req.total_days !== 1 ? 's' : ''}</TableCell>
												<TableCell sx={{ maxWidth: 220 }}>
													<Typography variant="body2" color="text.secondary">{req.reason || '—'}</Typography>
												</TableCell>
												<TableCell align="center">
													<Stack direction="row" spacing={1} justifyContent="center">
														<Button
															variant="contained"
															size="small"
															color="success"
															startIcon={<ApproveIcon />}
															onClick={() => handleApproval(req.public_id, 'approved')}
														>
															Approve
														</Button>
														<Button
															variant="outlined"
															size="small"
															color="error"
															startIcon={<RejectIcon />}
															onClick={() => handleApproval(req.public_id, 'rejected')}
														>
															Reject
														</Button>
													</Stack>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{/* Tab 2: Leave Policies (Admin configuration) */}
					{activeTab === 2 && isHrAdmin && (
						<TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
							<Table>
								<TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
									<TableRow>
										<TableCell sx={{ fontWeight: 700 }}>Policy Type</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Allocation (Yearly)</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Carry Forward</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Loss of Pay (LOP)</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{leaveTypes.map((policy) => (
										<TableRow key={policy.id}>
											<TableCell sx={{ fontWeight: 600 }}>{policy.name}</TableCell>
											<TableCell sx={{ fontFamily: 'monospace' }}>{policy.code}</TableCell>
											<TableCell>{policy.default_allocation} days</TableCell>
											<TableCell>{policy.is_carry_forward ? `Yes (max ${policy.max_carry_forward} days)` : 'No'}</TableCell>
											<TableCell>
												<Chip
													label={policy.is_lop ? 'Yes' : 'No'}
													size="small"
													color={policy.is_lop ? 'error' : 'default'}
												/>
											</TableCell>
											<TableCell>
												<Chip
													label={policy.is_active ? 'Active' : 'Inactive'}
													size="small"
													color={policy.is_active ? 'success' : 'default'}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Stack>
			)}

			<ApplyLeaveDialog
				open={applyOpen}
				onClose={() => setApplyOpen(false)}
				onSave={fetchData}
				leaveTypes={leaveTypes}
				balances={balances}
			/>

			<LeaveTypeDialog
				open={policyOpen}
				onClose={() => setPolicyOpen(false)}
				onSave={fetchData}
			/>
			</Stack>
		</Container>
	);
};

export default LeaveDashboardPage;
