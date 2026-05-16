import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Dialog
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchUsers } from '../../../../store/slices/userSlice';
import { settingsService } from '../../../../services/settingsService';
import type { TrainingBatch } from '../../../../models/training';
import EnterpriseForm, { type FormStep } from '../../../common/form/EnterpriseForm';
import BasicConfigTab from './tabs/BasicConfigTab';
import CurriculumTab from './tabs/CurriculumTab';
import ScheduleTab from './tabs/ScheduleTab';

interface TrainingBatchFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: Partial<TrainingBatch>) => void;
	initialData?: TrainingBatch;
}

const TrainingBatchFormDialog: React.FC<TrainingBatchFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	initialData
}) => {
	const dispatch = useAppDispatch();
	const { users: allUsers, loading: usersLoading } = useAppSelector((state) => state.users);
	const { user } = useAppSelector((state) => state.auth);

	const isAdmin = user?.role === 'admin' || user?.is_superuser;
	const isEditMode = !!initialData;
	const isDatesReadOnly = isEditMode && !isAdmin;

	const [formData, setFormData] = useState<Partial<TrainingBatch>>({
		batch_name: '',
		courses: [],
		disability_types: [],
		start_date: '',
		approx_close_date: '',
		domain: '',
		training_mode: '',
		duration: {
			start_date: '',
			end_date: '',
			weeks: 0,
			days: 0
		},
		status: 'planned',
		other: {}
	});

	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [tagsLoading, setTagsLoading] = useState(false);

	const loadTags = useCallback(async () => {
		setTagsLoading(true);
		try {
			const settings = await settingsService.getSystemSettings();
			const tagSetting = settings.find(s => s.key === 'TRAINING_BATCH_TAGS');
			if (tagSetting && tagSetting.value) {
				const tags = tagSetting.value.split(',')
					.map(t => t.trim())
					.filter(t => t.length > 0);
				setAvailableTags(tags);
			}
		} catch (error) {
			console.error('Failed to load training tags', error);
		} finally {
			setTagsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (open) {
			if (allUsers.length === 0) {
				dispatch(fetchUsers({ skip: 0, limit: 1000 }));
			}
			loadTags();
		}
	}, [open, allUsers.length, dispatch, loadTags]);

	useEffect(() => {
		if (open) {
			const today = new Date().toISOString().split('T')[0];
			const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

			if (initialData) {
				setFormData({
					...initialData,
					domain: initialData.domain || '',
					training_mode: initialData.training_mode || '',
					duration: initialData.duration ? {
						...initialData.duration,
						start_date: initialData.duration.start_date.split('T')[0],
						end_date: initialData.duration.end_date.split('T')[0]
					} : {
						start_date: today,
						end_date: thirtyDaysLater,
						weeks: 4,
						days: 2
					}
				});
			} else {
				setFormData({
					batch_name: '',
					disability_types: [],
					courses: [],
					start_date: today,
					approx_close_date: thirtyDaysLater,
					domain: '',
					training_mode: '',
					duration: {
						start_date: today,
						end_date: thirtyDaysLater,
						weeks: 4,
						days: 2
					},
					status: 'planned',
					other: {}
				});
			}
		}
	}, [initialData, open]);

	const handleChange = (field: keyof TrainingBatch, value: unknown) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleOtherChange = (key: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			other: {
				...(prev.other || {}),
				[key]: value
			}
		}));
	};

	const calculateDuration = (start: string, end: string): { weeks: number; days: number; totalDays: number } => {
		if (!start || !end) return { weeks: 0, days: 0, totalDays: 0 };
		const s = new Date(start);
		const e = new Date(end);
		const diffMs = e.getTime() - s.getTime();
		const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		if (totalDays <= 0) return { weeks: 0, days: 0, totalDays: 0 };

		return {
			weeks: Math.floor(totalDays / 7),
			days: totalDays % 7,
			totalDays
		};
	};

	const handleDurationChange = (field: string, value: string | number) => {
		setFormData((prev) => {
			const currentDuration = prev.duration || { start_date: '', end_date: '', weeks: 0, days: 0 };
			const newDuration = {
				...currentDuration,
				[field]: value
			};

			if (field === 'start_date' || field === 'end_date') {
				const start = field === 'start_date' ? (value as string) : newDuration.start_date;
				const end = field === 'end_date' ? (value as string) : newDuration.end_date;
				const dur = calculateDuration(start, end);
				newDuration.weeks = dur.weeks;
				newDuration.days = dur.days;
			}

			const topLevelUpdates: Partial<TrainingBatch> = {};
			if (field === 'start_date') topLevelUpdates.start_date = value as string;
			if (field === 'end_date') topLevelUpdates.approx_close_date = value as string;

			return { ...prev, duration: newDuration, ...topLevelUpdates };
		});
	};

	const handleSubmit = () => {
		onSubmit(formData);
		onClose();
	};

	const steps: FormStep[] = useMemo(() => [
		{
			label: 'Basic Config',
			description: 'Operational setup',
			content: (
				<BasicConfigTab 
					formData={formData} 
					onChange={handleChange} 
					onOtherChange={handleOtherChange}
					availableTags={availableTags}
					tagsLoading={tagsLoading}
				/>
			)
		},
		{
			label: 'Curriculum',
			description: 'Course selection',
			content: (
				<CurriculumTab 
					formData={formData} 
					onChange={handleChange} 
				/>
			)
		},
		{
			label: 'Schedule',
			description: 'Timeline & trainers',
			content: (
				<ScheduleTab 
					formData={formData} 
					onChange={handleChange} 
					onDurationChange={handleDurationChange}
					allUsers={allUsers}
					usersLoading={usersLoading}
					isDatesReadOnly={isDatesReadOnly}
				/>
			)
		}
	], [formData, availableTags, tagsLoading, allUsers, usersLoading, isDatesReadOnly]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
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
				title={initialData ? 'Edit Training Batch' : 'Create New Training Batch'}
				subtitle={initialData ? `Batch ID: ${initialData.public_id}` : 'Configure a new enterprise learning path'}
				mode={initialData ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSubmit}
				onCancel={onClose}
				saveButtonText={initialData ? 'Update Batch' : 'Initialize Batch'}
			/>
		</Dialog>
	);
};

export default TrainingBatchFormDialog;
