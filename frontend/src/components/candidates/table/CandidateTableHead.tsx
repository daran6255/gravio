import React from 'react';
import { DataTableHead, type ColumnDefinition } from '../../common/table';
import type { CandidateListItem } from '../../../models/candidate';

export const candidateColumns: ColumnDefinition<CandidateListItem>[] = [
	{ id: 'name', label: 'Name', sortable: true, hideOnMobile: false },
	{ id: 'email', label: 'Email', sortable: true, hideOnMobile: true },
	{ id: 'phone', label: 'Phone', sortable: true, hideOnMobile: true },
	{ id: 'city', label: 'Location', sortable: true, hideOnMobile: true },
	{ id: 'assigned_to_name', label: 'Assigned To', sortable: true, hideOnMobile: true },
	{ id: 'disability_type', label: 'Disability', sortable: true, hideOnMobile: false },
	{ id: 'registration_type', label: 'Source', sortable: true, hideOnMobile: false },
	{ id: 'created_at', label: 'Date', sortable: true, hideOnMobile: true },
	{ id: 'actions', label: 'Actions', sortable: false, align: 'right' }
];

interface CandidateTableHeadProps {
	order: 'asc' | 'desc';
	orderBy: keyof CandidateListItem;
	onRequestSort: (property: keyof CandidateListItem) => void;
}

const CandidateTableHead: React.FC<CandidateTableHeadProps> = ({
	order,
	orderBy,
	onRequestSort
}) => {
	return (
		<DataTableHead
			columns={candidateColumns}
			order={order}
			orderBy={orderBy}
			onSortRequest={onRequestSort as any}
		/>
	);
};

export default CandidateTableHead;
