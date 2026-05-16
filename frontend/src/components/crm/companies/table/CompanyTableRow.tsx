import React, { memo } from 'react';
import { TableRow, TableCell, Stack, Typography, Link } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import EnterpriseAvatar from '../../../common/avatar/Avatar';
import StatusBadge from '../../../common/badge/StatusBadge';
import DataTableActions, { type TableMenuAction } from '../../../common/table/DataTableActions';
import { useDateTime } from '../../../../hooks/useDateTime';
import type { Company } from '../../../../models/company';

interface CompanyTableRowProps {
	company: Company;
	isAdmin: boolean;
	onEdit: (company: Company) => void;
	onDelete?: (company: Company) => void;
	onClick: (company: Company) => void;
}

const CompanyTableRow: React.FC<CompanyTableRowProps> = memo(({
	company,
	isAdmin,
	onEdit,
	onDelete,
	onClick,
}) => {
	const { formatDate } = useDateTime();

	const actions: TableMenuAction<Company>[] = [
		{
			label: 'Edit',
			icon: <EditIcon fontSize="small" />,
			onClick: (item) => onEdit(item)
		},
		{
			label: 'Delete',
			icon: <DeleteIcon fontSize="small" />,
			onClick: (item) => onDelete?.(item),
			color: 'error.main',
			hidden: !isAdmin || !onDelete
		}
	];

	return (
		<TableRow
			hover
			tabIndex={-1}
			onClick={() => onClick(company)}
			sx={{
				cursor: 'pointer',
				'&:hover': { bgcolor: 'action.hover' },
				'&:last-child td': { borderBottom: 0 },
			}}
		>
			{/* Company Name */}
			<TableCell>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<EnterpriseAvatar name={company.name} size={28} />
					<Typography
						variant="body2"
						sx={{ fontWeight: 600, color: 'primary.main' }}
					>
						{company.name}
					</Typography>
				</Stack>
			</TableCell>

			{/* Status */}
			<TableCell>
				<StatusBadge label={company.status} status={company.status} type="company" />
			</TableCell>

			{/* Industry */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{company.industry ?? '—'}
				</Typography>
			</TableCell>

			{/* Website */}
			<TableCell>
				{company.website ? (
					<Link
						href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
						target="_blank"
						rel="noopener noreferrer"
						variant="body2"
						color="primary"
						underline="hover"
						onClick={(e) => e.stopPropagation()}
					>
						{company.website}
					</Link>
				) : (
					<Typography variant="body2" color="text.disabled">—</Typography>
				)}
			</TableCell>

			{/* Email */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{company.email ?? '—'}
				</Typography>
			</TableCell>

			{/* Created On */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{formatDate(company.created_at)}
				</Typography>
			</TableCell>

			{/* Actions */}
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<DataTableActions
					item={company}
					actions={actions}
				/>
			</TableCell>
		</TableRow>
	);
});

CompanyTableRow.displayName = 'CompanyTableRow';

export default CompanyTableRow;
