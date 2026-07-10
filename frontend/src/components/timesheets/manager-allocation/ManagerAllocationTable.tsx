import React from 'react';
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
	Switch,
	FormControlLabel,
	useTheme,
	alpha
} from '@mui/material';
import { CustomTablePagination } from '../../common/table';
import {
	Search as SearchIcon,
	Warning as WarningIcon,
	CheckCircle as SuccessIcon
} from '@mui/icons-material';
import type { TeamMember } from '../../../models/user';
import type { CRMOwnerOption } from '../../../models/crm/owner';

interface ManagerAllocationTableProps {
	users: TeamMember[];
	owners: CRMOwnerOption[];
	allUsers: TeamMember[];
	selectedIds: string[];
	onSelectRow: (checked: boolean, publicId: string) => void;
	onSelectAll: (checked: boolean) => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	roleFilterOnlyManagers: boolean;
	onRoleFilterChange: (checked: boolean) => void;
	filterUnassignedOnly: boolean;
	onClearUnassignedFilter: () => void;
	updatingUserPublicId: string | null;
	onManagerChange: (user: TeamMember, newManagerId: number | '') => void;
	bulkManagerId: number | '';
	onBulkManagerChange: (value: number | '') => void;
	bulkLoading: boolean;
	onBulkApply: () => void;
	wouldCreateCycle: (employeeEmail: string, potentialManagerId: number | '') => boolean;
	page: number;
	totalCount: number;
	itemsPerPage: number;
	onItemsPerPageChange: (count: number) => void;
	onPageChange: (page: number) => void;
	filteredManagers: CRMOwnerOption[];
}

export const ManagerAllocationTable: React.FC<ManagerAllocationTableProps> = ({
	users,
	owners,
	allUsers,
	selectedIds,
	onSelectRow,
	onSelectAll,
	searchTerm,
	onSearchChange,
	roleFilterOnlyManagers,
	onRoleFilterChange,
	filterUnassignedOnly,
	onClearUnassignedFilter,
	updatingUserPublicId,
	onManagerChange,
	bulkManagerId,
	onBulkManagerChange,
	bulkLoading,
	onBulkApply,
	wouldCreateCycle,
	page,
	totalCount,
	itemsPerPage,
	onItemsPerPageChange,
	onPageChange,
	filteredManagers
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const getRoleLabelColor = (role: string) => {
		switch (role) {
			case 'admin': return 'error';
			case 'manager': return 'warning';
			default: return 'primary';
		}
	};

	return (
		<Stack spacing={3}>
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
									onChange={(e) => onBulkManagerChange((e.target.value as any) === '' ? '' : Number(e.target.value))}
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
								onClick={onBulkApply}
								disabled={bulkLoading || bulkManagerId === ''}
								sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3 }}
							>
								{bulkLoading ? <CircularProgress size={20} color="inherit" /> : 'Apply'}
							</Button>

							<Button
								variant="text"
								size="small"
								onClick={() => onSelectAll(false)}
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
				{/* Search & Filter Toolbar */}
				<Box 
					sx={{ 
						p: 2.5, 
						borderBottom: '1px solid', 
						borderColor: 'divider', 
						display: 'flex', 
						flexDirection: { xs: 'column', md: 'row' },
						justifyContent: 'space-between',
						alignItems: { xs: 'stretch', md: 'center' },
						gap: 2 
					}}
				>
					<TextField
						placeholder="Search by name, email, or role..."
						variant="outlined"
						size="small"
						value={searchTerm}
						onChange={(e) => onSearchChange(e.target.value)}
						sx={{ maxWidth: { md: 400 }, width: '100%' }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon color="action" />
								</InputAdornment>
							),
							sx: { borderRadius: '10px' }
						}}
					/>
					
					<Stack direction="row" spacing={3} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
						{filterUnassignedOnly && (
							<Chip 
								label="Showing Unassigned Only" 
								onDelete={onClearUnassignedFilter} 
								color="warning"
								size="small"
								sx={{ fontWeight: 700, borderRadius: '8px' }}
							/>
						)}
						<FormControlLabel
							control={
								<Switch 
									checked={roleFilterOnlyManagers} 
									onChange={(e) => onRoleFilterChange(e.target.checked)} 
									color="primary"
									size="small"
								/>
							}
							label={
								<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
									Limit options to Admins & Managers
								</Typography>
							}
						/>
					</Stack>
				</Box>

				<TableContainer>
					<Table>
						<TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8f9fa' }}>
							<TableRow>
								<TableCell padding="checkbox">
									<Checkbox
										checked={
											users.length > 0 &&
											users.every((u) => selectedIds.includes(u.public_id))
										}
										indeterminate={
											users.some((u) => selectedIds.includes(u.public_id)) &&
											!users.every((u) => selectedIds.includes(u.public_id))
										}
										onChange={(e) => onSelectAll(e.target.checked)}
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
							{users.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center" sx={{ py: 6 }}>
										<Typography variant="body1" color="text.secondary">
											No matching teammates found.
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								users.map((user) => {
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
													onChange={(e) => onSelectRow(e.target.checked, user.public_id)}
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
															onChange={(e) => onManagerChange(user, (e.target.value as any) === '' ? '' : Number(e.target.value))}
															disabled={isUpdating}
															displayEmpty
															sx={{ borderRadius: '8px' }}
														>
															<MenuItem value="">
																<em>Unassigned / None</em>
															</MenuItem>
											{(() => {
																// Edge Case 1: self-reporting is normally excluded -- but if this
																// person has no other ASSIGNABLE admin/manager (excluding circular
																// candidates, e.g. someone who already reports to them), there's
																// genuinely no one else, so allow self-approval as a fallback
																// rather than leaving them permanently unable to submit.
																const hasOtherManagers = filteredManagers.some(
																	(m) => m.id !== selfOwnerId && !wouldCreateCycle(user.email, m.id)
																);

																return filteredManagers.map((m) => {
																	const isSelf = m.id === selfOwnerId;
																	const selfBlocked = isSelf && hasOtherManagers;
																	// Edge Case 2: Exclude circular loops (self is its own kind of
																	// "loop" per wouldCreateCycle, handled separately above)
																	const isCircular = !isSelf && wouldCreateCycle(user.email, m.id);

																	return (
																		<MenuItem
																			key={m.id}
																			value={m.id}
																			disabled={selfBlocked || isCircular}
																		>
																			<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
																				<Typography variant="body2" sx={{ textDecoration: isCircular ? 'line-through' : 'none' }}>
																					{m.full_name || m.email}
																				</Typography>
																				{isSelf && (
																					<Typography variant="caption" color={selfBlocked ? 'error' : 'warning.main'} sx={{ ml: 1, fontWeight: 600 }}>
																						{selfBlocked ? '(Self)' : '(Self — no other manager available)'}
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
																});
															})()}
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
				<CustomTablePagination
					count={totalCount}
					page={page - 1}
					rowsPerPage={itemsPerPage}
					onPageChange={(_, newPage) => onPageChange(newPage + 1)}
					onRowsPerPageChange={() => {}}
					onRowsPerPageSelectChange={onItemsPerPageChange}
				/>
			</Paper>
		</Stack>
	);
};

export default ManagerAllocationTable;
