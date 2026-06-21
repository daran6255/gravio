import React, { useEffect, useState } from 'react';
import { Dialog, Box, TextField, Typography, Divider } from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../common/form';
import { useAppDispatch } from '../../../store/hooks';
import { createOrganization } from '../../../store/slices/orgAdminSlice';

interface CreateOrganizationDialogProps {
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
export const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({ open, onClose, onSuccess }) => {
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
						required
						fullWidth
						label="Organization Name"
						value={formData.orgName}
						onChange={(e) => handleChange('orgName', e.target.value)}
						disabled={loading}
					/>
					<TextField
						fullWidth
						label="Location"
						placeholder="e.g. Austin, TX"
						value={formData.orgLocation}
						onChange={(e) => handleChange('orgLocation', e.target.value)}
						disabled={loading}
					/>

					<Divider sx={{ my: 1 }} />
					<Typography variant="subtitle2" color="text.secondary">
						First Admin (invite-based — no password set here)
					</Typography>

					<TextField
						required
						fullWidth
						label="Admin Full Name"
						value={formData.adminFullName}
						onChange={(e) => handleChange('adminFullName', e.target.value)}
						disabled={loading}
					/>
					<TextField
						required
						fullWidth
						label="Admin Username"
						helperText="Lowercase letters, numbers, and underscores only."
						value={formData.adminUsername}
						onChange={(e) => handleChange('adminUsername', e.target.value.toLowerCase())}
						disabled={loading}
					/>
					<TextField
						required
						fullWidth
						type="email"
						label="Admin Email"
						value={formData.adminEmail}
						onChange={(e) => handleChange('adminEmail', e.target.value)}
						disabled={loading}
					/>
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
				title="New Organization"
				subtitle="Provision a tenant organization and its first admin"
				mode="create"
				steps={steps}
				onSave={handleSubmit}
				onCancel={onClose}
				isSubmitting={loading}
				saveButtonText="Create Organization"
				error={error}
			/>
		</Dialog>
	);
};

export default CreateOrganizationDialog;
