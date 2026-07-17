import React, { useEffect, useState } from 'react';
import { Dialog, Box, TextField, MenuItem, Typography, InputAdornment, Chip } from '@mui/material';
import { Person, Badge, MailOutline, AssignmentInd } from '@mui/icons-material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch } from '../../../../store/hooks';
import { inviteTeamUser } from '../../../../store/slices/userSlice';
import { USER_ROLES, type UserRole } from '../../../../models/user';
import api from '../../../../services/api';

interface InviteOrgUserDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: (message: string) => void;
}

const initialForm = { username: '', email: '', full_name: '', role: 'developer' as UserRole };

export const InviteOrgUserDialog: React.FC<InviteOrgUserDialogProps> = ({ open, onClose, onSuccess }) => {
	const dispatch = useAppDispatch();
	const [formData, setFormData] = useState(initialForm);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [usernameStatus, setUsernameStatus] = useState<'idle' | 'validating' | 'available' | 'error'>('idle');
	const [usernameMessage, setUsernameMessage] = useState('');
	const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

	useEffect(() => {
		if (open) {
			setFormData(initialForm);
			setError(null);
			setUsernameStatus('idle');
			setUsernameMessage('');
			setUsernameSuggestions([]);
		}
	}, [open]);

	useEffect(() => {
		const trimmed = formData.username.trim().toLowerCase();
		if (!trimmed) {
			setUsernameStatus('idle');
			setUsernameMessage('');
			setUsernameSuggestions([]);
			return;
		}

		if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
			setUsernameStatus('error');
			setUsernameMessage('Username must be 3-30 characters long (lowercase letters, numbers, underscores only).');
			setUsernameSuggestions([]);
			return;
		}

		setUsernameStatus('validating');
		const timer = setTimeout(async () => {
			try {
				const response = await api.get(`/onboard/check-username?username=${encodeURIComponent(trimmed)}`);
				if (response.data.available) {
					setUsernameStatus('available');
					setUsernameMessage('Username is available.');
					setUsernameSuggestions([]);
				} else {
					setUsernameStatus('error');
					setUsernameMessage(response.data.message || 'Username is taken.');
					setUsernameSuggestions(response.data.suggestions || []);
				}
			} catch (err: any) {
				setUsernameStatus('error');
				setUsernameMessage('Failed to verify username.');
				setUsernameSuggestions([]);
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [formData.username]);

	const handleChange = (field: keyof typeof initialForm, value: string) => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: value };
			if (field === 'full_name') {
				const autoUsername = value
					.toLowerCase()
					.replace(/[^a-z0-9\s_]/g, '')
					.trim()
					.replace(/\s+/g, '_');
				
				const prevAutoUsername = prev.full_name
					.toLowerCase()
					.replace(/[^a-z0-9\s_]/g, '')
					.trim()
					.replace(/\s+/g, '_');
				
				if (!prev.username || prev.username === prevAutoUsername) {
					updated.username = autoUsername;
				}
			}
			return updated;
		});
		setError(null);
	};

	const handleSubmit = async () => {
		if (!formData.username.trim() || !formData.email.trim() || !formData.full_name.trim()) {
			setError('All fields are required.');
			return;
		}
		if (!/^[a-z0-9_]+$/.test(formData.username)) {
			setError('Username must be lowercase letters, numbers, and underscores only.');
			return;
		}

		setLoading(true);
		setError(null);
		try {
			await dispatch(inviteTeamUser(formData)).unwrap();
			onSuccess(`Invite sent to ${formData.email}.`);
			onClose();
		} catch (err: any) {
			setError(typeof err === 'string' ? err : 'Failed to send invite.');
		} finally {
			setLoading(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Invite Teammate',
			description: 'No password needed — they set their own',
			content: (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<Typography variant="body2" color="text.secondary">
						We'll email an invite link. They'll set their own password to activate the account.
					</Typography>
					<TextField
						required fullWidth label="Full Name" placeholder="e.g. John Doe" value={formData.full_name}
						onChange={(e) => handleChange('full_name', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Person sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>
					<TextField
						required fullWidth label="Username" placeholder="e.g. john_doe"
						value={formData.username} onChange={(e) => handleChange('username', e.target.value.toLowerCase())} disabled={loading}
						error={usernameStatus === 'error'}
						helperText={usernameMessage || "Lowercase letters, numbers, and underscores only."}
						FormHelperTextProps={{
							sx: {
								color: usernameStatus === 'available' ? 'success.main' : undefined
							}
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Badge sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>
					{usernameSuggestions.length > 0 && usernameStatus !== 'available' && (
						<Box sx={{ mt: -1.5, mb: 1, px: 1 }}>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
								Username taken — try a suggestion:
							</Typography>
							<Box display="flex" flexWrap="wrap" gap={1}>
								{usernameSuggestions.map((sug) => (
									<Chip
										key={sug}
										label={sug}
										size="small"
										clickable
										onClick={() => setFormData((prev) => ({ ...prev, username: sug }))}
										sx={{
											fontWeight: 700,
											fontSize: '0.75rem',
											bgcolor: 'rgba(139, 124, 246, 0.1)',
											color: 'primary.main',
											border: '1px solid rgba(139, 124, 246, 0.2)',
											'&:hover': {
												bgcolor: 'rgba(139, 124, 246, 0.2)',
											}
										}}
									/>
								))}
							</Box>
						</Box>
					)}
					<TextField
						required fullWidth type="email" label="Email Address" placeholder="e.g. john.doe@example.com" value={formData.email}
						onChange={(e) => handleChange('email', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<MailOutline sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>
					<TextField
						required select fullWidth label="Role" value={formData.role}
						onChange={(e) => handleChange('role', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<AssignmentInd sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					>
						{USER_ROLES.filter((r) => r !== 'admin').map((role) => (
							<MenuItem key={role} value={role}>
								{role.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
							</MenuItem>
						))}
					</TextField>
				</Box>
			),
		},
	];

	return (
		<Dialog
			open={open} onClose={onClose} maxWidth="sm" fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title="Invite Teammate" subtitle="Add a new member to your organization" mode="create"
				steps={steps} onSave={handleSubmit} onCancel={onClose} isSubmitting={loading}
				saveButtonText="Send Invite" error={error}
			/>
		</Dialog>
	);
};

export default InviteOrgUserDialog;
