import React from 'react';
import { TableRow, TableCell, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../common/table/DataTable';
import type { Company } from '../../../../models/company';

interface DealsTabProps {
	company: Company;
	columns: any[];
}

const DealsTab: React.FC<DealsTabProps> = ({ company, columns }) => {
	const navigate = useNavigate();

	return (
		<DataTable
			columns={columns}
			data={company.deals || []}
			totalCount={company.deals?.length || 0}
			page={0}
			rowsPerPage={100}
			onPageChange={() => { }}
			onRowsPerPageChange={() => { }}
			searchTerm=""
			onCreateClick={() => navigate('/crm/deals')}
			createButtonText="New Deal Opportunity"
			canCreate={true}
			emptyMessage="No deals associated with this company."
			headerActions={
				<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
					Deals ({company.deals?.length || 0})
				</Typography>
			}
			renderRow={(row: any) => (
				<TableRow key={row.id || row.public_id}>
					{columns.map((col: any) => (
						<TableCell key={col.id} align={col.align}>
							{col.format ? col.format(row[col.id], row) : (row[col.id] || '—')}
						</TableCell>
					))}
				</TableRow>
			)}
		/>
	);
};

export default DealsTab;
