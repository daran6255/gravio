import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchMyCategories, createCategory, deleteCategory } from '../../../../store/slices/timesheetSlice';
import useToast from '../../../../hooks/useToast';
import type { TimesheetCategory } from '../../../../models/timesheet';
import type { RowDraft } from '../types';
import { ADD_NEW_CATEGORY, CATEGORY_COLORS } from '../utils';

interface UseTimesheetCategoriesArgs {
	open: boolean;
	currentUserId?: number;
	updateRow: (key: string, patch: Partial<RowDraft>) => void;
	setRows: React.Dispatch<React.SetStateAction<RowDraft[]>>;
}

// Owns the inline "add category" and "manage my categories" flows reachable from
// the General row's Category select.
export const useTimesheetCategories = ({ open, currentUserId, updateRow, setRows }: UseTimesheetCategoriesArgs) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { categories } = useAppSelector((state) => state.timesheets);

	const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
	const [newCategoryRowKey, setNewCategoryRowKey] = useState<string | null>(null);
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const [creatingCategory, setCreatingCategory] = useState(false);

	// Manage/delete the categories the current user has personally added. Org-default
	// categories (user_id is null) aren't shown here -- the backend rejects deleting
	// those anyway (see update_category/delete_category in timesheets.py).
	const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
	const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<TimesheetCategory | null>(null);
	const [deletingCategory, setDeletingCategory] = useState(false);
	const myCategories = useMemo(
		() => categories.filter((c) => c.user_id === currentUserId),
		[categories, currentUserId]
	);

	useEffect(() => {
		if (open) {
			dispatch(fetchMyCategories());
		}
	}, [open, dispatch]);

	const handleCategorySelectChange = (rowKey: string, value: string) => {
		if (value === ADD_NEW_CATEGORY) {
			setNewCategoryRowKey(rowKey);
			setNewCategoryName('');
			setNewCategoryColor(CATEGORY_COLORS[0]);
			setCategoryError(null);
			setNewCategoryDialogOpen(true);
			return;
		}
		updateRow(rowKey, { categoryId: Number(value) });
	};

	const handleCreateCategory = async () => {
		if (!newCategoryName.trim()) return;
		setCreatingCategory(true);
		setCategoryError(null);
		try {
			const created = await dispatch(
				createCategory({ name: newCategoryName.trim(), color: newCategoryColor })
			).unwrap();
			if (newCategoryRowKey) {
				updateRow(newCategoryRowKey, { categoryId: created.id });
			}
			toast.success('Category created');
			setNewCategoryDialogOpen(false);
			setNewCategoryRowKey(null);
			setNewCategoryName('');
		} catch (err: any) {
			setCategoryError(err || 'Failed to create category');
		} finally {
			setCreatingCategory(false);
		}
	};

	const handleConfirmDeleteCategory = async () => {
		if (!deleteCategoryTarget) return;
		const category = deleteCategoryTarget;
		setDeletingCategory(true);
		try {
			await dispatch(deleteCategory(category.id)).unwrap();
			toast.success(`"${category.name}" deleted`);
			// Any row that had this category selected loses it -- category_id would
			// otherwise point at something that no longer shows up in the dropdown.
			setRows((prev) => prev.map((r) => (r.categoryId === category.id ? { ...r, categoryId: '' } : r)));
			setDeleteCategoryTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete category');
		} finally {
			setDeletingCategory(false);
		}
	};

	return {
		categories,
		myCategories,
		newCategoryDialogOpen,
		setNewCategoryDialogOpen,
		newCategoryRowKey,
		setNewCategoryRowKey,
		newCategoryName,
		setNewCategoryName,
		newCategoryColor,
		setNewCategoryColor,
		categoryError,
		creatingCategory,
		manageCategoriesOpen,
		setManageCategoriesOpen,
		deleteCategoryTarget,
		setDeleteCategoryTarget,
		deletingCategory,
		handleCategorySelectChange,
		handleCreateCategory,
		handleConfirmDeleteCategory
	};
};
