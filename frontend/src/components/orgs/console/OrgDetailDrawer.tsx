import React from 'react';
import {
	Box, Drawer, Typography, IconButton, Divider, Card, CardContent, Grid,
	TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText,
	Avatar, Tooltip, Skeleton
} from '@mui/material';
import { Close, Search, MailOutline, Block, CheckCircleOutline, DeleteOutline } from '@mui/icons-material';
import type { Organization } from '../../../models/auth';
import type { TeamMember } from '../../../models/user';
import StatusBadge from '../../common/badge/StatusBadge';

interface OrgDetailDrawerProps {
	selectedOrg: Organization | null;
	onClose: () => void;
	selectedOrgUsers: TeamMember[];
	selectedOrgUsersLoading: boolean;
	selectedOrgUsersError: string | null;
	userSearchTerm: string;
	setUserSearchTerm: (term: string) => void;
	onUserAction: (user: TeamMember, type: 'deactivate' | 'reactivate' | 'delete' | 'resendInvite') => void;
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
		<Drawer
			anchor="right" open={Boolean(selectedOrg)} onClose={onClose}
			sx={{
				'& .MuiDrawer-paper': {
					width: { xs: '100%', sm: 460 }, boxSizing: 'border-box', p: 3,
					borderLeft: '1px solid', borderColor: 'divider', boxShadow: '-8px 0px 32px rgba(0, 0, 0, 0.04)'
				}
			}}
		>
			{selectedOrg && (
				<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
					<Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
						<Box>
							<Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedOrg.name}</Typography>
							<Typography variant="caption" color="text.secondary">{selectedOrg.location || 'No location specified'}</Typography>
						</Box>
						<IconButton onClick={onClose} size="small"><Close /></IconButton>
					</Box>

					<Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
						<StatusBadge label={(selectedOrg.plan_name || 'FREE').toUpperCase()} status={selectedOrg.plan_name?.toLowerCase() || 'free'} />
						<StatusBadge label={selectedOrg.is_active !== false ? 'Active' : 'Inactive'} status={selectedOrg.is_active !== false ? 'active' : 'inactive'} />
					</Box>

					<Divider sx={{ mb: 3 }} />

					<Card variant="outlined" sx={{ mb: 3, borderRadius: 3, bgcolor: 'background.default', borderColor: 'divider' }}>
						<CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Plan Configuration</Typography>
							<Grid container spacing={2}>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" color="text.secondary">Seat Limit</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedOrg.user_limit ?? 'Unlimited'} seats</Typography>
								</Grid>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" color="text.secondary">Time Left</Typography>
									<Box sx={{ mt: 0.5 }}>{renderRemainingPeriod(selectedOrg)}</Box>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					<Box sx={{ mb: 2 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>User Directory ({selectedOrgUsers.length})</Typography>
						<TextField
							fullWidth size="small" placeholder="Search users by name, email..." value={userSearchTerm}
							onChange={(e) => setUserSearchTerm(e.target.value)}
							InputProps={{
								startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>,
								sx: { borderRadius: 2.5 }
							}}
						/>
					</Box>

					<Box sx={{ flexGrow: 1, overflowY: 'auto', mx: -3, px: 3 }}>
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
						) : filteredUsers.length === 0 ? (
							<Box py={4} textAlign="center"><Typography variant="body2" color="text.secondary">{userSearchTerm ? 'No matching users found.' : 'No users in this organization.'}</Typography></Box>
						) : (
							<List sx={{ p: 0 }}>
								{filteredUsers.map((user) => (
									<ListItem
										key={user.public_id} sx={{ py: 1.5, px: 0.5, borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
										secondaryAction={
											<Box display="flex" gap={0.5}>
												{!user.is_verified && user.is_active && (
													<Tooltip title="Resend Invite">
														<IconButton size="small" color="primary" onClick={() => onUserAction(user, 'resendInvite')}><MailOutline fontSize="small" /></IconButton>
													</Tooltip>
												)}
												<Tooltip title={user.is_active ? 'Deactivate User' : 'Reactivate User'}>
													<IconButton size="small" color={user.is_active ? 'error' : 'success'} onClick={() => onUserAction(user, user.is_active ? 'deactivate' : 'reactivate')}>
														{user.is_active ? <Block fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
													</IconButton>
												</Tooltip>
												<Tooltip title="Delete User">
													<IconButton size="small" color="error" onClick={() => onUserAction(user, 'delete')}><DeleteOutline fontSize="small" /></IconButton>
												</Tooltip>
											</Box>
										}
									>
										<ListItemAvatar>
											<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 40, height: 40, fontSize: '0.875rem', fontWeight: 600 }}>{getInitials(user.full_name, user.username)}</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={
												<Box display="flex" alignItems="center" gap={1}>
													<Typography variant="body2" sx={{ fontWeight: 600 }}>{user.full_name || user.username}</Typography>
													<Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: 'rgba(0, 0, 0, 0.04)', px: 1, py: 0.25, borderRadius: 1 }}>{user.role.toUpperCase()}</Typography>
												</Box>
											}
											secondary={
												<Box display="flex" flexDirection="column" gap={0.25} sx={{ mt: 0.25 }}>
													<Typography variant="caption" color="text.secondary">{user.email}</Typography>
													<Typography variant="caption" sx={{ fontWeight: 500, color: user.is_verified ? 'success.main' : 'warning.main' }}>{user.is_verified ? 'Verified' : 'Pending Invite'}</Typography>
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
	);
};
export default OrgDetailDrawer;
