import React from 'react';
import { TableRow, TableCell, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../common/table/DataTable';
import type { Company } from '../../../../models/company';

interface LeadsTabProps {
	company: Company;
	columns: any[];
}

const LeadsTab: React.FC<LeadsTabProps> = ({ company, columns }) => {
	const navigate = useNavigate();

	return (
		<DataTable
			columns={columns}
			data={company.leads || []}
			totalCount={company.leads?.length || 0}
			page={0}
			rowsPerPage={100}
			onPageChange={() => { }}
			onRowsPerPageChange={() => { }}
			searchTerm=""
			onCreateClick={() => navigate('/crm/leads')}
			createButtonText="Create New Lead"
			canCreate={true}
			emptyMessage="No leads associated with this company."
			headerActions={
				<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
					Leads ({company.leads?.length || 0})
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

export default LeadsTab;
