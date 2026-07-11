import React, { useMemo } from 'react';
import { Button, Stack, Box, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';
import { useAppSelector } from '../../../store/hooks';
import { TimeLogRowFields, AddCategoryDialog, ManageCategoriesDialog } from './components';
import { useTimeLogRows } from './hooks/useTimeLogRows';
import { useTimeLogSubmit } from './hooks/useTimeLogSubmit';
import { useTimesheetCategories } from './hooks/useTimesheetCategories';
import type { TimeLogEntryFormDialogProps } from './types';

const TimeLogEntryFormDialog: React.FC<TimeLogEntryFormDialogProps> = ({
	open,
	onClose,
	log,
	defaultDate,
	onSave
}) => {
	const currentUser = useAppSelector((state) => state.auth.user);

	// The Project Management module is a separate plan add-on -- timesheets must work
	// standalone for orgs that never bought it (or a trial, which unlocks everything).
	// Without this check the Task/Project dropdowns would 403 on every open and dead-end.
	const hasProjectModule = useMemo(() => {
		if (currentUser?.is_superuser) return true;
		const org = currentUser?.organization;
		if (!org) return false;
		if (org.subscription_status === 'trial') return true;
		return org.plan?.enabled_modules?.includes('project_management') ?? false;
	}, [currentUser]);

	const {
		rows,
		setRows,
		error,
		setError,
		visibleProjects,
		doneStatusIds,
		getVisibleTasks,
		updateRow,
		handleProjectChange,
		handleTaskChange,
		handleAddRow,
		handleRemoveRow
	} = useTimeLogRows({ open, log, defaultDate, hasProjectModule, currentUserId: currentUser?.id });

	const { isEdit, canDelete, submitting, deleting, confirmDeleteOpen, setConfirmDeleteOpen, handleSubmit, handleDelete } =
		useTimeLogSubmit({ log, rows, setError, onSave, onClose });

	const {
		categories,
		myCategories,
		newCategoryDialogOpen,
		setNewCategoryDialogOpen,
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
	} = useTimesheetCategories({ open, currentUserId: currentUser?.id, updateRow, setRows });

	return (
		<>
			<BaseDialog
				open={open}
				onClose={onClose}
				title={isEdit ? 'Edit Time Entry' : 'Log Time'}
				subtitle={isEdit ? undefined : 'Add hours across one or more projects and activities for the day'}
				maxWidth="sm"
				loading={submitting}
				actions={
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
						<Box>
							{canDelete && (
								<Button
									color="error"
									startIcon={<DeleteIcon />}
									onClick={() => setConfirmDeleteOpen(true)}
									disabled={submitting}
									sx={{ fontWeight: 700, borderRadius: '8px' }}
								>
									Delete
								</Button>
							)}
						</Box>
						<Stack direction="row" spacing={1}>
							<Button onClick={onClose} disabled={submitting}>
								Cancel
							</Button>
							<Button
								variant="contained"
								onClick={handleSubmit}
								disabled={submitting}
								sx={{ fontWeight: 700, borderRadius: '8px' }}
							>
								{submitting ? (
									<CircularProgress size={18} />
								) : isEdit ? (
									'Update Entry'
								) : rows.length > 1 ? (
									`Log ${rows.length} Entries`
								) : (
									'Log Time'
								)}
							</Button>
						</Stack>
					</Box>
				}
			>
				<Stack spacing={2.5}>
					{error && (
						<Alert severity="error" sx={{ borderRadius: '8px' }}>
							{error}
						</Alert>
					)}

					{rows.map((row, idx) => (
						<TimeLogRowFields
							key={row.key}
							row={row}
							rowIndex={idx}
							totalRows={rows.length}
							hasProjectModule={hasProjectModule}
							visibleProjects={visibleProjects}
							getVisibleTasks={getVisibleTasks}
							doneStatusIds={doneStatusIds}
							categories={categories}
							myCategories={myCategories}
							submitting={submitting}
							updateRow={updateRow}
							onProjectChange={handleProjectChange}
							onTaskChange={handleTaskChange}
							onCategorySelectChange={handleCategorySelectChange}
							onRemoveRow={handleRemoveRow}
							onManageCategories={() => setManageCategoriesOpen(true)}
						/>
					))}

					{!isEdit && (
						<Button
							startIcon={<AddIcon />}
							onClick={handleAddRow}
							disabled={submitting}
							sx={{ alignSelf: 'flex-start', fontWeight: 600, borderRadius: '8px' }}
						>
							Add Another Row
						</Button>
					)}
				</Stack>
			</BaseDialog>

			<ConfirmationDialog
				open={confirmDeleteOpen}
				onClose={() => setConfirmDeleteOpen(false)}
				onConfirm={handleDelete}
				title="Delete Time Entry"
				message={`Are you sure you want to delete this ${log?.hours ?? ''}h entry for ${log?.log_date ?? 'this day'}? This cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>

			<AddCategoryDialog
				open={newCategoryDialogOpen}
				onClose={() => {
					setNewCategoryDialogOpen(false);
					setNewCategoryRowKey(null);
				}}
				name={newCategoryName}
				onNameChange={setNewCategoryName}
				color={newCategoryColor}
				onColorChange={setNewCategoryColor}
				error={categoryError}
				creating={creatingCategory}
				onCreate={handleCreateCategory}
			/>

			<ManageCategoriesDialog
				open={manageCategoriesOpen}
				onClose={() => setManageCategoriesOpen(false)}
				categories={myCategories}
				deleteTarget={deleteCategoryTarget}
				onRequestDelete={setDeleteCategoryTarget}
				onCancelDelete={() => setDeleteCategoryTarget(null)}
				onConfirmDelete={handleConfirmDeleteCategory}
				deleting={deletingCategory}
			/>
		</>
	);
};

export default TimeLogEntryFormDialog;
