import React from 'react';
import { Delete } from '@mui/icons-material';
import { DataTableActions, type TableMenuAction } from '../../common/table';
import type { CandidateListItem } from '../../../models/candidate';

interface CandidateTableActionsProps {
	candidate: CandidateListItem;
	userRole: string | null;
	onDelete: (candidate: CandidateListItem) => void;
}

const CandidateTableActions: React.FC<CandidateTableActionsProps> = ({
	candidate,
	userRole,
	onDelete
}) => {
	const isAdmin = userRole === 'admin';

	const actions: TableMenuAction<CandidateListItem>[] = [
		{
			label: 'Delete Candidate',
			icon: <Delete fontSize="small" />,
			onClick: (item) => onDelete(item),
			color: 'error.main',
			hidden: !isAdmin,
			divider: false
		}
	];

	return (
		<DataTableActions
			item={candidate}
			actions={actions}
			menuId={`candidate-actions-${candidate.public_id}`}
		/>
	);
};

export default CandidateTableActions;
