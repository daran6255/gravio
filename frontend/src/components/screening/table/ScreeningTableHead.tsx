import React from 'react';
import { DataTableHead, type ColumnDefinition } from '../../common/table';
import type { CandidateListItem } from '../../../models/candidate';

export const getScreeningColumns = (type: 'unscreened' | 'screened'): ColumnDefinition<CandidateListItem>[] => {
	const columns: ColumnDefinition<CandidateListItem>[] = [
		{ id: 'name', label: 'Name', sortable: true, hideOnMobile: false },
		{ id: 'phone', label: 'Phone', sortable: true, hideOnMobile: true },
		{ id: 'disability_type', label: 'Disability', sortable: true, hideOnMobile: true },
		{ id: 'education_level', label: 'Education', sortable: true, hideOnMobile: true },
		{ id: 'district', label: 'Location', sortable: true, hideOnMobile: true },
		{ id: 'created_at', label: 'Date', sortable: true, hideOnMobile: true },
	];

	if (type !== 'unscreened') {
		columns.push({ id: 'screening_status', label: 'Status', sortable: true, hideOnMobile: false });
	}

	columns.push({ id: 'actions', label: 'Actions', sortable: false, align: 'right' });

	return columns;
};

interface ScreeningTableHeadProps {
	type: 'unscreened' | 'screened';
	order: 'asc' | 'desc';
	orderBy: keyof CandidateListItem;
	onRequestSort: (property: keyof CandidateListItem) => void;
}

const ScreeningTableHead: React.FC<ScreeningTableHeadProps> = ({
	type,
	order,
	orderBy,
	onRequestSort
}) => {
	return (
		<DataTableHead
			columns={getScreeningColumns(type)}
			order={order}
			orderBy={orderBy}
			onSortRequest={onRequestSort as any}
		/>
	);
};

export default ScreeningTableHead;
