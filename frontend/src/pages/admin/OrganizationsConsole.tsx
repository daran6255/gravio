import React, { useCallback, useEffect, useState } from 'react';
import {
	Box,
	Container,
	Button,
	TableRow,
	TableCell,
	Typography,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Grid,
	Card,
	CardContent,
	Avatar,
	Drawer,
	LinearProgress,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Divider,
	Tooltip,
	Skeleton,
	InputAdornment
} from '@mui/material';
import {
	Add as AddIcon,
	Block,
	CheckCircleOutline,
	CalendarToday,
	Search,
	Business,
	Group,
	Speed,
	DeleteOutline,
	MailOutline,
	Close
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	fetchOrganizations,
	deactivateOrg,
	reactivateOrg,
	fetchAdminStats,
	fetchOrgUsers,
	deactivateOrgUser,
	reactivateOrgUser,
	deleteOrgUser,
	resendOrgUserInvite
} from '../../store/slices/orgAdminSlice';
import useToast from '../../hooks/useToast';
import type { Organization } from '../../models/auth';
import type { TeamMember } from '../../models/user';
import authService from '../../services/authService';

import PageHeader from '../../components/common/page-header';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../components/common/table';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import StatusBadge from '../../components/common/badge/StatusBadge';
import CreateOrganizationDialog from './CreateOrganizationDialog';

