import React, { useEffect, useState } from 'react';
import { Dialog, Box, TextField, MenuItem, Typography } from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../common/form';
import { useAppDispatch } from '../../../store/hooks';
import { inviteTeamUser } from '../../../store/slices/userSlice';
import { USER_ROLES, type UserRole } from '../../../models/user';

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

	useEffect(() => {
		if (open) {
			setFormData(initialForm);
			setError(null);
		}
	}, [open]);

	const handleChange = (field: keyof typeof initialForm, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
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
						required fullWidth label="Full Name" value={formData.full_name}
						onChange={(e) => handleChange('full_name', e.target.value)} disabled={loading}
					/>
					<TextField
						required fullWidth label="Username" helperText="Lowercase letters, numbers, and underscores only."
						value={formData.username} onChange={(e) => handleChange('username', e.target.value.toLowerCase())} disabled={loading}
					/>
					<TextField
						required fullWidth type="email" label="Email Address" value={formData.email}
						onChange={(e) => handleChange('email', e.target.value)} disabled={loading}
					/>
					<TextField
						required select fullWidth label="Role" value={formData.role}
						onChange={(e) => handleChange('role', e.target.value)} disabled={loading}
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
