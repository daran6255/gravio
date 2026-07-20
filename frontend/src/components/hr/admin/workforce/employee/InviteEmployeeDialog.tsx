import React, { useState, useEffect } from 'react';
import { TextField, Stack, MenuItem, Typography } from '@mui/material';
import { BaseDialog } from '../../../../common/dialogbox';
import { CancelButton, SubmitButton } from '../../../../common/button';
import { useAppDispatch } from '../../../../../store/hooks';
import { inviteEmployeeToGravit } from '../../../../../store/slices/hrSlice';
import { USER_ROLES, type UserRole } from '../../../../../models/user';
import type { HREmployeeListItem } from '../../../../../models/hr';
import useToast from '../../../../../hooks/useToast';

interface InviteEmployeeDialogProps {
	open: boolean;
	employee: HREmployeeListItem | null;
	onClose: () => void;
	onInvited: () => void;
}

const roleLabel = (role: string) => role.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

export const InviteEmployeeDialog: React.FC<InviteEmployeeDialogProps> = ({ open, employee, onClose, onInvited }) => {
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const [username, setUsername] = useState('');
	const [role, setRole] = useState<UserRole>('developer');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			setUsername('');
			setRole('developer');
		}
	}, [open, employee]);

	const handleSave = async () => {
		if (!employee || !username.trim()) return;
		setSaving(true);
		try {
			await dispatch(inviteEmployeeToGravit({ publicId: employee.public_id, payload: { username: username.trim(), role } })).unwrap();
			success(`Invite sent to ${employee.email}`);
			onInvited();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to send invite');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Invite to Gravit"
			subtitle={employee ? `Send ${employee.full_name || employee.email} a login invite` : ''}
			maxWidth="sm"
			loading={saving}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={saving} />
					<SubmitButton
						onClick={handleSave}
						loading={saving}
						disabled={!username.trim()}
					>
						Send Invite
					</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<Typography variant="body2" color="text.secondary">
					We'll email {employee?.email} an invite link. They'll set their own password to activate the account.
				</Typography>
				<TextField
					required fullWidth label="Username"
					helperText="Lowercase letters, numbers, and underscores only."
					value={username}
					onChange={(e) => setUsername(e.target.value.toLowerCase())}
					disabled={saving}
				/>
				<TextField
					required select fullWidth label="System Role"
					value={role}
					onChange={(e) => setRole(e.target.value as UserRole)}
					disabled={saving}
				>
					{USER_ROLES.filter((r) => r !== 'admin').map((r) => (
						<MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>
					))}
				</TextField>
			</Stack>
		</BaseDialog>
	);
};

export default InviteEmployeeDialog;
