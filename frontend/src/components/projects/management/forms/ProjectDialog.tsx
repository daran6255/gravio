import React, { useMemo } from 'react';
import { Dialog, Fade } from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import type { ProjectDialogProps } from './types';
import { useProjectForm } from '../hooks/useProjectForm';
import ProjectFormFields from './ProjectFormFields';
import { useAppSelector } from '../../../../store/hooks';

/**
 * ProjectDialog Component.
 * Orchestrates the project lifecycle configuration using EnterpriseForm architecture.
 */
const ProjectDialog: React.FC<ProjectDialogProps> = (props) => {
	const { open, project, onClose, onDelete } = props;
	const { user: currentUser } = useAppSelector((state) => state.auth);
	const isAdmin = currentUser?.role === 'admin';

	const {
		formData,
		submitting,
		error,
		users,
		batches,
		loadingUsers,
		loadingBatches,
		handleChange,
		handleSubmit
	} = useProjectForm(props);

	const steps = useMemo((): FormStep[] => [
		{
			label: 'Project Configuration',
			description: 'Setup project identity and classification',
			content: (
				<ProjectFormFields
					formData={formData}
					handleChange={handleChange}
					users={users}
					batches={batches}
					loadingUsers={loadingUsers}
					loadingBatches={loadingBatches}
					mode={project ? 'edit' : 'create'}
					submitting={submitting}
				/>
			)
		}
	], [formData, handleChange, users, batches, loadingUsers, loadingBatches, project, submitting]);

	const handleDelete = () => {
		if (project && onDelete && isAdmin) {
			onDelete(project);
			onClose();
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			TransitionComponent={Fade}
			TransitionProps={{ timeout: 400 }}
			PaperProps={{
				sx: {
					borderRadius: 0,
					boxShadow: 'none',
					bgcolor: 'transparent'
				}
			}}
		>
			<EnterpriseForm
				title={project ? 'Governance: Project Context' : 'Initialize Organizational Project'}
				subtitle={project ? `Refining operational parameters for: ${project.name}` : 'Establish a new domain for organizational activity tracking'}
				mode={project ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSubmit}
				onCancel={onClose}
				onDelete={project && isAdmin ? handleDelete : undefined}
				isSubmitting={submitting}
				saveButtonText={project ? 'Commit Changes' : 'Initialize Project'}
				error={error}
			/>
		</Dialog>
	);
};

export default ProjectDialog;
