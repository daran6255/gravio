import React, { useState, useEffect } from 'react';
import {
	Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
	CircularProgress, Typography, Table, TableBody, TableCell, TableContainer,
	TableHead, TableRow, Paper, Box, alpha, useTheme
} from '@mui/material';
import { BaseDialog } from '../../../../common/dialogbox';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchEmployeeLeaveBalances, updateLeaveBalance } from '../../../../../store/slices/hrSlice';
import type { HREmployeeListItem } from '../../../../../models/hr';
import useToast from '../../../../../hooks/useToast';

interface LeaveEntitlementsDialogProps {
	open: boolean;
	onClose: () => void;
	employee: HREmployeeListItem | null;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
	currentYear - 2,
	currentYear - 1,
	currentYear,
	currentYear + 1,
	currentYear + 2
];

export const LeaveEntitlementsDialog: React.FC<LeaveEntitlementsDialogProps> = ({ open, onClose, employee }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	
	const { employeeLeaveBalances, employeeLeaveBalancesLoading: loading } = useAppSelector((state) => state.hr);
	
	const [selectedYear, setSelectedYear] = useState<number>(currentYear);
	const [allocations, setAllocations] = useState<Record<number, number>>({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open && employee?.user_id) {
			dispatch(fetchEmployeeLeaveBalances({ userId: employee.user_id, year: selectedYear }));
			setAllocations({});
		}
	}, [open, employee, selectedYear, dispatch]);

	const handleYearChange = (year: number) => {
		setSelectedYear(year);
	};

	const handleAllocationChange = (id: number, value: string) => {
		const val = parseInt(value, 10);
		setAllocations(prev => ({
			...prev,
			[id]: isNaN(val) ? 0 : val
		}));
	};

	const handleSave = async () => {
		if (!employee?.user_id) return;
		setSaving(true);
		try {
			const updatePromises = Object.entries(allocations).map(([idStr, val]) => {
				const id = parseInt(idStr, 10);
				return dispatch(updateLeaveBalance({ id, payload: { allocated: val } })).unwrap();
			});
			
			await Promise.all(updatePromises);
			success('Leave entitlements updated successfully');
			dispatch(fetchEmployeeLeaveBalances({ userId: employee.user_id, year: selectedYear }));
			setAllocations({});
			onClose();
		} catch (e: any) {
			error(e || 'Failed to update leave entitlements');
		} finally {
			setSaving(false);
		}
	};

	const hasChanges = Object.keys(allocations).length > 0;

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Leave Entitlements"
			subtitle={employee ? `Manage leave balances for ${employee.full_name || employee.email}` : ''}
			maxWidth="md"
			loading={saving}
			actions={
				<>
					<Button onClick={onClose} disabled={saving} sx={{ borderRadius: 3 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving || !hasChanges}
						sx={{ borderRadius: 3, fontWeight: 700 }}
					>
						{saving ? <CircularProgress size={20} color="inherit" /> : 'Save Entitlements'}
					</Button>
				</>
			}
		>
			<Stack spacing={3}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					{employee && (
						<Typography variant="body2" color="text.secondary">
							Emp ID: <strong>{employee.employee_id || '—'}</strong>
						</Typography>
					)}
					<FormControl size="small" sx={{ width: 140 }}>
						<InputLabel id="year-select-label">Year</InputLabel>
						<Select
							labelId="year-select-label"
							value={selectedYear}
							label="Year"
							onChange={(e) => handleYearChange(e.target.value as number)}
							disabled={loading || saving}
						>
							{YEAR_OPTIONS.map((y) => (
								<MenuItem key={y} value={y}>
									{y}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
						<CircularProgress />
					</Box>
				) : employeeLeaveBalances.length === 0 ? (
					<Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center', fontStyle: 'italic' }}>
						No leave balances found for this employee in {selectedYear}.
					</Typography>
				) : (
					<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
						<Table size="small">
							<TableHead>
								<TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
									<TableCell sx={{ fontWeight: 700, py: 1.5 }}>Leave Type</TableCell>
									<TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Code</TableCell>
									<TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Allocated</TableCell>
									<TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Used</TableCell>
									<TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Pending</TableCell>
									<TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Current Balance</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{employeeLeaveBalances.map((balance) => {
									const isModified = balance.id in allocations;
									const allocatedVal = isModified ? allocations[balance.id] : balance.allocated;
									const currentBalance = allocatedVal - balance.used;

									return (
										<TableRow key={balance.id} hover>
											<TableCell sx={{ py: 1.5 }}>
												<Typography variant="body2" fontWeight={600}>
													{balance.leave_type_name || '—'}
												</Typography>
											</TableCell>
											<TableCell sx={{ py: 1.5 }} align="center">
												<Typography variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'action.selected', borderRadius: 1.5, fontWeight: 700 }}>
													{balance.leave_type_code || '—'}
												</Typography>
											</TableCell>
											<TableCell sx={{ py: 1.5 }} align="right">
												<TextField
													type="number"
													size="small"
													value={allocatedVal}
													onChange={(e) => handleAllocationChange(balance.id, e.target.value)}
													inputProps={{ min: 0, style: { textAlign: 'right', fontWeight: isModified ? 700 : 500 } }}
													sx={{
														width: 80,
														'& .MuiOutlinedInput-root': {
															bgcolor: isModified ? alpha(theme.palette.warning.main, 0.05) : 'transparent',
															'& fieldset': {
																borderColor: isModified ? theme.palette.warning.main : 'rgba(0,0,0,0.1)',
															},
														},
													}}
													disabled={saving}
												/>
											</TableCell>
											<TableCell sx={{ py: 1.5, color: 'text.secondary' }} align="right">
												{balance.used}
											</TableCell>
											<TableCell sx={{ py: 1.5, color: 'text.secondary' }} align="right">
												{balance.pending}
											</TableCell>
											<TableCell sx={{ py: 1.5 }} align="right">
												<Typography variant="body2" fontWeight={700} color={currentBalance < 0 ? 'error.main' : 'primary.main'}>
													{currentBalance}
												</Typography>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default LeaveEntitlementsDialog;
