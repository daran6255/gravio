import React, { useState } from 'react';
import {
	Box,
	Button,
} from '@mui/material';
import {
	Add as AddIcon,
	FileDownload as ExportIcon,
	FileUpload as ImportIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import type { DSRActivity } from '../../models/dsr';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteActivity } from '../../store/slices/dsrSlice';
import useToast from '../../hooks/useToast';
import dsrActivityService from '../../services/dsrActivityService';
import ActivityTable from '../../components/projects/activities/table/ActivityTable';
import ActivityDialog from '../../components/projects/activities/forms/ActivityDialog';
import ActivityStats from '../../components/projects/activities/stats/ActivityStats';
import ActivityModuleLayout from '../../components/projects/activities/layout/ActivityModuleLayout';
import { ConfirmationDialog, ImportDialog, ExportDialog } from '../../components/common/dialogbox';

/**
 * ActivityPlanning - Modernized Enterprise Module
 * Features standardized high-fidelity dialogs for all data operations.
 */
const ActivityPlanning: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [searchParams] = useSearchParams();
	const projectId = searchParams.get('projectId');

	const { user } = useAppSelector((state) => state.auth);
	const { projects } = useAppSelector((state) => state.dsr);
	const project = projects.find(p => p.public_id === projectId);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<DSRActivity | null>(null);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [exporting, setExporting] = useState(false);
	const [confirmExportOpen, setConfirmExportOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState<DSRActivity | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Permission Logic: admin, manager, or project owner
	const isAdmin = user?.role === 'admin';
	const isManager = user?.role === 'manager';
	const isOwner = !!(project && user && (project.owner?.public_id === user.public_id || project.owner_id === user.id));
	const canEdit = !!(isAdmin || isManager || isOwner);

	const handleAdd = () => {
		setSelectedActivity(null);
		setDialogOpen(true);
	};

	const handleEdit = (activity: DSRActivity) => {
		setSelectedActivity(activity);
		setDialogOpen(true);
	};

	const handleDelete = (activity: DSRActivity) => {
		setActivityToDelete(activity);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!activityToDelete) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteActivity(activityToDelete.public_id)).unwrap();
			toast.success('Activity deleted successfully');
			setRefreshKey(prev => prev + 1);
			setDeleteDialogOpen(false);
		} catch (error: any) {
			toast.error(error || 'Failed to delete activity');
		} finally {
			setDeleteLoading(false);
			setActivityToDelete(null);
		}
	};

	const handleExport = async (format: 'excel' | 'csv') => {
		if (!projectId) return;
		setConfirmExportOpen(false);
		setExporting(true);
		try {
			await dsrActivityService.exportActivities(projectId);
			toast.success(`Activities exported successfully as ${format.toUpperCase()}`);
		} catch (error) {
			toast.error('Failed to export activities');
		} finally {
			setExporting(false);
		}
	};

	const handleImport = async (file: File) => {
		if (!projectId) return;
		try {
			await dsrActivityService.importFromExcel(file, projectId);
			toast.success('Activities imported successfully');
			setRefreshKey(prev => prev + 1);
			setImportModalOpen(false);
		} catch (error) {
			toast.error('Import failed. Please verify the file structure.');
		}
	};

	return (
		<ActivityModuleLayout
			title="Activity Planning"
			subtitle="Define and manage project-specific work items and timelines"
		>
			{({ selectedProject }) => (
				<Box>
					<Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
						{canEdit && (
							<Box sx={{ display: 'flex', gap: 1.5 }}>
								<Button
									variant="outlined"
									onClick={() => setConfirmExportOpen(true)}
									disabled={exporting}
									startIcon={<ExportIcon />}
									sx={{
										color: 'text.secondary',
										borderColor: 'divider',
										textTransform: 'none',
										fontWeight: 700,
										fontSize: '0.875rem',
										px: 2.5,
										height: 38,
										borderRadius: '4px',
										'&:hover': {
											bgcolor: 'action.hover',
											borderColor: 'text.primary',
											color: 'text.primary'
										}
									}}
								>
									{exporting ? 'Exporting...' : 'Export Results'}
								</Button>
								<Button
									variant="outlined"
									onClick={() => setImportModalOpen(true)}
									startIcon={<ImportIcon />}
									sx={{
										color: 'text.secondary',
										borderColor: 'divider',
										textTransform: 'none',
										fontWeight: 700,
										fontSize: '0.875rem',
										px: 2.5,
										height: 38,
										borderRadius: '4px',
										'&:hover': {
											bgcolor: 'action.hover',
											borderColor: 'text.primary',
											color: 'text.primary'
										}
									}}
								>
									Import Excel
								</Button>
								<Button
									variant="contained"
									startIcon={<AddIcon />}
									onClick={handleAdd}
									sx={{
										bgcolor: 'primary.main',
										textTransform: 'none',
										fontWeight: 700,
										fontSize: '0.875rem',
										px: 3,
										height: 38,
										borderRadius: '4px',
										boxShadow: 'none',
										'&:hover': { 
											bgcolor: 'primary.dark',
											boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
										}
									}}
								>
									Add Activity
								</Button>
							</Box>
						)}
					</Box>

					<ActivityStats projectId={selectedProject.public_id} refreshKey={refreshKey} />

					<ActivityTable
						projectId={selectedProject.public_id}
						onEdit={handleEdit}
						onDelete={handleDelete}
						refreshKey={refreshKey}
						canEdit={canEdit}
					/>

					<ActivityDialog
						open={dialogOpen}
						activity={selectedActivity}
						projectId={selectedProject.public_id}
						onClose={() => setDialogOpen(false)}
						onSuccess={() => {
							toast.success(selectedActivity ? 'Activity updated' : 'Activity created');
							setRefreshKey(prev => prev + 1);
							setDialogOpen(false);
						}}
					/>

					<ImportDialog
						open={importModalOpen}
						onClose={() => setImportModalOpen(false)}
						onImport={handleImport}
						title="Import Project Activities"
						subtitle="Upload structured planning data to synchronize with the core engine"
						onDownloadTemplate={dsrActivityService.downloadTemplate}
						loading={false}
					/>

					<ConfirmationDialog
						open={deleteDialogOpen}
						title="Delete Activity"
						subtitle="Permanent Removal"
						message={`Are you sure you want to delete "${activityToDelete?.name}"? This action cannot be undone and will affect project metrics.`}
						onClose={() => setDeleteDialogOpen(false)}
						onConfirm={handleConfirmDelete}
						confirmLabel="Delete Activity"
						severity="error"
						loading={deleteLoading}
					/>

					<ExportDialog
						open={confirmExportOpen}
						title="Export Project Activities"
						subtitle="Select your preferred format for data extraction"
						onClose={() => setConfirmExportOpen(false)}
						onExport={handleExport}
						loading={exporting}
					/>
				</Box>
			)}
		</ActivityModuleLayout>
	);
};

export default ActivityPlanning;
