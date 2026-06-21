import React from 'react';
import {
	Box, Divider, Card, CardContent, Grid,
	TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText,
	Avatar, Skeleton, Typography, IconButton, useTheme, Tabs, Tab,
	Menu, MenuItem, ListItemIcon
} from '@mui/material';
import { Search, MailOutline, Block, CheckCircleOutline, DeleteOutline, EditOutlined, MoreVert, LockOutlined } from '@mui/icons-material';
import type { Organization } from '../../../models/auth';
import type { TeamMember } from '../../../models/user';
import StatusBadge from '../../common/badge/StatusBadge';
import DetailDrawer from '../../common/drawer/DetailDrawer';

interface OrgDetailDrawerProps {
	selectedOrg: Organization | null;
	onClose: () => void;
	selectedOrgUsers: TeamMember[];
	selectedOrgUsersLoading: boolean;
	selectedOrgUsersError: string | null;
	userSearchTerm: string;
	setUserSearchTerm: (term: string) => void;
	onUserAction: (user: TeamMember, type: 'deactivate' | 'reactivate' | 'delete' | 'resendInvite' | 'edit' | 'sendPasswordReset') => void;
	renderRemainingPeriod: (org: Organization) => React.ReactNode;
}

const getInitials = (name?: string, username?: string) => {
	const displayName = name || username || 'User';
	const parts = displayName.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const OrgDetailDrawer: React.FC<OrgDetailDrawerProps> = ({
	selectedOrg, onClose, selectedOrgUsers, selectedOrgUsersLoading, selectedOrgUsersError,
	userSearchTerm, setUserSearchTerm, onUserAction, renderRemainingPeriod
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [tabValue, setTabValue] = React.useState<number>(0);
	const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
	const [menuUser, setMenuUser] = React.useState<TeamMember | null>(null);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: TeamMember) => {
		setMenuAnchor(event.currentTarget);
		setMenuUser(user);
	};

	const handleMenuClose = () => {
		setMenuAnchor(null);
		setMenuUser(null);
	};

	React.useEffect(() => {
		if (selectedOrg) {
			setTabValue(0);
		}
	}, [selectedOrg]);

	const filteredUsers = selectedOrgUsers.filter(user => {
		const searchLower = userSearchTerm.toLowerCase();
		return (
			user.full_name?.toLowerCase().includes(searchLower) ||
			user.username.toLowerCase().includes(searchLower) ||
			user.email.toLowerCase().includes(searchLower) ||
			user.role.toLowerCase().includes(searchLower)
		);
	});

	const activeUsersCount = selectedOrgUsers.filter(u => u.is_active && u.is_verified).length;
	const inactiveUsersCount = selectedOrgUsers.filter(u => !u.is_active).length;
	const pendingUsersCount = selectedOrgUsers.filter(u => u.is_active && !u.is_verified).length;

	const getTabFilteredUsers = () => {
		switch (tabValue) {
			case 1: // Active
				return filteredUsers.filter(u => u.is_active && u.is_verified);
			case 2: // Inactive
				return filteredUsers.filter(u => !u.is_active);
			case 3: // Pending Verification
				return filteredUsers.filter(u => u.is_active && !u.is_verified);
			case 0: // All
			default:
				return filteredUsers;
		}
	};

	const tabFilteredUsers = getTabFilteredUsers();

	const headerExtra = selectedOrg ? (
		<Box display="flex" alignItems="center" gap={1.5} sx={{ mt: 1 }}>
			<StatusBadge label={(selectedOrg.plan_name || 'FREE').toUpperCase()} status={selectedOrg.plan_name?.toLowerCase() || 'free'} />
			<StatusBadge label={selectedOrg.is_active !== false ? 'Active' : 'Inactive'} status={selectedOrg.is_active !== false ? 'active' : 'inactive'} />
		</Box>
	) : null;

	return (
		<DetailDrawer
			open={Boolean(selectedOrg)}
			onClose={onClose}
			title={selectedOrg?.name || ''}
			subtitle={selectedOrg?.location || 'No location specified'}
			headerExtra={headerExtra}
		>
			{selectedOrg && (
				<>
					<Divider sx={{ mb: 3, opacity: 0.5 }} />

					<Card 
						variant="outlined" 
						sx={{ 
							mb: 3, 
							borderRadius: '16px', 
							background: isDark
								? 'linear-gradient(135deg, rgba(139, 124, 246, 0.08) 0%, rgba(78, 168, 255, 0.03) 100%)'
								: 'linear-gradient(135deg, rgba(139, 124, 246, 0.04) 0%, rgba(78, 168, 255, 0.02) 100%)',
							borderColor: isDark
								? 'rgba(139, 124, 246, 0.18)'
								: 'rgba(139, 124, 246, 0.15)',
							boxShadow: '0 4px 20px 0 rgba(139, 124, 246, 0.01)',
							overflow: 'hidden'
						}}
					>
						<CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, letterSpacing: '0.02em', color: 'text.primary' }}>
								PLAN CONFIGURATION
							</Typography>
							<Grid container spacing={2}>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
										Seat Limit
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'text.primary', fontSize: '0.95rem' }}>
										{selectedOrg.user_limit ?? 'Unlimited'} seats
									</Typography>
								</Grid>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
										Time Left
									</Typography>
									<Box sx={{ mt: 0.5 }}>{renderRemainingPeriod(selectedOrg)}</Box>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					<Box sx={{ mb: 2.5 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '0.02em', color: 'text.primary' }}>
							USER DIRECTORY ({selectedOrgUsers.length})
						</Typography>
						<TextField
							fullWidth 
							size="small" 
							placeholder="Search users by name, email..." 
							value={userSearchTerm}
							onChange={(e) => setUserSearchTerm(e.target.value)}
							InputProps={{
								startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>,
								sx: { 
									borderRadius: '12px',
									bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
									'& fieldset': { borderColor: theme.palette.divider },
									'&:hover fieldset': { borderColor: theme.palette.primary.main },
									'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
								}
							}}
						/>
					</Box>

					<Tabs
						value={tabValue}
						onChange={(_e, val) => setTabValue(val)}
						variant="scrollable"
						scrollButtons="auto"
						sx={{
							mb: 2.5,
							borderBottom: `1px solid ${theme.palette.divider}`,
							'& .MuiTabs-indicator': {
								height: 3,
								borderRadius: '3px 3px 0 0',
								background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
							},
							'& .MuiTab-root': {
								textTransform: 'none',
								fontWeight: 700,
								minWidth: 'auto',
								px: 2,
								py: 1,
								fontSize: '0.8rem',
								color: 'text.secondary',
								'&.Mui-selected': {
									color: 'primary.main',
								}
							}
						}}
					>
						<Tab label={`All (${selectedOrgUsers.length})`} />
						<Tab label={`Active (${activeUsersCount})`} />
						<Tab label={`Inactive (${inactiveUsersCount})`} />
						<Tab label={`Pending (${pendingUsersCount})`} />
					</Tabs>

					<Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
						{selectedOrgUsersLoading ? (
							<List>
								{[1, 2, 3].map((n) => (
									<ListItem key={n} sx={{ py: 1.5, px: 0 }}>
										<ListItemAvatar><Skeleton variant="circular" width={40} height={40} /></ListItemAvatar>
										<ListItemText primary={<Skeleton variant="text" width="60%" />} secondary={<Skeleton variant="text" width="40%" />} />
									</ListItem>
								))}
							</List>
						) : selectedOrgUsersError ? (
							<Box py={4} textAlign="center"><Typography variant="body2" color="error">{selectedOrgUsersError}</Typography></Box>
						) : tabFilteredUsers.length === 0 ? (
							<Box py={4} textAlign="center">
								<Typography variant="body2" color="text.secondary">
									{userSearchTerm 
										? 'No matching users found.' 
										: (tabValue === 1 
											? 'No active users in this organization.' 
											: (tabValue === 2 
												? 'No inactive users in this organization.' 
												: (tabValue === 3 
													? 'No pending verification users in this organization.' 
													: 'No users in this organization.'
												)
											)
										)
									}
								</Typography>
							</Box>
						) : (
							<List sx={{ p: 0 }}>
								{tabFilteredUsers.map((user) => (
									<ListItem
										key={user.public_id} 
										sx={{ 
											py: 1.5, 
											px: 2, 
											borderRadius: '14px', 
											mb: 1, 
											border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'}`,
											bgcolor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.005)',
											transition: 'all 0.2s ease', 
											'&:hover': { 
												bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(139, 124, 246, 0.02)',
												borderColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(139, 124, 246, 0.12)',
												boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
											} 
										}}
										secondaryAction={
											<IconButton 
												size="small" 
												onClick={(e) => handleMenuOpen(e, user)}
												sx={{ 
													color: 'text.secondary',
													'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }
												}}
											>
												<MoreVert fontSize="small" />
											</IconButton>
										}
									>
										<ListItemAvatar sx={{ minWidth: 52 }}>
											<Avatar 
												sx={{ 
													background: 'linear-gradient(135deg, #8B7CF6 0%, #4EA8FF 100%)', 
													color: '#ffffff', 
													width: 42, 
													height: 42, 
													fontSize: '0.9rem', 
													fontWeight: 700,
													boxShadow: '0 4px 10px rgba(139, 124, 246, 0.25)'
												}}
											>
												{getInitials(user.full_name, user.username)}
											</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={
												<Box display="flex" alignItems="center" gap={1.25}>
													<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
														{user.full_name || user.username}
													</Typography>
													<Typography 
														variant="caption" 
														sx={{ 
															color: 'primary.main', 
															bgcolor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(139, 124, 246, 0.06)', 
															px: 1, 
															py: 0.25, 
															borderRadius: '4px',
															fontSize: '0.68rem',
															fontWeight: 700
														}}
													>
														{user.role.toUpperCase()}
													</Typography>
												</Box>
											}
											secondary={
												<Box display="flex" flexDirection="column" gap={0.5} sx={{ mt: 0.5 }}>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
														{user.email}
													</Typography>
													<Typography 
														variant="caption" 
														sx={{ 
															fontWeight: 700, 
															fontSize: '0.7rem',
															color: user.is_verified ? 'success.main' : 'warning.main',
															display: 'inline-flex',
															alignItems: 'center',
															gap: 0.5
														}}
													>
														<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: user.is_verified ? 'success.main' : 'warning.main', boxShadow: `0 0 6px ${user.is_verified ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}` }} />
														{user.is_verified ? 'Verified Access' : 'Invite Pending'}
													</Typography>
												</Box>
											}
										/>
									</ListItem>
								))}
							</List>
						)}
					</Box>

					{/* Actions Context Menu */}
					<Menu
						anchorEl={menuAnchor}
						open={Boolean(menuAnchor)}
						onClose={handleMenuClose}
						PaperProps={{
							sx: {
								borderRadius: '12px',
								minWidth: 160,
								border: `1px solid ${theme.palette.divider}`,
								background: isDark ? 'rgba(20, 24, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
								backdropFilter: 'blur(10px)',
								boxShadow: isDark 
									? '0 10px 30px rgba(0,0,0,0.4)' 
									: '0 10px 30px rgba(139, 124, 246, 0.08)',
								'& .MuiMenuItem-root': {
									fontSize: '0.85rem',
									fontWeight: 600,
									py: 1,
									px: 2,
									display: 'flex',
									alignItems: 'center',
									gap: 1.5,
									transition: 'all 0.15s ease',
									'&:hover': {
										bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(139, 124, 246, 0.04)',
									}
								}
							}
						}}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
					>
						{menuUser && (
							<>
								<MenuItem onClick={() => { onUserAction(menuUser, 'edit'); handleMenuClose(); }}>
									<ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
										<EditOutlined fontSize="small" />
									</ListItemIcon>
									<ListItemText primary="Edit User" />
								</MenuItem>

								{!menuUser.is_verified && menuUser.is_active && (
									<MenuItem onClick={() => { onUserAction(menuUser, 'resendInvite'); handleMenuClose(); }}>
										<ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
											<MailOutline fontSize="small" />
										</ListItemIcon>
										<ListItemText primary="Resend Invite" />
									</MenuItem>
								)}

								{menuUser.is_verified && menuUser.is_active && (
									<MenuItem onClick={() => { onUserAction(menuUser, 'sendPasswordReset'); handleMenuClose(); }}>
										<ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
											<LockOutlined fontSize="small" />
										</ListItemIcon>
										<ListItemText primary="Send Password Reset" />
									</MenuItem>
								)}

								<MenuItem 
									onClick={() => { 
										onUserAction(menuUser, menuUser.is_active ? 'deactivate' : 'reactivate'); 
										handleMenuClose(); 
									}}
									sx={{ color: menuUser.is_active ? 'warning.main' : 'success.main' }}
								>
									<ListItemIcon sx={{ minWidth: 'auto', color: menuUser.is_active ? 'warning.main' : 'success.main' }}>
										{menuUser.is_active ? <Block fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
									</ListItemIcon>
									<ListItemText primary={menuUser.is_active ? 'Deactivate' : 'Reactivate'} />
								</MenuItem>

								<Divider sx={{ my: 0.5, opacity: 0.5 }} />

								<MenuItem 
									onClick={() => { onUserAction(menuUser, 'delete'); handleMenuClose(); }}
									sx={{ color: 'error.main' }}
								>
									<ListItemIcon sx={{ minWidth: 'auto', color: 'error.main' }}>
										<DeleteOutline fontSize="small" />
									</ListItemIcon>
									<ListItemText primary="Delete User" />
								</MenuItem>
							</>
						)}
					</Menu>
				</>
			)}
		</DetailDrawer>
	);
};
export default OrgDetailDrawer;
