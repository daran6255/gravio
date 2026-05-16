import { useState, useEffect, useCallback } from 'react';
import trainingExtensionService from '../../../../services/trainingExtensionService';
import { useSnackbar } from 'notistack';
import type { TrainingBatch, TrainingBatchEvent } from '../../../../models/training';

export const usePlanEvents = (selectedBatch: TrainingBatch) => {
	const { enqueueSnackbar } = useSnackbar();
	const [batchEvents, setBatchEvents] = useState<TrainingBatchEvent[]>([]);

	const fetchBatchEvents = useCallback(async () => {
		if (selectedBatch?.id) {
			try {
				const events = await trainingExtensionService.getBatchEvents(selectedBatch.id);
				setBatchEvents(events);
			} catch (error) {
				console.error('Failed to fetch batch events', error);
			}
		}
	}, [selectedBatch?.id]);

	useEffect(() => {
		fetchBatchEvents();
	}, [fetchBatchEvents]);

	const handleConfirmEvent = async (eventData: any) => {
		try {
			await trainingExtensionService.createBatchEvent({
				batch_id: selectedBatch.id,
				date: eventData.date,
				...eventData
			});
			enqueueSnackbar(`${eventData.event_type} added successfully`, { variant: 'success' });
			fetchBatchEvents();
			return true;
		} catch (error) {
			enqueueSnackbar('Failed to add event', { variant: 'error' });
			return false;
		}
	};

	const handleDeleteEvent = async (eventId: number) => {
		try {
			await trainingExtensionService.deleteBatchEvent(eventId);
			enqueueSnackbar('Event removed', { variant: 'info' });
			fetchBatchEvents();
		} catch (error) {
			enqueueSnackbar('Failed to remove event', { variant: 'error' });
		}
	};

	return {
		batchEvents,
		handleConfirmEvent,
		handleDeleteEvent,
		fetchBatchEvents
	};
};
