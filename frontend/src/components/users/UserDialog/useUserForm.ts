import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRoles, createUser, updateUser } from '../../../store/slices/userSlice';
import type { UserUpdate } from '../../../models/user';
import type { UserFormData, UserDialogProps } from './types';

export const useUserForm = (props: UserDialogProps) => {
	const { open, mode, user, onClose, onSuccess } = props;
	const dispatch = useAppDispatch();
	const { roles } = useAppSelector((state) => state.users);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const initialFormData = useMemo((): UserFormData => ({
		email: '',
		username: '',
		password: '',
		full_name: '',
		role: 'trainer',
		is_active: true,
		is_verified: false,
		mobile: '',
		confirmPassword: ''
	}), []);

	const [formData, setFormData] = useState<UserFormData>(initialFormData);

	// Fetch roles on mount via Redux
	useEffect(() => {
		if (roles.length === 0) {
			dispatch(fetchRoles());
		}
	}, [dispatch, roles.length]);

	// Reset form when dialog opens or mode/user changes
	useEffect(() => {
		if (open) {
			setError(null);
			setLoading(false);
			if ((mode === 'edit' || mode === 'view') && user) {
				setFormData({
					email: user.email,
					username: user.username,
					full_name: user.full_name,
					role: user.role,
					is_active: user.is_active,
					is_verified: user.is_verified,
					mobile: user.mobile || '',
					password: '',
					confirmPassword: ''
				});
			} else if (mode === 'add') {
				setFormData(initialFormData);
			}
		}
	}, [open, mode, user, initialFormData]);

	const handleChange = useCallback((field: string, value: string | boolean) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		setError(null);
	}, []);

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);

		if (mode === 'add' && !formData.password) {
			setError('Password is required');
			setLoading(false);
			return;
		}

		if (formData.password && formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			setLoading(false);
			return;
		}

		try {
			if (mode === 'add') {
				const { confirmPassword: _confirmPassword, ...createData } = formData;
				await dispatch(createUser(createData)).unwrap();
				if (onSuccess) onSuccess('User created successfully');
			} else if (mode === 'edit' && user) {
				const updateData: UserUpdate = {
					full_name: formData.full_name,
					username: formData.username,
					email: formData.email,
					is_active: formData.is_active,
					role: formData.role,
					mobile: formData.mobile
				};
				if (formData.password) {
					updateData.password = formData.password;
				}
				await dispatch(updateUser({ id: user.id.toString(), userData: updateData })).unwrap();
				if (onSuccess) onSuccess('User updated successfully');
			}
			onClose();
		} catch (err: unknown) {
			const errorMessage = typeof err === 'string' ? err : (err as Error)?.message || `Failed to ${mode} user`;
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return {
		formData,
		loading,
		error,
		roles,
		handleChange,
		handleSubmit
	};
};
