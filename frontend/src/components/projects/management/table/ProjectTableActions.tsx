import React from 'react';
import {
	Menu,
	MenuItem
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import type { DSRProject } from '../../../../models/dsr';

import { useAppSelector } from '../../../../store/hooks';

interface ProjectTableActionsProps {
	anchorEl: null | HTMLElement;
	open: boolean;
	onClose: () => void;
	activeProject: DSRProject | null;
	onEdit: (project: DSRProject) => void;
	onDelete: (project: DSRProject) => void;
}

const ProjectTableActions: React.FC<ProjectTableActionsProps> = ({
	anchorEl,
	open,
	onClose,
	activeProject,
	onEdit,
	onDelete
}) => {
	const { user } = useAppSelector((state) => state.auth);
	const isPrivileged = user?.role === 'admin' || user?.role === 'manager';

	if (!activeProject) return null;

	return (
		<Menu
			anchorEl={anchorEl}
			open={open}
			onClose={onClose}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			transformOrigin={{ vertical: 'top', horizontal: 'right' }}
		>
			{isPrivileged && (
				<MenuItem onClick={() => { onEdit(activeProject); onClose(); }}>
					<EditIcon sx={{ fontSize: 18, mr: 1, color: '#545b64' }} />
					Edit
				</MenuItem>
			)}
			{user?.role === 'admin' && (
				<MenuItem onClick={() => { onDelete(activeProject); onClose(); }} sx={{ color: '#d13212' }}>
					<DeleteIcon sx={{ fontSize: 18, mr: 1, color: '#d13212' }} />
					Delete
				</MenuItem>
			)}
		</Menu>
	);
};

export default ProjectTableActions;
