import React, { useEffect, useState } from 'react';
import { Dialog, Box, TextField, Typography, Divider, InputAdornment, Chip } from '@mui/material';
import { Business, LocationOn, Person, Badge, MailOutline } from '@mui/icons-material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch } from '../../../../store/hooks';
import { createOrganization } from '../../../../store/slices/orgAdminSlice';
import api from '../../../../services/api';

interface CreateOrgDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: (message: string) => void;
}

const initialForm = {
	orgName: '',
	orgLocation: '',
	adminUsername: '',
	adminEmail: '',
	adminFullName: '',
};

/**
 * Provisions a new org + its first (invite-based) admin. No password is collected —
 * the admin sets one via the emailed Accept Invite link, same as Org Admin invites.
 */
export const CreateOrgDialog: React.FC<CreateOrgDialogProps> = ({ open, onClose, onSuccess }) => {
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
		const trimmed = formData.adminUsername.trim().toLowerCase();
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
	}, [formData.adminUsername]);

	const handleChange = (field: keyof typeof initialForm, value: string) => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: value };
			if (field === 'adminFullName') {
				const autoUsername = value
					.toLowerCase()
					.replace(/[^a-z0-9\s_]/g, '')
					.trim()
					.replace(/\s+/g, '_');
				
				const prevAutoUsername = prev.adminFullName
					.toLowerCase()
					.replace(/[^a-z0-9\s_]/g, '')
					.trim()
					.replace(/\s+/g, '_');
				
				if (!prev.adminUsername || prev.adminUsername === prevAutoUsername) {
					updated.adminUsername = autoUsername;
				}
			}
			return updated;
		});
		setError(null);
	};

	const handleSubmit = async () => {
		if (!formData.orgName.trim()) {
			setError('Organization name is required.');
			return;
		}
		if (!formData.adminUsername.trim() || !formData.adminEmail.trim() || !formData.adminFullName.trim()) {
			setError('All admin fields are required.');
			return;
		}
		if (!/^[a-z0-9_]+$/.test(formData.adminUsername)) {
			setError('Username must be lowercase letters, numbers, and underscores only.');
			return;
		}

		setLoading(true);
		setError(null);
		try {
			await dispatch(createOrganization({
				organization: {
					name: formData.orgName,
					location: formData.orgLocation || undefined,
				},
				admin: {
					username: formData.adminUsername,
					email: formData.adminEmail,
					full_name: formData.adminFullName,
				},
			})).unwrap();
			onSuccess(`Organization '${formData.orgName}' created. An invite has been emailed to its admin.`);
			onClose();
		} catch (err: any) {
			setError(typeof err === 'string' ? err : 'Failed to create organization.');
		} finally {
			setLoading(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'New Organization',
			description: 'Provisioned on a 30-day trial',
			content: (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<TextField
						required fullWidth label="Organization Name" placeholder="e.g. Acme Corporation" value={formData.orgName}
						onChange={(e) => handleChange('orgName', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Business sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>
					<TextField
						fullWidth label="Location" placeholder="e.g. Austin, TX" value={formData.orgLocation}
						onChange={(e) => handleChange('orgLocation', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<LocationOn sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>

					<Divider sx={{ my: 1 }} />
					<Typography variant="subtitle2" color="text.secondary">
						First Admin (invite-based — no password set here)
					</Typography>

					<TextField
						required fullWidth label="Admin Full Name" placeholder="e.g. John Doe" value={formData.adminFullName}
						onChange={(e) => handleChange('adminFullName', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Person sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>
					<TextField
						required fullWidth label="Admin Username" placeholder="e.g. john_doe"
						value={formData.adminUsername} onChange={(e) => handleChange('adminUsername', e.target.value.toLowerCase())} disabled={loading}
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
										onClick={() => setFormData((prev) => ({ ...prev, adminUsername: sug }))}
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
						required fullWidth type="email" label="Admin Email" placeholder="e.g. john.doe@example.com" value={formData.adminEmail}
						onChange={(e) => handleChange('adminEmail', e.target.value)} disabled={loading}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<MailOutline sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
					/>
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
				title="New Organization" subtitle="Provision a tenant organization and its first admin" mode="create"
				steps={steps} onSave={handleSubmit} onCancel={onClose} isSubmitting={loading}
				saveButtonText="Create Organization" error={error}
			/>
		</Dialog>
	);
};

export default CreateOrgDialog;
