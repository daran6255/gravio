import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Button, Card, CardContent, Divider, Grid,
	Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead,
	TableRow, Paper, TextField, Dialog, DialogTitle, DialogContent,
	DialogActions, MenuItem, Select, FormControl, InputLabel,
	IconButton, Chip, Alert, Stack, alpha, useTheme
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Settings as SettingsIcon,
	AssignmentInd as AssignmentIcon
} from '@mui/icons-material';
import HRLayout from '../../components/hr/HRLayout';
import {
	hrPayrollStructureApi,
	hrPayrollComponentApi,
	hrEmployeeSalaryApi,
	hrEmployeeApi
} from '../../services/hrService';
import type {
	HRSalaryStructure,
	HRSalaryComponent,
	HREmployeeSalary,
	HREmployeeListItem,
	HRSalaryStructureItemCreate
} from '../../models/hr';
import useToast from '../../hooks/useToast';
import { useAppSelector } from '../../store/hooks';

const SalaryStructuresPage: React.FC = () => {
	const theme = useTheme();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin';

	const [activeTab, setActiveTab] = useState(0);
	const [structures, setStructures] = useState<HRSalaryStructure[]>([]);
	const [components, setComponents] = useState<HRSalaryComponent[]>([]);
	const [allocations, setAllocations] = useState<HREmployeeSalary[]>([]);
	const [employees, setEmployees] = useState<HREmployeeListItem[]>([]);

	// Dialog States - Structure
	const [openStructDialog, setOpenStructDialog] = useState(false);
	const [structName, setStructName] = useState('');
	const [structDesc, setStructDesc] = useState('');
	const [structItems, setStructItems] = useState<HRSalaryStructureItemCreate[]>([]);

	// Dialog States - Allocation
	const [openAllocDialog, setOpenAllocDialog] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
	const [selectedStructId, setSelectedStructId] = useState<number | ''>('');
	const [ctcAmount, setCtcAmount] = useState('');
	const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

	const loadData = async () => {
		try {
			const [structsList, compsList, empsList] = await Promise.all([
				hrPayrollStructureApi.list(),
				hrPayrollComponentApi.list(),
				hrEmployeeApi.list({ limit: 100 }).then(r => r.items)
			]);
			setStructures(structsList);
			setComponents(compsList);
			setEmployees(empsList);

			// Load salary allocations for employees
			const allocPromises = empsList.map(emp => 
				hrEmployeeSalaryApi.get(emp.user_id)
					.catch(() => null)
			);
			const allocResults = await Promise.all(allocPromises);
			setAllocations(allocResults.filter((a): a is HREmployeeSalary => a !== null));
		} catch {
			error('Failed to load payroll configuration');
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleAddStructureItem = () => {
		setStructItems([...structItems, { salary_component_id: components[0]?.id || 0, calculation_type: 'formula', value_expr: '' }]);
	};

	const handleRemoveStructureItem = (index: number) => {
		setStructItems(structItems.filter((_, i) => i !== index));
	};

	const handleItemChange = (index: number, field: keyof HRSalaryStructureItemCreate, value: any) => {
		const updated = [...structItems];
		updated[index] = { ...updated[index], [field]: value };
		setStructItems(updated);
	};

	const handleSaveStructure = async () => {
		if (!structName.trim()) {
			error('Structure name is required');
			return;
		}
		try {
			await hrPayrollStructureApi.create({
				name: structName,
				description: structDesc,
				items: structItems
			});
			success('Salary Structure created successfully');
			setOpenStructDialog(false);
			loadData();
		} catch {
			error('Failed to create salary structure');
		}
	};

	const handleDeleteStructure = async (id: number) => {
		if (window.confirm('Are you sure you want to delete this salary structure?')) {
			try {
				await hrPayrollStructureApi.delete(id);
				success('Salary structure deleted');
				loadData();
			} catch {
				error('Failed to delete salary structure');
			}
		}
	};

	const handleSaveAllocation = async () => {
		if (!selectedUserId || !selectedStructId || !ctcAmount) {
			error('All fields are required');
			return;
		}
		try {
			await hrEmployeeSalaryApi.assign({
				user_id: Number(selectedUserId),
				structure_id: Number(selectedStructId),
				ctc: Number(ctcAmount),
				effective_from: effectiveDate
			});
			success('Salary structure assigned successfully');
			setOpenAllocDialog(false);
			loadData();
		} catch {
			error('Failed to assign salary structure');
		}
	};

	const getEmployeeAlloc = (userId: number) => {
		return allocations.find(a => a.user_id === userId);
	};

	return (
		<HRLayout
			title="Salary Config & Allocations"
			subtitle="Configure salary structures, statutory rules, and map them to employee profiles"
		>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
					<Tab icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Salary Structures" />
					<Tab icon={<AssignmentIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Employee Assignments" />
				</Tabs>
			</Box>

			{activeTab === 0 && (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
						<Typography variant="subtitle1" fontWeight={700}>
							Structure Templates
						</Typography>
						{isAdmin && (
							<Button
								variant="contained"
								startIcon={<AddIcon />}
								onClick={() => {
									setStructName('');
									setStructDesc('');
									setStructItems([]);
									setOpenStructDialog(true);
								}}
							>
								Create Structure
							</Button>
						)}
					</Box>

					{structures.length === 0 ? (
						<Alert severity="info">No salary structures configured. Create one to get started.</Alert>
					) : (
						<Grid container spacing={3}>
							{structures.map((struct) => (
								<Grid size={{ xs: 12, md: 6 }} key={struct.id}>
									<Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
										<CardContent>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
												<Typography variant="h6" fontWeight={700} color="primary.main">
													{struct.name}
												</Typography>
												{isAdmin && (
													<IconButton color="error" size="small" onClick={() => handleDeleteStructure(struct.id)}>
														<DeleteIcon fontSize="small" />
													</IconButton>
												)}
											</Box>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
												{struct.description || 'No description provided.'}
											</Typography>
											<Divider sx={{ my: 1.5 }} />
											<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
												Components & Rules:
											</Typography>
											<Stack spacing={1}>
												{struct.items.map((item) => (
													<Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
														<Box>
															<Typography variant="body2" fontWeight={600}>
																{item.component?.name} ({item.component?.code})
															</Typography>
															<Typography variant="caption" color="text.disabled">
																{item.calculation_type === 'formula' ? 'Formula' : 'Flat rate'}
															</Typography>
														</Box>
														<Chip
															label={item.value_expr}
															size="small"
															color="primary"
															variant="outlined"
															sx={{ fontFamily: 'monospace', fontWeight: 600 }}
														/>
													</Box>
												))}
											</Stack>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>
					)}
				</Box>
			)}

			{activeTab === 1 && (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
						<Typography variant="subtitle1" fontWeight={700}>
							Employee Salary CTC Setup
						</Typography>
						{isAdmin && (
							<Button
								variant="contained"
								startIcon={<AssignmentIcon />}
								onClick={() => {
									setSelectedUserId('');
									setSelectedStructId('');
									setCtcAmount('');
									setOpenAllocDialog(true);
								}}
							>
								Assign Structure
							</Button>
						)}
					</Box>

					<TableContainer component={Paper} variant="outlined">
						<Table>
							<TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
								<TableRow>
									<TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Assigned Structure</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Monthly CTC (INR)</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Annual CTC (INR)</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Effective From</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{employees.map((emp) => {
									const alloc = getEmployeeAlloc(emp.user_id);
									return (
										<TableRow key={emp.public_id}>
											<TableCell>
												<Typography variant="body2" fontWeight={600}>
													{emp.full_name || emp.email}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{emp.employee_id || 'No ID'}
												</Typography>
											</TableCell>
											<TableCell>{emp.department_name || '—'}</TableCell>
											<TableCell>
												{alloc ? (
													<Chip label={alloc.structure_name} color="primary" variant="outlined" size="small" />
												) : (
													<Chip label="Not Configured" color="warning" variant="filled" size="small" />
												)}
											</TableCell>
											<TableCell>
												{alloc ? `₹${(alloc.ctc / 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
											</TableCell>
											<TableCell>
												{alloc ? `₹${alloc.ctc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
											</TableCell>
											<TableCell>{alloc ? alloc.effective_from : '—'}</TableCell>
											<TableCell>
												{alloc ? (
													<Chip label="Active" color="success" size="small" />
												) : (
													<Chip label="Inactive" color="error" size="small" />
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			)}

			{/* Create Structure Dialog */}
			<Dialog open={openStructDialog} onClose={() => setOpenStructDialog(false)} maxWidth="md" fullWidth>
				<DialogTitle>Create Salary Structure</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<TextField
							label="Structure Name"
							fullWidth
							value={structName}
							onChange={(e) => setStructName(e.target.value)}
							placeholder="e.g. Standard CTC Structure"
						/>
						<TextField
							label="Description"
							fullWidth
							multiline
							rows={2}
							value={structDesc}
							onChange={(e) => setStructDesc(e.target.value)}
						/>
						<Divider />
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography variant="subtitle2" fontWeight={700}>
								Earning Components Rules:
							</Typography>
							<Button startIcon={<AddIcon />} size="small" onClick={handleAddStructureItem}>
								Add Component Rule
							</Button>
						</Box>

						{structItems.map((item, idx) => (
							<Grid container spacing={2} alignItems="center" key={idx}>
								<Grid size={{ xs: 12, sm: 4 }}>
									<FormControl fullWidth size="small">
										<InputLabel>Component</InputLabel>
										<Select
											value={item.salary_component_id}
											label="Component"
											onChange={(e) => handleItemChange(idx, 'salary_component_id', e.target.value)}
										>
											{components.filter(c => c.component_type === 'earning').map((c) => (
												<MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 3 }}>
									<FormControl fullWidth size="small">
										<InputLabel>Calc Type</InputLabel>
										<Select
											value={item.calculation_type}
											label="Calc Type"
											onChange={(e) => handleItemChange(idx, 'calculation_type', e.target.value)}
										>
											<MenuItem value="formula">Formula</MenuItem>
											<MenuItem value="flat">Flat Amount</MenuItem>
										</Select>
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										label="Expression / Amount"
										size="small"
										fullWidth
										value={item.value_expr}
										onChange={(e) => handleItemChange(idx, 'value_expr', e.target.value)}
										placeholder={item.calculation_type === 'formula' ? '0.50 * CTC' : '15000'}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 1 }}>
									<IconButton color="error" size="small" onClick={() => handleRemoveStructureItem(idx)}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Grid>
							</Grid>
						))}

						<Typography variant="caption" color="text.secondary">
							Note: Statutory deductions (PF, ESI, Professional Tax, LOP, and TDS) are computed automatically based on Indian legal slab rules and don't need manual rules.
						</Typography>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenStructDialog(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleSaveStructure}>Save Structure</Button>
				</DialogActions>
			</Dialog>

			{/* Assign Structure Dialog */}
			<Dialog open={openAllocDialog} onClose={() => setOpenAllocDialog(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Assign Salary Structure to Employee</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<FormControl fullWidth>
							<InputLabel>Select Employee</InputLabel>
							<Select
								value={selectedUserId}
								label="Select Employee"
								onChange={(e) => setSelectedUserId(e.target.value as number)}
							>
								{employees.map((emp) => (
									<MenuItem key={emp.public_id} value={emp.user_id}>{emp.full_name || emp.email}</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel>Select Structure</InputLabel>
							<Select
								value={selectedStructId}
								label="Select Structure"
								onChange={(e) => setSelectedStructId(e.target.value as number)}
							>
								{structures.map((s) => (
									<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							label="Annual CTC (INR)"
							fullWidth
							type="number"
							value={ctcAmount}
							onChange={(e) => setCtcAmount(e.target.value)}
							placeholder="e.g. 600000"
						/>

						<TextField
							label="Effective Date"
							fullWidth
							type="date"
							value={effectiveDate}
							onChange={(e) => setEffectiveDate(e.target.value)}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenAllocDialog(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleSaveAllocation}>Assign & Save</Button>
				</DialogActions>
			</Dialog>
		</HRLayout>
	);
};

export default SalaryStructuresPage;
