import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createProject, updateProject } from '../../../../store/slices/dsrSlice';
import { fetchUsers } from '../../../../store/slices/userSlice';
import { fetchTrainingBatches } from '../../../../store/slices/trainingSlice';
import type { ProjectFormData, ProjectDialogProps } from '../forms/types';
import type { User } from '../../../../models/user';
import type { TrainingBatch } from '../../../../models/training';

export const useProjectForm = (props: ProjectDialogProps) => {
	const { open, project, onClose, onSuccess } = props;
	const dispatch = useAppDispatch();
	const { users, loading: loadingUsers } = useAppSelector((state) => state.users);
	const { batches, loading: loadingBatches } = useAppSelector((state) => state.training);

	const initialFormData = useMemo((): ProjectFormData => ({
		name: '',
		owner: null,
		is_active: true,
		project_type: 'standard',
		selectedBatches: []
	}), []);

	const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			dispatch(fetchUsers({ skip: 0, limit: 500 }));
			dispatch(fetchTrainingBatches({ skip: 0, limit: 1000 }));
			setError(null);
			
			if (project) {
				setFormData({
					name: project.name,
					owner: null, // Will be set by the other useEffect
					is_active: project.is_active,
					project_type: project.project_type || 'standard',
					selectedBatches: [] // Will be set by the other useEffect
				});
			} else {
				setFormData(initialFormData);
			}
		}
	}, [open, project, dispatch, initialFormData]);

	useEffect(() => {
		if (open && project && project.owner && users.length > 0) {
			const currentOwner = users.find(u => u.public_id === project.owner?.public_id);
			if (currentOwner) {
				setFormData(prev => ({ ...prev, owner: currentOwner }));
			}
		}
	}, [open, project, users]);

	useEffect(() => {
		if (open && project && batches.length > 0) {
			if (project.linked_batches && project.linked_batches.length > 0) {
				const selected = batches.filter(b => 
					project.linked_batches?.some(lb => lb.public_id === b.public_id)
				);
				setFormData(prev => ({ ...prev, selectedBatches: selected }));
			} else if (project.linked_batch) {
				const batch = batches.find(b => b.public_id === project.linked_batch?.public_id);
				if (batch) {
					setFormData(prev => ({ ...prev, selectedBatches: [batch] }));
				}
			}
		}
	}, [open, project, batches]);

	const handleChange = useCallback((field: keyof ProjectFormData, value: string | boolean | User | TrainingBatch[] | null) => {
		setFormData(prev => {
			const newData = { ...prev, [field]: value };
			
			// Auto-set name from batch if it's a training project and name is empty
			if (field === 'selectedBatches' && prev.project_type === 'training' && Array.isArray(value) && value.length > 0 && !prev.name) {
				newData.name = value[0].batch_name;
			}
			
			return newData;
		});
		setError(null);
	}, []);

	const handleSubmit = async () => {
		if (!formData.owner) {
			setError('Project owner is required');
			return;
		}
		if (!formData.name) {
			setError('Project name is required');
			return;
		}

		setSubmitting(true);
		setError(null);
		try {
			const commonData = {
				name: formData.name,
				owner_user_public_id: formData.owner.public_id,
				is_active: formData.is_active,
				project_type: formData.project_type,
				linked_batch_public_ids: formData.project_type === 'training' ? formData.selectedBatches.map(b => b.public_id) : []
			};

			if (project) {
				await dispatch(updateProject({
					publicId: project.public_id,
					data: commonData
				})).unwrap();
				onSuccess('Project updated successfully');
			} else {
				await dispatch(createProject(commonData)).unwrap();
				onSuccess('Project created successfully');
			}
			onClose();
		} catch (err: unknown) {
			console.error('Failed to save project:', err);
			/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
			setError((err as any)?.message || 'Failed to save project');
		} finally {
			setSubmitting(false);
		}
	};

	return {
		formData,
		submitting,
		error,
		users,
		batches,
		loadingUsers,
		loadingBatches,
		handleChange,
		handleSubmit
	};
};
