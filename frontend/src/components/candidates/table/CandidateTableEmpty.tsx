import React from 'react';
import { DataTableEmpty } from '../../common/table';
import { candidateColumns } from './CandidateTableHead';

const CandidateTableEmpty: React.FC = () => {
	return (
		<DataTableEmpty
			colSpan={candidateColumns.length}
			message="No candidates found"
			subMessage="Try adjusting your filters or search terms"
		/>
	);
};

export default CandidateTableEmpty;
