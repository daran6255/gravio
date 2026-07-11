import { useState } from 'react';
import { useAppDispatch } from '../../../../store/hooks';
import { createTimeLog, updateTimeLog, deleteTimeLog } from '../../../../store/slices/timesheetSlice';
import useToast from '../../../../hooks/useToast';
import type { ProjectTimeLog } from '../../../../models/timesheet';
import type { RowDraft } from '../types';
import { buildLogPayload, validateRow } from '../utils';

interface UseTimeLogSubmitArgs {
	log?: ProjectTimeLog;
	rows: RowDraft[];
	setError: (error: string | null) => void;
	onSave?: () => void;
	onClose: () => void;
}

// Owns saving/deleting the time log(s) represented by the current row drafts,
// plus the delete-confirmation dialog state.
export const useTimeLogSubmit = ({ log, rows, setError, onSave, onClose }: UseTimeLogSubmitArgs) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!log;

	const [submitting, setSubmitting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Mirrors the backend's own rule (only draft/rejected entries are deletable) --
	// the grid already blocks opening this dialog for submitted/approved logs, so
	// this is mostly a defensive guard against stale UI state.
	const canDelete = isEdit && !!log && (log.status === 'draft' || log.status === 'rejected');

	const handleSubmit = async () => {
		setError(null);

		for (let i = 0; i < rows.length; i++) {
			const rowError = validateRow(rows[i]);
			if (rowError) {
				setError(rows.length > 1 ? `Row ${i + 1}: ${rowError}` : rowError);
				return;
			}
		}

		setSubmitting(true);

		try {
			if (isEdit && log) {
				await dispatch(updateTimeLog({ id: log.id, data: buildLogPayload(rows[0]) })).unwrap();
			} else {
				for (const row of rows) {
					await dispatch(createTimeLog(buildLogPayload(row))).unwrap();
				}
			}
			onSave?.();
			onClose();
		} catch (err: any) {
			// Refresh so any rows that succeeded before the failure still show up in the grid
			onSave?.();
			setError(err || 'An error occurred while saving the time log(s)');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!log) return;
		setDeleting(true);
		try {
			await dispatch(deleteTimeLog(log.id)).unwrap();
			toast.success('Time entry deleted');
			setConfirmDeleteOpen(false);
			onSave?.();
			onClose();
		} catch (err: any) {
			toast.error(err || 'Failed to delete time entry');
		} finally {
			setDeleting(false);
		}
	};

	return {
		isEdit,
		canDelete,
		submitting,
		deleting,
		confirmDeleteOpen,
		setConfirmDeleteOpen,
		handleSubmit,
		handleDelete
	};
};
