import React, { useMemo } from 'react';
import { Dialog } from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../common/form';
import type { UserDialogProps } from './types';
import { useUserForm } from './useUserForm';
import UserBasicInfo from './UserBasicInfo';
import UserPermissions from './UserPermissions';
import UserSecurity from './UserSecurity';

/**
 * UserDialog Component.
 * Orchestrates the user management form steps and business logic.
 */
const UserDialog: React.FC<UserDialogProps> = (props) => {
	const { open, mode, user, onClose } = props;
	const {
		formData,
		loading,
		error,
		roles,
		handleChange,
		handleSubmit
	} = useUserForm(props);

	const steps = useMemo((): FormStep[] => [
		{
			label: 'Basic Information',
			description: 'Profile & Identity',
			content: (
				<UserBasicInfo
					formData={formData}
					handleChange={handleChange}
					loading={loading}
					mode={mode}
				/>
			)
		},
		{
			label: 'Permissions & Status',
			description: 'Security & Metadata',
			content: (
				<UserPermissions
					formData={formData}
					handleChange={handleChange}
					loading={loading}
					mode={mode}
					roles={roles}
					user={user}
				/>
			)
		},
		{
			label: 'Security',
			description: 'Authentication Secrets',
			content: (
				<UserSecurity
					formData={formData}
					handleChange={handleChange}
					loading={loading}
					mode={mode}
				/>
			)
		}
	], [formData, loading, mode, roles, user, handleChange]);

	const getMode = () => {
		if (mode === 'add') return 'create';
		return mode;
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 0,
					boxShadow: 'none',
					bgcolor: 'transparent'
				}
			}}
		>
			<EnterpriseForm
				title={mode === 'add' ? 'Create Domain Identity' : mode === 'edit' ? 'Governance: User Context' : 'User Runtime Properties'}
				subtitle={mode === 'add' ? 'Initialize a new system entity within the secure administrative perimeter' : `Infrastructure governance for: ${user?.username}`}
				mode={getMode() as 'create' | 'edit' | 'view'}
				steps={steps}
				onSave={handleSubmit}
				onCancel={onClose}
				isSubmitting={loading}
				saveButtonText={mode === 'add' ? 'Provision Account' : 'Commit Changes'}
				error={error}
			/>
		</Dialog>
	);
};

export default UserDialog;
