import React, { useState } from 'react';
import {
	Box,
	Container,
	Typography,
	Button
} from '@mui/material';
import {
	Add as AddIcon,
	CloudUpload as ImportIcon
} from '@mui/icons-material';
import type { DSRProject } from '../../models/dsr';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProject, deleteProject } from '../../store/slices/dsrSlice';
import useToast from '../../hooks/useToast';
import dsrProjectService from '../../services/dsrProjectService';
import ProjectTable from '../../components/projects/management/table/ProjectTable';
import ProjectDialog from '../../components/projects/management/forms/ProjectDialog';
import { ConfirmationDialog, ImportDialog } from '../../components/common/dialogbox';
import ProjectStats from '../../components/projects/management/stats/ProjectStats';

const ProjectManagement: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { loading } = useAppSelector((state) => state.dsr);
	const { user } = useAppSelector((state) => state.auth);
	const isPrivileged = user?.role === 'admin' || user?.role === 'manager';

	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedProject, setSelectedProject] = useState<DSRProject | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<DSRProject | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
	const [maintenanceLoading, setMaintenanceLoading] = useState(false);

	const handleAdd = () => {
		setSelectedProject(null);
		setDialogOpen(true);
	};

	const handleEdit = (project: DSRProject) => {
		setSelectedProject(project);
		setDialogOpen(true);
	};

	const handleDeleteRequest = (project: DSRProject) => {
		setProjectToDelete(project);
		setConfirmOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!projectToDelete) return;
		try {
			if (user?.role === 'admin') {
				await dispatch(deleteProject(projectToDelete.public_id)).unwrap();
				toast.success('Project deleted successfully');
			} else {
				await dispatch(updateProject({
					publicId: projectToDelete.public_id,
					data: { is_active: false }
				})).unwrap();
				toast.success('Project deactivated successfully');
			}
			setRefreshKey(prev => prev + 1);
		} catch (error: any) {
			toast.error(error || 'Failed to process project deletion');
		} finally {
			setConfirmOpen(false);
		}
	};

	const handleClearDataConfirm = async () => {
		setMaintenanceLoading(true);
		try {
			await dsrProjectService.clearAllDsrData();
			toast.success('All DSR data cleared successfully');
			setRefreshKey(prev => prev + 1);
		} catch (error: any) {
			toast.error(error?.response?.data?.detail || 'Failed to clear DSR data');
		} finally {
			setMaintenanceLoading(false);
			setMaintenanceConfirmOpen(false);
		}
	};

	const handleImport = async (file: File) => {
		try {
			await dsrProjectService.importFromExcel(file);
			toast.success('Projects imported successfully');
			setRefreshKey(prev => prev + 1);
			setImportModalOpen(false);
		} catch (error: any) {
			toast.error(error?.response?.data?.detail || 'Failed to import projects');
		}
	};

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
				<Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Box>
						<Typography variant="h4" sx={{ fontWeight: 300, color: 'text.primary', mb: 0.5 }}>
							Project Management
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Manage projects and assign owners for DSR tracking
						</Typography>
					</Box>
					{isPrivileged && (
						<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
							<Button
								variant="outlined"
								startIcon={<ImportIcon />}
								onClick={() => setImportModalOpen(true)}
								sx={{
									textTransform: 'none',
									fontWeight: 600,
									fontSize: '0.875rem',
									height: 40,
									color: 'text.primary',
									borderColor: 'divider',
									'&:hover': {
										bgcolor: 'action.hover',
										borderColor: 'text.secondary'
									}
								}}
							>
								Import from Excel
							</Button>
							{user?.role === 'admin' && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setMaintenanceConfirmOpen(true)}
									sx={{
										textTransform: 'none',
										fontSize: '0.875rem',
										fontWeight: 600,
										height: 40,
										'&:hover': {
											bgcolor: 'rgba(239, 68, 68, 0.04)',
										}
									}}
								>
									Clear All DSR Data
								</Button>
							)}
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
								Create project
							</Button>
						</Box>
					)}
				</Box>

				<ProjectStats refreshKey={refreshKey} />

				<ProjectTable
					onEdit={handleEdit}
					onDelete={handleDeleteRequest}
					refreshKey={refreshKey}
				/>

				<ProjectDialog
					open={dialogOpen}
					project={selectedProject}
					onClose={() => setDialogOpen(false)}
					onSuccess={(msg) => {
						toast.success(msg);
						setRefreshKey(prev => prev + 1);
						setDialogOpen(false);
					}}
					onDelete={handleDeleteRequest}
				/>

				<ConfirmationDialog
					open={confirmOpen}
					title={user?.role === 'admin' ? "Delete Project" : "Deactivate Project"}
					message={user?.role === 'admin'
						? `Are you sure you want to PERMANENTLY delete project "${projectToDelete?.name}"? This action cannot be undone if there are no references.`
						: `Are you sure you want to deactivate project "${projectToDelete?.name}"? You can re-activate it later by editing.`
					}
					loading={loading}
					onClose={() => setConfirmOpen(false)}
					onConfirm={handleDeleteConfirm}
					severity={user?.role === 'admin' ? "error" : "warning"}
					confirmLabel={user?.role === 'admin' ? "Delete" : "Deactivate"}
				/>

				<ImportDialog
					open={importModalOpen}
					onClose={() => setImportModalOpen(false)}
					onImport={handleImport}
					title="Import Projects from Excel"
					subtitle="Upload an Excel file with 'name' and 'owner_email' columns to bulk-create projects."
					onDownloadTemplate={() => dsrProjectService.downloadTemplate()}
					loading={loading}
				/>

				<ConfirmationDialog
					open={maintenanceConfirmOpen}
					title="DANGER: Clear All DSR Data"
					message="This will PERMANENTLY delete all Projects, Activities, DSR Entries, and Requests across the entire system. This action is destructive and cannot be undone. Are you absolutely sure?"
					loading={maintenanceLoading}
					confirmLabel="Yes, Wipe All Data"
					onClose={() => setMaintenanceConfirmOpen(false)}
					onConfirm={handleClearDataConfirm}
					severity="error"
				/>
			</Container>
		</Box>
	);
};

export default ProjectManagement;
