import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchMyCategories, createCategory, deleteCategory } from '../../../../store/slices/timesheetSlice';
import type { TimesheetCategory } from '../../../../models/timesheet';

export const CATEGORY_COLORS = [
	'#8B7CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899',
	'#14B8A6', '#EF4444', '#6366F1', '#A855F7', '#6B7280'
];

export const useMyCategories = () => {
	const dispatch = useAppDispatch();
	const { categories, categoriesLoading } = useAppSelector((state) => state.timesheets);

	const [newCategoryName, setNewCategoryName] = useState('');
	const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<TimesheetCategory | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		dispatch(fetchMyCategories());
	}, [dispatch]);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!newCategoryName.trim()) {
			setError('Category name is required');
			return;
		}

		setSubmitting(true);
		try {
			await dispatch(createCategory({ name: newCategoryName, color: selectedColor })).unwrap();
			setNewCategoryName('');
		} catch (err: any) {
			setError(err || 'Failed to create category');
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setError(null);
		setDeleteLoading(true);
		try {
			await dispatch(deleteCategory(deleteTarget.id)).unwrap();
			setDeleteTarget(null);
		} catch (err: any) {
			setError(err || 'Failed to delete category');
		} finally {
			setDeleteLoading(false);
		}
	};

	return {
		newCategoryName, setNewCategoryName,
		selectedColor, setSelectedColor,
		error, setError,
		submitting,
		deleteTarget, setDeleteTarget,
		deleteLoading,
		categories,
		categoriesLoading,
		handleCreate,
		handleConfirmDelete
	};
};