const columns: ColumnDefinition<Organization>[] = [
	{ id: 'name', label: 'Organization', sortable: false },
	{ id: 'plan_name', label: 'Plan', sortable: false },
	{ id: 'user_count', label: 'Seats / Users', sortable: false },
	{ id: 'trial_expires_at', label: 'Remaining Period', sortable: false },
	{ id: 'is_active', label: 'Status', sortable: false },
	{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

const getInitials = (name?: string, username?: string) => {
	const displayName = name || username || 'User';
	const parts = displayName.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const OrganizationsConsole: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	
	const {
		organizations,
		loading,
		total,
		stats,
		selectedOrgUsers,
		selectedOrgUsersLoading,
		selectedOrgUsersError
	} = useAppSelector((state) => state.orgAdmin);

	const [page, setPage] = useState(0); // MUI 0-indexed; backend is 1-indexed
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
	const [targetOrg, setTargetOrg] = useState<Organization | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);

	const [extendTrialOpen, setExtendTrialOpen] = useState(false);
	const [extendDays, setExtendDays] = useState('30');
	const [extendLoading, setExtendLoading] = useState(false);

	// Side drawer states
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const [userSearchTerm, setUserSearchTerm] = useState('');

	// Side drawer user actions confirmation states
	const [userDialogOpen, setUserDialogOpen] = useState(false);
	const [userActionType, setUserActionType] = useState<'deactivate' | 'reactivate' | 'delete'>('deactivate');
	const [targetUser, setTargetUser] = useState<TeamMember | null>(null);
	const [userActionLoading, setUserActionLoading] = useState(false);

	const handleOpenExtendTrial = (org: Organization) => {
		setTargetOrg(org);
		setExtendDays('30');
		setExtendTrialOpen(true);
	};

	const handleConfirmExtendTrial = async () => {
		if (!targetOrg) return;
		const days = parseInt(extendDays, 10);
		if (isNaN(days) || days <= 0) {
			toast.error('Please enter a valid number of days');
			return;
		}
		setExtendLoading(true);
		try {
			await authService.extendTrial(targetOrg.public_id, days);
			toast.success(`Successfully extended trial for ${targetOrg.name} by ${days} days.`);
			
			// Refresh list & stats
			fetchData();

			// If the extended org is currently selected, refresh selectedOrg view properties
			if (selectedOrg?.public_id === targetOrg.public_id) {
				const updatedOrgs = await dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage })).unwrap();
				const refreshedSelected = updatedOrgs.items.find((o: Organization) => o.public_id === targetOrg.public_id);
				if (refreshedSelected) {
					setSelectedOrg(refreshedSelected);
				}
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || error?.message || 'Failed to extend trial');
		} finally {
			setExtendLoading(false);
			setExtendTrialOpen(false);
			setTargetOrg(null);
		}
	};

	const fetchData = useCallback(() => {
		dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage }));
		dispatch(fetchAdminStats());
	}, [dispatch, page, rowsPerPage]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleDeactivate = (org: Organization) => {
		setTargetOrg(org);
		setStatusAction('deactivate');
		setStatusDialogOpen(true);
	};

	const handleReactivate = (org: Organization) => {
		setTargetOrg(org);
		setStatusAction('reactivate');
		setStatusDialogOpen(true);
	};

	const handleConfirmStatusChange = async () => {
		if (!targetOrg) return;
		setStatusLoading(true);
		try {
			if (statusAction === 'deactivate') {
				const updated = await dispatch(deactivateOrg(targetOrg.public_id)).unwrap();
				toast.success(`${targetOrg.name} has been deactivated.`);
				if (selectedOrg?.public_id === targetOrg.public_id) {
					setSelectedOrg(updated);
				}
			} else {
				const updated = await dispatch(reactivateOrg(targetOrg.public_id)).unwrap();
				toast.success(`${targetOrg.name} has been reactivated.`);
				if (selectedOrg?.public_id === targetOrg.public_id) {
					setSelectedOrg(updated);
				}
			}
			dispatch(fetchAdminStats());
		} catch (error: any) {
			toast.error(error || `Failed to ${statusAction} organization`);
		} finally {
			setStatusLoading(false);
			setStatusDialogOpen(false);
			setTargetOrg(null);
		}
	};

	// Handlers for user actions inside drawer
	const handleUserAction = (user: TeamMember, type: 'deactivate' | 'reactivate' | 'delete' | 'resendInvite') => {
		setTargetUser(user);
		if (type === 'resendInvite') {
			handleConfirmUserAction(user, type);
		} else {
			setUserActionType(type);
			setUserDialogOpen(true);
		}
	};

	const handleConfirmUserAction = async (userParam?: TeamMember, typeParam?: any) => {
		const u = userParam || targetUser;
		const type = typeParam || userActionType;
		if (!u || !selectedOrg) return;

		setUserActionLoading(true);
		try {
			if (type === 'deactivate') {
				await dispatch(deactivateOrgUser(u.public_id)).unwrap();
				toast.success(`${u.full_name || u.username} has been deactivated.`);
			} else if (type === 'reactivate') {
				await dispatch(reactivateOrgUser(u.public_id)).unwrap();
				toast.success(`${u.full_name || u.username} has been reactivated.`);
			} else if (type === 'delete') {
				await dispatch(deleteOrgUser(u.public_id)).unwrap();
				toast.success(`${u.full_name || u.username} has been deleted.`);
			} else if (type === 'resendInvite') {
				await dispatch(resendOrgUserInvite(u.public_id)).unwrap();
				toast.success(`Invite resent to ${u.email}.`);
			}

			// Update seat count on stats and parent org list
			dispatch(fetchAdminStats());
			dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage }));
		} catch (error: any) {
			toast.error(error || `Failed to ${type} user`);
		} finally {
			setUserActionLoading(false);
			setUserDialogOpen(false);
			setTargetUser(null);
		}
	};

	const getRowActions = (org: Organization): TableMenuAction<Organization>[] => {
		const actions: TableMenuAction<Organization>[] = [
			{
				label: 'Extend Trial',
				icon: <CalendarToday fontSize="small" />,
				onClick: () => handleOpenExtendTrial(org),
				color: 'primary.main',
			}
		];
		if (org.is_active !== false) {
			actions.push({
				label: 'Deactivate',
				icon: <Block fontSize="small" />,
				onClick: () => handleDeactivate(org),
				color: 'error.main',
			});
		} else {
			actions.push({
				label: 'Reactivate',
				icon: <CheckCircleOutline fontSize="small" />,
				onClick: () => handleReactivate(org),
				color: 'success.main',
			});
		}
		return actions;
	};

	const renderSeatUtilization = (org: Organization) => {
		const userCount = org.user_count || 0;
		const userLimit = org.user_limit;

		if (userLimit === null || userLimit === undefined) {
			return (
				<Box sx={{ width: '100%', minWidth: 120 }}>
					<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
						{userCount} / Unlimited
					</Typography>
					<LinearProgress
						variant="determinate"
						value={0}
						sx={{
							height: 6,
							borderRadius: 3,
							bgcolor: 'rgba(0, 0, 0, 0.05)',
							mt: 0.5,
							'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#6366F1' }
						}}
					/>
				</Box>
			);
		}

		const percentage = Math.min((userCount / userLimit) * 100, 100);
		const color = percentage >= 85 ? '#F59E0B' : '#6366F1'; // Orange/Yellow if >= 85%, deep purple/indigo otherwise

		return (
			<Box sx={{ width: '100%', minWidth: 120 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
					<Typography variant="body2" sx={{ fontWeight: 600, color: percentage >= 85 ? 'warning.main' : 'text.primary' }}>
						{userCount} / {userLimit}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{Math.round(percentage)}%
					</Typography>
				</Box>
				<LinearProgress
					variant="determinate"
					value={percentage}
					sx={{
						height: 6,
						borderRadius: 3,
						bgcolor: 'rgba(0, 0, 0, 0.05)',
						'& .MuiLinearProgress-bar': {
							borderRadius: 3,
							backgroundColor: color
						}
					}}
				/>
			</Box>
		);
	};

	const renderRemainingPeriod = (org: Organization) => {
		if (org.subscription_status !== 'trial' && org.subscription_status !== 'expired' && org.plan_id) {
			return <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>Active</Typography>;
		}
		if (!org.trial_expires_at) {
			return <Typography variant="body2" color="text.secondary">N/A</Typography>;
		}

		const expiry = new Date(org.trial_expires_at);
		const today = new Date();
		expiry.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		const diffTime = expiry.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Expired</Typography>;
		}
		if (diffDays === 0) {
			return <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Expires today</Typography>;
		}

		let color = 'success.main';
		if (diffDays < 10) {
			color = 'error.main';
		} else if (diffDays <= 30) {
			color = 'warning.main';
		}

		return (
			<Typography variant="body2" sx={{ fontWeight: diffDays < 10 ? 700 : 600, color }}>
				{diffDays} day{diffDays === 1 ? '' : 's'} left
			</Typography>
		);
	};

	const renderRow = (org: Organization) => {
		const planDisplayName = org.plan_name 
			? org.plan_name.toUpperCase() 
			: (org.plan_id ? 'PAID' : 'FREE');

		const isSelected = selectedOrg?.public_id === org.public_id;

		return (
			<TableRow
				key={org.public_id}
				hover
				onClick={() => {
					setSelectedOrg(org);
					dispatch(fetchOrgUsers(org.public_id));
				}}
				sx={{
					cursor: 'pointer',
					backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'inherit',
					'&:hover': {
						backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12) !important' : 'inherit'
					},
					'&:last-child td': { borderBottom: 0 }
				}}
			>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>{org.name}</Typography>
					<Typography variant="caption" color="text.secondary">{org.location || '-'}</Typography>
				</TableCell>
				<TableCell>
					<StatusBadge label={planDisplayName} status={org.plan_name?.toLowerCase() || 'free'} />
				</TableCell>
				<TableCell onClick={(e) => e.stopPropagation()}>
					{renderSeatUtilization(org)}
				</TableCell>
				<TableCell>
					{renderRemainingPeriod(org)}
				</TableCell>
				<TableCell>
					<StatusBadge label={org.is_active !== false ? 'Active' : 'Inactive'} status={org.is_active !== false ? 'active' : 'inactive'} />
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<DataTableActions item={org} actions={getRowActions(org)} />
				</TableCell>
			</TableRow>
		);
	};

	const headerAction = (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			onClick={() => setCreateDialogOpen(true)}
			sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: 3, boxShadow: 'none' }}
		>
			Create Organization
		</Button>
	);

	const statsCards = [
		{
			title: 'TOTAL ORGANIZATIONS',
			value: stats?.total_organizations ?? 0,
			subtitle: 'Total registered tenants',
			icon: <Business color="primary" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%)',
			border: '1px solid rgba(99, 102, 241, 0.12)'
		},
		{
			title: 'ACTIVE TRIALS',
			value: stats?.active_trials ?? 0,
			subtitle: 'Free / Trial orgs with time left',
			icon: <CalendarToday color="warning" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(251, 191, 36, 0.03) 100%)',
			border: '1px solid rgba(245, 158, 11, 0.12)'
		},
		{
			title: 'PLATFORM SEATS',
			value: stats?.total_users ?? 0,
			subtitle: 'Total user accounts',
			icon: <Group color="success" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)',
			border: '1px solid rgba(16, 185, 129, 0.12)'
		},
		{
			title: 'AVG. SEAT DENSITY',
			value: stats?.avg_users_per_org ?? 0,
			subtitle: 'Average users per tenant',
			icon: <Speed color="info" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%)',
			border: '1px solid rgba(59, 130, 246, 0.12)'
		}
	];

	// Filter users locally for search in side drawer
	const filteredUsers = selectedOrgUsers.filter(user => {
		const searchLower = userSearchTerm.toLowerCase();
		return (
			user.full_name?.toLowerCase().includes(searchLower) ||
			user.username.toLowerCase().includes(searchLower) ||
			user.email.toLowerCase().includes(searchLower) ||
			user.role.toLowerCase().includes(searchLower)
		);
	});

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Organizations Console"
					subtitle="Manage global infrastructure entities and subscription tiers."
					action={headerAction}
				/>

				{/* Platform Stats Panel */}
				<Grid container spacing={3} sx={{ mb: 4 }}>
					{statsCards.map((card, idx) => (
						<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
							<Card
								sx={{
									background: card.bg,
									border: card.border,
									boxShadow: '0 4px 20px 0 rgba(0,0,0,0.01)',
									borderRadius: 4,
									transition: 'transform 0.2s, box-shadow 0.2s',
									'&:hover': {
										transform: 'translateY(-2px)',
										boxShadow: '0 12px 30px 0 rgba(0,0,0,0.04)',
									}
								}}
							>
								<CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, '&:last-child': { pb: 3 } }}>
									<Box>
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.1 }}>
											{card.title}
										</Typography>
										<Typography variant="h4" sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
											{card.value}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{card.subtitle}
										</Typography>
									</Box>
									<Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
										{card.icon}
									</Box>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>

				<DataTable<Organization>
					columns={columns}
					data={organizations}
					loading={loading}
					totalCount={total}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={(_e, p) => setPage(p)}
					onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
					searchTerm=""
					onRefresh={fetchData}
					onCreateClick={() => setCreateDialogOpen(true)}
					createButtonText="Create Organization"
					renderRow={renderRow}
					emptyMessage="No organizations yet."
				/>

				{/* Organization Detail Drawer */}
				<Drawer
					anchor="right"
					open={Boolean(selectedOrg)}
					onClose={() => setSelectedOrg(null)}
					sx={{
						'& .MuiDrawer-paper': {
							width: { xs: '100%', sm: 460 },
							boxSizing: 'border-box',
							p: 3,
							borderLeft: '1px solid',
							borderColor: 'divider',
							boxShadow: '-8px 0px 32px rgba(0, 0, 0, 0.04)'
						}
					}}
				>
					{selectedOrg && (
						<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
							{/* Drawer Header */}
							<Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
								<Box>
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{selectedOrg.name}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{selectedOrg.location || 'No location specified'}
									</Typography>
								</Box>
								<IconButton onClick={() => setSelectedOrg(null)} size="small">
									<Close />
								</IconButton>
							</Box>

							{/* Badges and Plans info */}
							<Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
								<StatusBadge
									label={(selectedOrg.plan_name || 'FREE').toUpperCase()}
									status={selectedOrg.plan_name?.toLowerCase() || 'free'}
								/>
								<StatusBadge
									label={selectedOrg.is_active !== false ? 'Active' : 'Inactive'}
									status={selectedOrg.is_active !== false ? 'active' : 'inactive'}
								/>
							</Box>

							<Divider sx={{ mb: 3 }} />

							{/* Plan Info Card */}
							<Card variant="outlined" sx={{ mb: 3, borderRadius: 3, bgcolor: 'background.default', borderColor: 'divider' }}>
								<CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
										Plan Configuration
									</Typography>
									
									<Grid container spacing={2}>
										<Grid size={{ xs: 6 }}>
											<Typography variant="caption" color="text.secondary">
												Seat Limit
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
												{selectedOrg.user_limit ?? 'Unlimited'} seats
											</Typography>
										</Grid>
										<Grid size={{ xs: 6 }}>
											<Typography variant="caption" color="text.secondary">
												Time Left
											</Typography>
											<Box sx={{ mt: 0.5 }}>
												{renderRemainingPeriod(selectedOrg)}
											</Box>
										</Grid>
									</Grid>
								</CardContent>
							</Card>

							{/* Teammate List Header & Search */}
							<Box sx={{ mb: 2 }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
									User Directory ({selectedOrgUsers.length})
								</Typography>
								<TextField
									fullWidth
									size="small"
									placeholder="Search users by name, email..."
									value={userSearchTerm}
									onChange={(e) => setUserSearchTerm(e.target.value)}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Search fontSize="small" color="action" />
											</InputAdornment>
										),
										sx: { borderRadius: 2.5 }
									}}
								/>
							</Box>

							{/* User Directory List */}
							<Box sx={{ flexGrow: 1, overflowY: 'auto', mx: -3, px: 3 }}>
								{selectedOrgUsersLoading ? (
									<List>
										{[1, 2, 3].map((n) => (
											<ListItem key={n} sx={{ py: 1.5, px: 0 }}>
												<ListItemAvatar>
													<Skeleton variant="circular" width={40} height={40} />
												</ListItemAvatar>
												<ListItemText
													primary={<Skeleton variant="text" width="60%" />}
													secondary={<Skeleton variant="text" width="40%" />}
												/>
											</ListItem>
										))}
									</List>
								) : selectedOrgUsersError ? (
									<Box py={4} textAlign="center">
										<Typography variant="body2" color="error">
											{selectedOrgUsersError}
										</Typography>
									</Box>
								) : filteredUsers.length === 0 ? (
									<Box py={4} textAlign="center">
										<Typography variant="body2" color="text.secondary">
											{userSearchTerm ? 'No matching users found.' : 'No users in this organization.'}
										</Typography>
									</Box>
								) : (
									<List sx={{ p: 0 }}>
										{filteredUsers.map((user) => (
											<ListItem
												key={user.public_id}
												sx={{
													py: 1.5,
													px: 0.5,
													borderRadius: 2,
													mb: 0.5,
													'&:hover': { bgcolor: 'action.hover' }
												}}
												secondaryAction={
													<Box display="flex" gap={0.5}>
														{!user.is_verified && user.is_active && (
															<Tooltip title="Resend Invite">
																<IconButton
																	size="small"
																	color="primary"
																	onClick={() => handleUserAction(user, 'resendInvite')}
																>
																	<MailOutline fontSize="small" />
																</IconButton>
															</Tooltip>
														)}
														
														{user.is_active ? (
															<Tooltip title="Deactivate User">
																<IconButton
																	size="small"
																	color="error"
																	onClick={() => handleUserAction(user, 'deactivate')}
																>
																	<Block fontSize="small" />
																</IconButton>
															</Tooltip>
														) : (
															<Tooltip title="Reactivate User">
																<IconButton
																	size="small"
																	color="success"
																	onClick={() => handleUserAction(user, 'reactivate')}
																>
																	<CheckCircleOutline fontSize="small" />
																</IconButton>
															</Tooltip>
														)}

														<Tooltip title="Delete User">
															<IconButton
																size="small"
																color="error"
																onClick={() => handleUserAction(user, 'delete')}
															>
																<DeleteOutline fontSize="small" />
															</IconButton>
														</Tooltip>
													</Box>
												}
											>
												<ListItemAvatar>
													<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 40, height: 40, fontSize: '0.875rem', fontWeight: 600 }}>
														{getInitials(user.full_name, user.username)}
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													primary={
														<Box display="flex" alignItems="center" gap={1}>
															<Typography variant="body2" sx={{ fontWeight: 600 }}>
																{user.full_name || user.username}
															</Typography>
															<Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: 'rgba(0, 0, 0, 0.04)', px: 1, py: 0.25, borderRadius: 1 }}>
																{user.role.toUpperCase()}
															</Typography>
														</Box>
													}
													secondary={
														<Box display="flex" flexDirection="column" gap={0.25} sx={{ mt: 0.25 }}>
															<Typography variant="caption" color="text.secondary">
																{user.email}
															</Typography>
															<Typography variant="caption" sx={{ fontWeight: 500, color: user.is_verified ? 'success.main' : 'warning.main' }}>
																{user.is_verified ? 'Verified' : 'Pending Invite'}
															</Typography>
														</Box>
													}
												/>
											</ListItem>
										))}
									</List>
								)}
							</Box>
						</Box>
					)}
				</Drawer>

				{/* Create Organization Dialog */}
				<CreateOrganizationDialog
					open={createDialogOpen}
					onClose={() => setCreateDialogOpen(false)}
					onSuccess={(message) => {
						toast.success(message);
						fetchData();
					}}
				/>

				{/* Organization Activation / Deactivation Confirmation Dialog */}
				<ConfirmationDialog
					open={statusDialogOpen}
					onClose={() => { setStatusDialogOpen(false); setTargetOrg(null); }}
					onConfirm={handleConfirmStatusChange}
					title={statusAction === 'deactivate' ? 'Deactivate Organization' : 'Reactivate Organization'}
					subtitle={statusAction === 'deactivate' ? 'All members lose access immediately' : 'Restore access for all members'}
					message={
						statusAction === 'deactivate'
							? `Deactivate ${targetOrg?.name}? No one in this organization will be able to log in until it's reactivated.`
							: `Reactivate ${targetOrg?.name}? Its members will be able to log in again.`
					}
					confirmLabel={statusAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
					cancelLabel="Cancel"
					severity={statusAction === 'deactivate' ? 'warning' : 'success'}
					loading={statusLoading}
				/>

				{/* Trial Extension Dialog */}
				<Dialog open={extendTrialOpen} onClose={() => { setExtendTrialOpen(false); setTargetOrg(null); }}>
					<DialogTitle>Extend Trial / Free Period</DialogTitle>
					<DialogContent sx={{ minWidth: 320, pt: 1 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Extend the trial or free period for <strong>{targetOrg?.name}</strong>. This resets the status to active/trial.
						</Typography>
						<TextField
							autoFocus
							margin="dense"
							id="days"
							label="Number of Days"
							type="number"
							fullWidth
							variant="outlined"
							value={extendDays}
							onChange={(e) => setExtendDays(e.target.value)}
							inputProps={{ min: 1 }}
						/>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3 }}>
						<Button onClick={() => { setExtendTrialOpen(false); setTargetOrg(null); }} color="inherit">
							Cancel
						</Button>
						<Button onClick={handleConfirmExtendTrial} variant="contained" disabled={extendLoading}>
							{extendLoading ? 'Extending...' : 'Extend'}
						</Button>
					</DialogActions>
				</Dialog>

				{/* User Action Confirmation Dialog inside Side Drawer */}
				<ConfirmationDialog
					open={userDialogOpen}
					onClose={() => { setUserDialogOpen(false); setTargetUser(null); }}
					onConfirm={() => handleConfirmUserAction()}
					title={
						userActionType === 'deactivate'
							? 'Deactivate User'
							: userActionType === 'reactivate'
							? 'Reactivate User'
							: 'Delete User'
					}
					subtitle={
						userActionType === 'deactivate'
							? 'Suspend user access'
							: userActionType === 'reactivate'
							? 'Restore user access'
							: 'Permanently remove user'
					}
					message={
						userActionType === 'deactivate'
							? `Deactivate ${targetUser?.full_name || targetUser?.username}? They will not be able to log in to the platform.`
							: userActionType === 'reactivate'
							? `Reactivate ${targetUser?.full_name || targetUser?.username}? They will regain access to their account.`
							: `Are you sure you want to permanently delete ${targetUser?.full_name || targetUser?.username}? This action is irreversible.`
					}
					confirmLabel={
						userActionType === 'deactivate'
							? 'Deactivate'
							: userActionType === 'reactivate'
							? 'Reactivate'
							: 'Delete'
					}
					cancelLabel="Cancel"
					severity={userActionType === 'deactivate' || userActionType === 'delete' ? 'warning' : 'success'}
					loading={userActionLoading}
				/>
			</Container>
		</Box>
	);
};

export default OrganizationsConsole;
