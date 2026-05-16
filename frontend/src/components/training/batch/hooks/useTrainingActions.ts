import { useCallback } from 'react';
import { useAppDispatch } from '../../../../store/hooks';
import {
	createTrainingBatch,
	updateTrainingBatch,
	extendTrainingBatch,
	deleteTrainingBatch
} from '../../../../store/slices/trainingSlice';
import type { TrainingBatch } from '../../../../models/training';
import useToast from '../../../../hooks/useToast';

export const useTrainingActions = () => {
	const dispatch = useAppDispatch();
	const { success, error: showError } = useToast();

	const handleFormSubmit = useCallback(async (data: Partial<TrainingBatch>, selectedBatch?: TrainingBatch) => {
		try {
			if (selectedBatch) {
				await dispatch(updateTrainingBatch({ publicId: selectedBatch.public_id, data })).unwrap();
				success('Batch updated successfully');
			} else {
				await dispatch(createTrainingBatch(data)).unwrap();
				success('Batch created successfully');
			}
			return true;
		} catch (err: any) {
			showError(err || 'Failed to save batch');
			return false;
		}
	}, [dispatch, success, showError]);

	const handleExtendConfirm = useCallback(async (selectedBatch: TrainingBatch, newDate: string, reason: string) => {
		try {
			await dispatch(extendTrainingBatch({
				publicId: selectedBatch.public_id,
				new_close_date: newDate,
				reason
			})).unwrap();
			success('Batch extended successfully');
			return true;
		} catch (err: any) {
			showError(err || 'Failed to extend batch');
			return false;
		}
	}, [dispatch, success, showError]);

	const handleDeleteConfirm = useCallback(async (selectedBatch: TrainingBatch) => {
		try {
			await dispatch(deleteTrainingBatch(selectedBatch.public_id)).unwrap();
			success('Batch deleted successfully');
			return true;
		} catch (err: any) {
			showError(err || 'Failed to delete batch');
			return false;
		}
	}, [dispatch, success, showError]);

	return {
		handleFormSubmit,
		handleExtendConfirm,
		handleDeleteConfirm
	};
};
