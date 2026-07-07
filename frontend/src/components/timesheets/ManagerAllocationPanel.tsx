import React, { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Button,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Checkbox,
	CircularProgress,
	Chip,
	Stack,
	Tooltip,
	InputAdornment,
	useTheme,
	alpha,
	Pagination
} from '@mui/material';
import {
	Search as SearchIcon,
	Warning as WarningIcon,
	CheckCircle as SuccessIcon,
	Group as GroupIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeamUsers, updateTeamUser } from '../../store/slices/userSlice';
import { fetchOwners } from '../../store/slices/crmSlice';
import useToast from '../../hooks/useToast';
import type { TeamMember } from '../../models/user';

export const ManagerAllocationPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const toast = useToast();

	// Redux state
	const { users: allUsers, loading: usersLoading } = useAppSelector((state) => state.users);
	const { owners } = useAppSelector((state) => state.crm);

	// Local state
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [updatingUserPublicId, setUpdatingUserPublicId] = useState<string | null>(null);
	const [bulkManagerId, setBulkManagerId] = useState<number | ''>('');
	const [bulkLoading, setBulkLoading] = useState(false);
	const [roleFilterOnlyManagers, setRoleFilterOnlyManagers] = useState(true);
	
	// Pagination state
	const [page, setPage] = useState(1);
	const itemsPerPage = 10;

	// Fetch all users and managers on mount
	useEffect(() => {
		// Fetch a large number of users to perform robust local operations
		dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		dispatch(fetchOwners());
	}, [dispatch]);

	// Filter managers by role if filter is active
	const filteredManagers = useMemo(() => {
		if (!roleFilterOnlyManagers) return owners;
		
		// Find user emails that are admin or manager
		const adminOrManagerEmails = new Set(
			allUsers
				.filter(u => u.role === 'admin' || u.role === 'manager')
				.map(u => u.email)
		);

		return owners.filter(o => adminOrManagerEmails.has(o.email));
	}, [owners, allUsers, roleFilterOnlyManagers]);

	// Trace reporting manager chain to detect circular reporting
	const wouldCreateCycle = (employeeEmail: string, potentialManagerId: number | ''): boolean => {
		if (!potentialManagerId) return false;
		
		const targetManager = owners.find(o => o.id === potentialManagerId);
		if (!targetManager) return false;
		
		if (employeeEmail === targetManager.email) return true;

		const visited = new Set<string>([employeeEmail]);
		let currentEmail = targetManager.email;

		while (currentEmail) {
			if (visited.has(currentEmail)) {
				return true;
			}
			visited.add(currentEmail);

			// Find teammate in allUsers by current email to get their manager
			const teammate = allUsers.find(u => u.email === currentEmail);
			if (!teammate || !teammate.reporting_manager_id) {
				break;
			}

			// Find manager's email by reporting_manager_id
			const manager = owners.find(o => o.id === teammate.reporting_manager_id);
			if (!manager) {
				break;
			}
			currentEmail = manager.email;
		}

		return false;
	};

	// Perform individual update
	const handleManagerChange = async (user: TeamMember, newManagerId: number | '') => {
		setUpdatingUserPublicId(user.public_id);
		try {
			await dispatch(
				updateTeamUser({
					publicId: user.public_id,
					payload: {
						reporting_manager_id: newManagerId === '' ? null : newManagerId
					}
				})
			).unwrap();
			toast.success(`Manager updated for ${user.full_name || user.username}`);
			// Reload the list of users to keep frontend in sync
			dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		} catch (err: any) {
			toast.error(err || 'Failed to update reporting manager.');
		} finally {
			setUpdatingUserPublicId(null);
		}
	};

	// Bulk apply manager to checked employees
	const handleBulkApply = async () => {
		if (bulkManagerId === '') return;
		setBulkLoading(true);
		
		// Find selected users
		const selectedUsers = allUsers.filter(u => selectedIds.includes(u.public_id));
		
		// Validate cycles for all selected users first
		const cycleUsers = selectedUsers.filter(u => wouldCreateCycle(u.email, bulkManagerId));
		if (cycleUsers.length > 0) {
			const names = cycleUsers.map(u => u.full_name || u.username).join(', ');
			toast.error(`Cannot apply: Circular reporting detected for: ${names}`);
			setBulkLoading(false);
			return;
		}

		let successCount = 0;
		let failCount = 0;

		try {
			await Promise.all(
				selectedUsers.map(async (u) => {
					try {
						await dispatch(
							updateTeamUser({
								publicId: u.public_id,
								payload: {
									reporting_manager_id: bulkManagerId
								}
							})
						).unwrap();
						successCount++;
					} catch {
						failCount++;
					}
				})
			);

			if (successCount > 0) {
				toast.success(`Successfully assigned manager for ${successCount} employees.`);
			}
			if (failCount > 0) {
				toast.error(`Failed to assign manager for ${failCount} employees.`);
			}

			// Clear state and refresh
			setSelectedIds([]);
			setBulkManagerId('');
			dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		} catch (err: any) {
			toast.error('An error occurred during bulk assignment.');
		} finally {
			setBulkLoading(false);
		}
	};

	// Selection handlers
	const handleSelectAll = (checked: boolean, visibleUsers: TeamMember[]) => {
		if (checked) {
			const visibleIds = visibleUsers.map((u) => u.public_id);
			setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
		} else {
			const visibleIds = visibleUsers.map((u) => u.public_id);
			setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
		}
	};

	const handleSelectRow = (checked: boolean, publicId: string) => {
		if (checked) {
			setSelectedIds((prev) => [...prev, publicId]);
		} else {
			setSelectedIds((prev) => prev.filter((id) => id !== publicId));
		}
	};

	// Client-side search and filtering
	const processedUsers = useMemo(() => {
		return allUsers.filter((u) => {
			const query = searchTerm.toLowerCase();
			return (
				(u.full_name || '').toLowerCase().includes(query) ||
				u.email.toLowerCase().includes(query) ||
				u.username.toLowerCase().includes(query) ||
				u.role.toLowerCase().includes(query)
			);
		});
	}, [allUsers, searchTerm]);

	// Paginated list
	const paginatedUsers = useMemo(() => {
		const start = (page - 1) * itemsPerPage;
		return processedUsers.slice(start, start + itemsPerPage);
	}, [processedUsers, page]);

	// Total pages
	const pageCount = Math.ceil(processedUsers.length / itemsPerPage);

	// Reset page on search change
	useEffect(() => {
		setPage(1);
	}, [searchTerm]);

	const getRoleLabelColor = (role: string) => {
		switch (role) {
			case 'admin': return 'error';
			case 'manager': return 'warning';
			default: return 'primary';
		}
	};

	if (usersLoading && allUsers.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress size={40} />
			</Box>
		);
	}

	return (
		<Stack spacing={3}>
			{/* Controls and Stats Header */}
			<Paper
				sx={{
					p: 3,
					borderRadius: '16px',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					boxShadow: 'none',
					bgcolor: isDark ? 'rgba(255,255,255,0.01)' : '#fcfcfd'
				}}
			>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ xs: 'stretch', md: 'center' }}
					spacing={2}
				>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<GroupIcon color="primary" sx={{ fontSize: 28 }} />
						<Box>
							<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
								Organization Relationships
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Assign reporting managers to employees. Only Admins and Managers can approve timesheets.
							</Typography>
						</Box>
					</Stack>

					<Box sx={{ display: 'flex', gap: 2 }}>
						<Button
							variant="outlined"
							size="small"
							onClick={() => setRoleFilterOnlyManagers(!roleFilterOnlyManagers)}
							sx={{
								textTransform: 'none',
								borderRadius: '8px',
								borderColor: roleFilterOnlyManagers ? 'primary.main' : 'divider',
								color: roleFilterOnlyManagers ? 'primary.main' : 'text.secondary',
								fontWeight: 600
							}}
						>
							{roleFilterOnlyManagers ? 'Showing Admins & Managers Only' : 'Showing All Members as Potential Managers'}
						</Button>
					</Box>
				</Stack>
			</Paper>

			{/* Bulk Actions Banner */}
			{selectedIds.length > 0 && (
				<Paper
					sx={{
						p: 2.5,
						borderRadius: '12px',
						border: '1px solid',
						borderColor: theme.palette.primary.main,
						bgcolor: isDark ? alpha(theme.palette.primary.main, 0.05) : '#f4f3ff',
						boxShadow: '0 4px 20px rgba(139, 124, 246, 0.1)'
					}}
				>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						alignItems={{ xs: 'stretch', sm: 'center' }}
						justifyContent="space-between"
						spacing={2}
					>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<SuccessIcon color="primary" />
							<Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
								{selectedIds.length} employees selected for bulk manager update
							</Typography>
						</Stack>
						
						<Stack direction="row" spacing={1.5} alignItems="center">
							<FormControl size="small" sx={{ minWidth: 200 }}>
								<InputLabel id="bulk-manager-select-label">Assign Reporting Manager</InputLabel>
								<Select
									labelId="bulk-manager-select-label"
									value={bulkManagerId}
									label="Assign Reporting Manager"
									onChange={(e) => setBulkManagerId((e.target.value as any) === '' ? '' : Number(e.target.value))}
									disabled={bulkLoading}
									sx={{ borderRadius: '8px', bgcolor: 'background.paper' }}
								>
									<MenuItem value=""><em>None (Clear Manager)</em></MenuItem>
									{filteredManagers.map((m) => (
										<MenuItem key={m.id} value={m.id}>
											{m.full_name || m.email}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<Button
								variant="contained"
								size="small"
								onClick={handleBulkApply}
								disabled={bulkLoading || bulkManagerId === ''}
								sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3 }}
							>
								{bulkLoading ? <CircularProgress size={20} color="inherit" /> : 'Apply'}
							</Button>

							<Button
								variant="text"
								size="small"
								onClick={() => setSelectedIds([])}
								disabled={bulkLoading}
								sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
							>
								Cancel
							</Button>
						</Stack>
					</Stack>
				</Paper>
			)}

			{/* Search and Table */}
			<Paper
				sx={{
					borderRadius: '16px',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					overflow: 'hidden',
					boxShadow: 'none'
				}}
			>
				{/* Search Field */}
				<Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
					<TextField
						placeholder="Search by name, email, or role..."
						variant="outlined"
						size="small"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						fullWidth
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon color="action" />
								</InputAdornment>
							),
							sx: { borderRadius: '10px' }
						}}
					/>
				</Box>

				<TableContainer>
					<Table>
						<TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8f9fa' }}>
							<TableRow>
								<TableCell padding="checkbox">
									<Checkbox
										checked={
											paginatedUsers.length > 0 &&
											paginatedUsers.every((u) => selectedIds.includes(u.public_id))
										}
										indeterminate={
											paginatedUsers.some((u) => selectedIds.includes(u.public_id)) &&
											!paginatedUsers.every((u) => selectedIds.includes(u.public_id))
										}
										onChange={(e) => handleSelectAll(e.target.checked, paginatedUsers)}
										size="small"
									/>
								</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Teammate</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Current Reporting Manager</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Reassign Manager</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paginatedUsers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 6 }}>
										<Typography variant="body1" color="text.secondary">
											No matching teammates found.
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								paginatedUsers.map((user) => {
									const isSelected = selectedIds.includes(user.public_id);
									const isUpdating = updatingUserPublicId === user.public_id;
									
									// Get current manager's info
									const currentManager = owners.find((o) => o.id === user.reporting_manager_id);
									
									// Find the teammate's owner ID to prevent self-reporting
									const selfOwner = owners.find((o) => o.email === user.email);
									const selfOwnerId = selfOwner?.id;

									// Find the manager's role in the organization to check if they have approval access
									const assignedManagerRole = allUsers.find(u => u.email === currentManager?.email)?.role;
									const isManagerAccessWarning = currentManager && 
										assignedManagerRole !== 'admin' && 
										assignedManagerRole !== 'manager';

									return (
										<TableRow
											key={user.public_id}
											selected={isSelected}
											sx={{
												transition: 'background-color 0.2s',
												'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }
											}}
										>
											<TableCell padding="checkbox">
												<Checkbox
													checked={isSelected}
													onChange={(e) => handleSelectRow(e.target.checked, user.public_id)}
													size="small"
												/>
											</TableCell>
											<TableCell>
												<Box>
													<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
														{user.full_name || '-'}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														{user.email} (username: {user.username})
													</Typography>
												</Box>
											</TableCell>
											<TableCell>
												<Chip
													label={user.role.toUpperCase()}
													color={getRoleLabelColor(user.role)}
													size="small"
													variant="outlined"
													sx={{ fontWeight: 600, borderRadius: '4px', fontSize: '0.7rem' }}
												/>
											</TableCell>
											<TableCell>
												{currentManager ? (
													<Stack direction="row" spacing={1} alignItems="center">
														<Box>
															<Typography variant="body2" sx={{ fontWeight: 600 }}>
																{currentManager.full_name || currentManager.email}
															</Typography>
															{isManagerAccessWarning && (
																<Tooltip title="This manager does not have an Admin or Manager role. They will not be able to approve timesheets unless their role is updated.">
																	<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
																		<WarningIcon color="warning" sx={{ fontSize: 13 }} />
																		<Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
																			Missing approval role
																		</Typography>
																	</Stack>
																</Tooltip>
															)}
														</Box>
													</Stack>
												) : (
													<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
														None (Unassigned)
													</Typography>
												)}
											</TableCell>
											<TableCell>
												<Stack direction="row" spacing={1} alignItems="center">
													<FormControl size="small" sx={{ minWidth: 200 }}>
														<Select
															value={user.reporting_manager_id || ''}
															onChange={(e) => handleManagerChange(user, (e.target.value as any) === '' ? '' : Number(e.target.value))}
															disabled={isUpdating}
															displayEmpty
															sx={{ borderRadius: '8px' }}
														>
															<MenuItem value="">
																<em>Unassigned / None</em>
															</MenuItem>
															{filteredManagers.map((m) => {
																// Edge Case 1: Exclude self-reporting
																const isSelf = m.id === selfOwnerId;
																
																// Edge Case 2: Exclude circular loops
																const isCircular = wouldCreateCycle(user.email, m.id);
																
																return (
																	<MenuItem
																		key={m.id}
																		value={m.id}
																		disabled={isSelf || isCircular}
																	>
																		<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
																			<Typography variant="body2" sx={{ textDecoration: isCircular ? 'line-through' : 'none' }}>
																				{m.full_name || m.email}
																			</Typography>
																			{isSelf && (
																				<Typography variant="caption" color="error" sx={{ ml: 1, fontWeight: 600 }}>
																					(Self)
																				</Typography>
																			)}
																			{isCircular && (
																				<Typography variant="caption" color="error" sx={{ ml: 1, fontWeight: 600 }}>
																					(Loop)
																				</Typography>
																			)}
																		</Box>
																	</MenuItem>
																);
															})}
														</Select>
													</FormControl>

													{isUpdating && <CircularProgress size={20} />}
												</Stack>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>

				{/* Table Footer with Pagination */}
				{pageCount > 1 && (
					<Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
						<Pagination
							count={pageCount}
							page={page}
							onChange={(_, p) => setPage(p)}
							color="primary"
							size="medium"
						/>
					</Box>
				)}
			</Paper>
		</Stack>
	);
};

export default ManagerAllocationPanel;
