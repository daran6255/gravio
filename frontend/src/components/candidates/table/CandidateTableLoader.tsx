import React from 'react';
import { DataTableSkeleton } from '../../common/table';
import { candidateColumns } from './CandidateTableHead';

interface CandidateTableLoaderProps {
	rowsPerPage: number;
}

const CandidateTableLoader: React.FC<CandidateTableLoaderProps> = ({ rowsPerPage }) => {
	return (
		<DataTableSkeleton
			columns={candidateColumns.filter(col => col.id !== 'actions')}
			rowsPerPage={rowsPerPage}
		/>
	);
};

export default CandidateTableLoader;
