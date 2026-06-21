import React, { useEffect, useState } from 'react';
import { Dialog } from '@mui/material';
import { Box, TextField, MenuItem } from '@mui/material';
import { EnterpriseForm, type FormStep } from '../common/form';
import { useAppDispatch } from '../../store/hooks';
import { updateTeamUser } from '../../store/slices/userSlice';
import { USER_ROLES, type UserRole, type TeamMember } from '../../models/user';

interface EditUserDialogProps {
	open: boolean;
	user: TeamMember | null;
	onClose: () => void;
	onSuccess: (message: string) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, user, onClose, onSuccess }) => {
	const dispatch = useAppDispatch();
	const [formData, setFormData] = useState({ username: '', email: '', full_name: '', role: 'developer' as UserRole });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open && user) {
			setFormData({
				username: user.username || '',
				email: user.email || '',
				full_name: user.full_name || '',
				role: user.role || 'developer',
			});
			setError(null);
		}
	}, [open, user]);

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setError(null);
	};

	const handleSubmit = async () => {
		if (!user) return;
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
			await dispatch(updateTeamUser({ publicId: user.public_id, payload: formData })).unwrap();
			onSuccess(`User details updated successfully.`);
			onClose();
		} catch (err: any) {
			setError(typeof err === 'string' ? err : 'Failed to update user.');
		} finally {
			setLoading(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Edit Teammate Details',
			description: 'Update username, email, full name, or role',
			content: (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<TextField
						required
						fullWidth
						label="Full Name"
						value={formData.full_name}
						onChange={(e) => handleChange('full_name', e.target.value)}
						disabled={loading}
					/>
					<TextField
						required
						fullWidth
						label="Username"
						helperText="Lowercase letters, numbers, and underscores only."
						value={formData.username}
						onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
						disabled={loading}
					/>
					<TextField
						required
						fullWidth
						type="email"
						label="Email Address"
						value={formData.email}
						onChange={(e) => handleChange('email', e.target.value)}
						disabled={loading}
					/>
					<TextField
						required
						select
						fullWidth
						label="Role"
						value={formData.role}
						onChange={(e) => handleChange('role', e.target.value)}
						disabled={loading}
					>
						{USER_ROLES.map((role) => (
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
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title="Edit Teammate"
				subtitle="Update member details in your organization"
				mode="edit"
				steps={steps}
				onSave={handleSubmit}
				onCancel={onClose}
				isSubmitting={loading}
				saveButtonText="Save Changes"
				error={error}
			/>
		</Dialog>
	);
};

export default EditUserDialog;
