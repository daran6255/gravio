import React, { useState, useEffect } from 'react';
import { Box, Container, Stack, Skeleton, Button, alpha, useTheme } from '@mui/material';
import { Add as AddIcon, PlayArrow as LaunchIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { responsiveStyles } from '../../../theme';
import {
	fetchChecklistTemplates, createChecklistTemplate, deleteChecklistTemplate,
	fetchChecklistInstances, toggleChecklistTask, deleteChecklistInstance,
	fetchEmployees
} from '../../../store/slices/hrSlice';
import type { HRChecklistTemplate, HRChecklistInstance } from '../../../models/hr';
import useToast from '../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import ConfirmationDialog from '../../../components/common/dialogbox/ConfirmationDialog';
import {
	LifecycleTabs, type LifecycleTab,
	LifecycleStatsBar,
	TrackersGrid,
	TemplatesGrid,
	TemplateDialog,
	LaunchChecklistDialog,
	TrackerDetailDialog,
	DEFAULT_CHECKLIST_TEMPLATES,
} from '../../../components/hr/admin/lifecycle';

const ChecklistPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin';
	const canManageTrackers = isAdminOrHR || currentUser?.role === 'hr_manager';

	const {
		checklistTemplates: templates, checklistTemplatesLoading,
		checklistInstances: instances, checklistInstancesLoading,
		employees, employeesLoading
	} = useAppSelector((state) => state.hr);
	const [tab, setTab] = useState<LifecycleTab>('trackers');
	const loading = checklistTemplatesLoading || checklistInstancesLoading || employeesLoading;

	const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
	const [editTemplate, setEditTemplate] = useState<HRChecklistTemplate | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HRChecklistTemplate | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [seeding, setSeeding] = useState(false);

	const [deleteInstanceTarget, setDeleteInstanceTarget] = useState<HRChecklistInstance | null>(null);
	const [deletingInstance, setDeletingInstance] = useState(false);

	const [launchDialogOpen, setLaunchDialogOpen] = useState(false);

	const [instanceDetailOpen, setInstanceDetailOpen] = useState(false);
	const [activeInstance, setActiveInstance] = useState<HRChecklistInstance | null>(null);
	// HRChecklistInstance only carries template_id/template_name -- the task list
	// itself lives on the template, so look it up from the templates already loaded.
	const activeTemplate = activeInstance ? templates.find(t => t.id === activeInstance.template_id) : undefined;

	const fetchData = () => {
		dispatch(fetchChecklistTemplates()).unwrap().catch(() => error('Failed to load checklist templates'));
		dispatch(fetchChecklistInstances()).unwrap().catch(() => error('Failed to load checklist trackers'));
		dispatch(fetchEmployees({ limit: 100 }));
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleOpenTemplateDialog = (tmpl?: HRChecklistTemplate) => {
		setEditTemplate(tmpl || null);
		setTemplateDialogOpen(true);
	};

	const handleSeedDefaults = async () => {
		setSeeding(true);
		try {
			for (const tmpl of DEFAULT_CHECKLIST_TEMPLATES) {
				await dispatch(createChecklistTemplate({
					name: tmpl.name,
					checklist_type: tmpl.checklist_type,
					tasks: tmpl.tasks,
					is_active: true,
				})).unwrap();
			}
			success('Sample templates added');
		} catch {
			error('Some sample templates could not be added');
		} finally {
			setSeeding(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteChecklistTemplate(deleteTarget.id)).unwrap();
			success('Template deleted');
			setDeleteTarget(null);
		} catch (e: any) {
			error('Failed to delete template');
		} finally {
			setDeleting(false);
		}
	};

	const handleConfirmDeleteInstance = async () => {
		if (!deleteInstanceTarget) return;
		setDeletingInstance(true);
		try {
			await dispatch(deleteChecklistInstance(deleteInstanceTarget.id)).unwrap();
			success('Checklist tracker deleted');
			setDeleteInstanceTarget(null);
		} catch (e: any) {
			error('Failed to delete checklist tracker');
		} finally {
			setDeletingInstance(false);
		}
	};

	// Task Toggle Handler inside instance
	const handleToggleTask = async (taskId: string, currentlyCompleted: boolean) => {
		if (!activeInstance) return;
		try {
			const updated = await dispatch(toggleChecklistTask({
				id: activeInstance.id,
				taskId,
				completed: !currentlyCompleted
			})).unwrap();
			// Refresh activeInstance in modal (the response doesn't carry the display-only
			// fields joined in list(), so keep them from what was already shown)
			setActiveInstance({
				...updated,
				employee_name: activeInstance.employee_name,
				template_name: activeInstance.template_name,
				checklist_type: activeInstance.checklist_type
			});
			success(currentlyCompleted ? 'Task marked incomplete' : 'Task completed!');
		} catch (e: any) {
			error('Failed to update task state');
		}
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Lifecycle Checklists"
						subtitle="Track employee onboarding tasks and offboarding clearances."
						action={
							<Stack direction="row" spacing={1.5}>
								<Button
									variant="outlined"
									color="primary"
									startIcon={<LaunchIcon />}
									onClick={() => setLaunchDialogOpen(true)}
									sx={{ borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none' }}
								>
									Launch Checklist
								</Button>
								{isAdminOrHR && (
									<Button
										variant="contained"
										startIcon={<AddIcon />}
										onClick={() => handleOpenTemplateDialog()}
										sx={{
											borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none', color: 'white',
											boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
											background: theme.gradients.brand,
											'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
										}}
									>
										New Template
									</Button>
								)}
							</Stack>
						}
					/>

					{loading ? (
						<Stack spacing={3}>
							<Skeleton variant="rounded" height={120} />
							<Skeleton variant="rounded" height={200} />
						</Stack>
					) : (
						<Stack spacing={3.5}>
							<LifecycleStatsBar instances={instances} templates={templates} />

							<LifecycleTabs
								value={tab}
								onChange={setTab}
								trackersCount={instances.length}
								templatesCount={templates.length}
							/>

							{tab === 'trackers' ? (
								<TrackersGrid
									instances={instances}
									canManage={canManageTrackers}
									onSelect={(inst) => { setActiveInstance(inst); setInstanceDetailOpen(true); }}
									onDelete={(inst) => setDeleteInstanceTarget(inst)}
									onLaunchClick={() => setLaunchDialogOpen(true)}
								/>
							) : (
								<TemplatesGrid
									templates={templates}
									canManage={isAdminOrHR}
									onCreateClick={() => handleOpenTemplateDialog()}
									onEdit={(tmpl) => handleOpenTemplateDialog(tmpl)}
									onDelete={(tmpl) => setDeleteTarget(tmpl)}
									onSeedDefaults={handleSeedDefaults}
									seeding={seeding}
								/>
							)}
						</Stack>
					)}

					<TemplateDialog
						open={templateDialogOpen}
						onClose={() => setTemplateDialogOpen(false)}
						onSaved={fetchData}
						existing={editTemplate}
					/>

					<LaunchChecklistDialog
						open={launchDialogOpen}
						onClose={() => setLaunchDialogOpen(false)}
						onLaunched={fetchData}
						employees={employees}
						templates={templates}
					/>

					<TrackerDetailDialog
						open={instanceDetailOpen}
						onClose={() => setInstanceDetailOpen(false)}
						instance={activeInstance}
						template={activeTemplate}
						onToggleTask={handleToggleTask}
					/>

					<ConfirmationDialog
						open={!!deleteTarget}
						onClose={() => setDeleteTarget(null)}
						onConfirm={handleConfirmDelete}
						title="Delete Checklist Template"
						message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This won't affect trackers already launched from it.` : ''}
						confirmLabel="Delete"
						severity="error"
						loading={deleting}
					/>

					<ConfirmationDialog
						open={!!deleteInstanceTarget}
						onClose={() => setDeleteInstanceTarget(null)}
						onConfirm={handleConfirmDeleteInstance}
						title="Delete Checklist Tracker"
						message={
							deleteInstanceTarget
								? `Delete the ${deleteInstanceTarget.checklist_type} tracker for "${deleteInstanceTarget.employee_name}"? Use this for trackers launched by mistake — it won't undo any employee status change it already caused.`
								: ''
						}
						confirmLabel="Delete"
						severity="error"
						loading={deletingInstance}
					/>
				</Stack>
			</Container>
		</Box>
	);
};

export default ChecklistPage;
