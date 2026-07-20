import React, { useMemo } from 'react';
import { Button, Stack, Box, Alert, CircularProgress, Grid, Typography, alpha, ButtonBase } from '@mui/material';
import {
	Add as AddIcon,
	DeleteOutline as DeleteIcon,
	AssignmentOutlined as ProjectTaskIcon,
	AllInboxOutlined as GeneralIcon,
	InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';
import { useAppSelector } from '../../../store/hooks';
import { TimeLogRowFields, AddCategoryDialog, ManageCategoriesDialog } from './components';
import { useTimeLogRows } from './hooks/useTimeLogRows';
import { useTimeLogSubmit } from './hooks/useTimeLogSubmit';
import { useTimesheetCategories } from './hooks/useTimesheetCategories';
import { makeEmptyRow } from './utils';
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
		getVisibleTasks,
		isRowTasksLoading,
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

	const isSelectionStep = useMemo(() => {
		if (isEdit) return false;
		return rows[0]?.logAgainst === '';
	}, [isEdit, rows]);

	const dialogTitle = useMemo(() => {
		if (isEdit) {
			return rows[0]?.logAgainst === 'general' ? 'Edit General Time' : 'Edit Project Time';
		}
		if (isSelectionStep) return 'Log Time';
		return rows[0]?.logAgainst === 'general' ? 'Log General Time' : 'Log Project Time';
	}, [isEdit, isSelectionStep, rows]);

	const dialogSubtitle = useMemo(() => {
		if (isEdit) return undefined;
		if (isSelectionStep) return 'What type of activity are you logging hours for?';
		return rows[0]?.logAgainst === 'general'
			? 'Log internal activities, meetings, training, or leaves'
			: 'Log hours against active projects and tasks assigned to you';
	}, [isEdit, isSelectionStep, rows]);

	return (
		<>
			<BaseDialog
				open={open}
				onClose={onClose}
				title={dialogTitle}
				subtitle={dialogSubtitle}
				maxWidth={isSelectionStep ? 'sm' : 'sm'}
				loading={submitting}
				actions={
					isSelectionStep ? (
						<Button onClick={onClose} disabled={submitting} sx={{ minWidth: 100 }}>
							Cancel
						</Button>
					) : (
						<Box
							sx={{
								display: 'flex',
								flexDirection: { xs: 'column', sm: 'row' },
								justifyContent: 'space-between',
								alignItems: { xs: 'stretch', sm: 'center' },
								gap: 1,
								width: '100%'
							}}
						>
							<Box>
								{canDelete && (
									<Button
										color="error"
										startIcon={<DeleteIcon />}
										onClick={() => setConfirmDeleteOpen(true)}
										disabled={submitting}
										fullWidth
										sx={{ fontWeight: 700, borderRadius: 4, width: { xs: '100%', sm: 'auto' } }}
									>
										Delete
									</Button>
								)}
							</Box>
							<Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
								{!isEdit && (
									<Button
										onClick={() => setRows([makeEmptyRow(defaultDate, '')])}
										disabled={submitting}
										variant="outlined"
										color="secondary"
										sx={{ fontWeight: 700, borderRadius: 4 }}
									>
										Back
									</Button>
								)}
								<Button onClick={onClose} disabled={submitting}>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={handleSubmit}
									disabled={submitting}
									sx={{ fontWeight: 700, borderRadius: 4, minWidth: 120 }}
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
					)
				}
			>
				{isSelectionStep ? (
					<Grid container spacing={3} sx={{ py: 1 }}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<ButtonBase
								onClick={() => updateRow(rows[0].key, { logAgainst: 'project_task' })}
								disabled={submitting}
								sx={{
									width: '100%',
									height: '100%',
									p: 3,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									borderRadius: '16px',
									border: '1.5px solid',
									borderColor: 'divider',
									bgcolor: 'background.paper',
									boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.03)}`,
									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'&:hover': {
										borderColor: 'primary.main',
										transform: 'translateY(-4px)',
										boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
										bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
										'& .icon-container': {
											bgcolor: 'primary.main',
											color: 'primary.contrastText',
											transform: 'scale(1.1)',
										}
									}
								}}
							>
								<Box
									className="icon-container"
									sx={{
										width: 64,
										height: 64,
										borderRadius: '50%',
										bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
										color: 'primary.main',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										mb: 2.5,
										transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									}}
								>
									<ProjectTaskIcon sx={{ fontSize: 32 }} />
								</Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
									Project Task
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', px: 1, lineHeight: 1.4 }}>
									Log hours against specific client projects and tasks assigned to you.
								</Typography>
							</ButtonBase>
						</Grid>
						
						<Grid size={{ xs: 12, sm: 6 }}>
							<ButtonBase
								onClick={() => updateRow(rows[0].key, { logAgainst: 'general' })}
								disabled={submitting}
								sx={{
									width: '100%',
									height: '100%',
									p: 3,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									borderRadius: '16px',
									border: '1.5px solid',
									borderColor: 'divider',
									bgcolor: 'background.paper',
									boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.03)}`,
									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'&:hover': {
										borderColor: 'info.main',
										transform: 'translateY(-4px)',
										boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.info.main, 0.12)}`,
										bgcolor: (theme) => alpha(theme.palette.info.main, 0.02),
										'& .icon-container': {
											bgcolor: 'info.main',
											color: 'info.contrastText',
											transform: 'scale(1.1)',
										}
									}
								}}
							>
								<Box
									className="icon-container"
									sx={{
										width: 64,
										height: 64,
										borderRadius: '50%',
										bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
										color: 'info.main',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										mb: 2.5,
										transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									}}
								>
									<GeneralIcon sx={{ fontSize: 32 }} />
								</Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
									General Activity
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', px: 1, lineHeight: 1.4 }}>
									Log internal time such as training, organization meetings, admin, or leaves.
								</Typography>
							</ButtonBase>
						</Grid>
					</Grid>
				) : (
					<Stack spacing={2.5}>
						{error && (
							<Alert severity="error" sx={{ borderRadius: 4 }}>
								{error}
							</Alert>
						)}

						{rows[0]?.logAgainst === 'project_task' ? (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 2,
									p: 2,
									borderRadius: '12px',
									bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
									border: '1px solid',
									borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: 36,
										height: 36,
										borderRadius: '50%',
										bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
										color: 'primary.main',
										flexShrink: 0
									}}
								>
									<InfoIcon fontSize="small" />
								</Box>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.25 }}>
										Logging Project Hours
									</Typography>
									<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
										Associate your time with specific client projects and tasks assigned to you. This data is used for billing and tracking.
									</Typography>
								</Box>
							</Box>
						) : rows[0]?.logAgainst === 'general' ? (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 2,
									p: 2,
									borderRadius: '12px',
									bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
									border: '1px solid',
									borderColor: (theme) => alpha(theme.palette.info.main, 0.15),
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: 36,
										height: 36,
										borderRadius: '50%',
										bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
										color: 'info.main',
										flexShrink: 0
									}}
								>
									<InfoIcon fontSize="small" />
								</Box>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.25 }}>
										Logging General Hours
									</Typography>
									<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
										Log hours for internal activities like training, organization meetings, admin work, or company holidays.
									</Typography>
								</Box>
							</Box>
						) : null}

						{rows.map((row, idx) => (
							<TimeLogRowFields
								key={row.key}
								row={row}
								rowIndex={idx}
								totalRows={rows.length}
								hasProjectModule={hasProjectModule}
								visibleProjects={visibleProjects}
								getVisibleTasks={getVisibleTasks}
								tasksLoading={isRowTasksLoading(row)}
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
								variant="contained"
								startIcon={<AddIcon />}
								onClick={handleAddRow}
								disabled={submitting}
								sx={(theme) => ({
									alignSelf: 'flex-start',
									fontWeight: 700,
									borderRadius: '10px',
									px: 3,
									py: 1,
									background: theme.gradients.brandDiagonal,
									boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
									border: 'none',
									textTransform: 'none',
									transition: 'all 0.2s ease',
									'&:hover': {
										background: theme.gradients.brandDiagonalHover,
										boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.6)}`,
										transform: 'translateY(-1px)',
									},
								})}
							>
								Add Another Row
							</Button>
						)}
					</Stack>
				)}
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
