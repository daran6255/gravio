import React from 'react';
import {
	Box, Divider, Card, CardContent, Grid,
	TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText,
	Avatar, Tooltip, Skeleton, Typography, IconButton, useTheme
} from '@mui/material';
import { Search, MailOutline, Block, CheckCircleOutline, DeleteOutline } from '@mui/icons-material';
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
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const filteredUsers = selectedOrgUsers.filter(user => {
		const searchLower = userSearchTerm.toLowerCase();
		return (
			user.full_name?.toLowerCase().includes(searchLower) ||
			user.username.toLowerCase().includes(searchLower) ||
			user.email.toLowerCase().includes(searchLower) ||
			user.role.toLowerCase().includes(searchLower)
		);
	});

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
						) : filteredUsers.length === 0 ? (
							<Box py={4} textAlign="center"><Typography variant="body2" color="text.secondary">{userSearchTerm ? 'No matching users found.' : 'No users in this organization.'}</Typography></Box>
						) : (
							<List sx={{ p: 0 }}>
								{filteredUsers.map((user) => (
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
											<Box display="flex" gap={0.5}>
												{!user.is_verified && user.is_active && (
													<Tooltip title="Resend Invite">
														<IconButton 
															size="small" 
															color="primary" 
															onClick={() => onUserAction(user, 'resendInvite')}
															sx={{ 
																bgcolor: isDark ? 'rgba(139, 124, 246, 0.1)' : 'rgba(139, 124, 246, 0.05)',
																'&:hover': { bgcolor: isDark ? 'rgba(139, 124, 246, 0.2)' : 'rgba(139, 124, 246, 0.1)' }
															}}
														>
															<MailOutline fontSize="small" />
														</IconButton>
													</Tooltip>
												)}
												<Tooltip title={user.is_active ? 'Deactivate User' : 'Reactivate User'}>
													<IconButton 
														size="small" 
														color={user.is_active ? 'error' : 'success'} 
														onClick={() => onUserAction(user, user.is_active ? 'deactivate' : 'reactivate')}
														sx={{ 
															bgcolor: user.is_active 
																? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
																: (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'),
															'&:hover': { 
																bgcolor: user.is_active 
																	? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)')
																	: (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
															}
														}}
													>
														{user.is_active ? <Block fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
													</IconButton>
												</Tooltip>
												<Tooltip title="Delete User">
													<IconButton 
														size="small" 
														color="error" 
														onClick={() => onUserAction(user, 'delete')}
														sx={{ 
															bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
															'&:hover': { bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }
														}}
													>
														<DeleteOutline fontSize="small" />
													</IconButton>
												</Tooltip>
											</Box>
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
				</>
			)}
		</DetailDrawer>
	);
};
export default OrgDetailDrawer;
