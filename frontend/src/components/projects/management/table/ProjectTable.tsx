import type React from 'react';
import { Menu, MenuItem } from '@mui/material';
import type { DSRProject } from '../../../../models/dsr';
import { useProjectTable } from '../hooks/useProjectTable';
import DataTable, { type ColumnDefinition } from '../../../common/table/DataTable';
import ProjectTableRow from './ProjectTableRow';
import ProjectTableActions from './ProjectTableActions';

interface ProjectTableProps {
	onEdit: (project: DSRProject) => void;
	onDelete: (project: DSRProject) => void;
	refreshKey: number;
}

const columns: ColumnDefinition<DSRProject>[] = [
	{ id: 'name', label: 'Project Name' },
	{ id: 'project_type' as any, label: 'Type' },
	{ id: 'linked_batches' as any, label: 'Training Batches' },
	{ id: 'owner' as any, label: 'Owner' },
	{ id: 'creator' as any, label: 'Created By' },
	{ id: 'created_at', label: 'Created At' },
	{ id: 'is_active', label: 'Status' },
	{ id: 'actions', label: 'Actions', align: 'right' }
];

const ProjectTable: React.FC<ProjectTableProps> = ({
	onEdit,
	onDelete,
	refreshKey
}) => {
	const {
		projects,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		statusFilter,
		filterAnchorEl,
		actionAnchorEl,
		activeProject,
		filterOpen,
		actionOpen,
		handlePageChange,
		handleSearch,
		handleFilterClick,
		handleFilterClose,
		handleStatusSelect,
		handleActionClick,
		handleActionClose,
		handleRefresh,
		setRowsPerPage,
		setPage
	} = useProjectTable(refreshKey);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const renderRow = (project: DSRProject) => (
		<ProjectTableRow
			key={project.public_id}
			project={project}
			onActionClick={handleActionClick}
			formatDate={formatDate}
		/>
	);

	const handleRowsChange = (newRows: number) => {
		setRowsPerPage(newRows);
		setPage(0);
	};

	return (
		<>
			<DataTable
				columns={columns}
				data={projects}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsChange}
				searchTerm={searchTerm}
				onSearchChange={(value) => handleSearch({ target: { value } } as any)}
				onRefresh={handleRefresh}
				onFilterOpen={(e: React.MouseEvent<HTMLButtonElement>) => handleFilterClick(e)}
				activeFilterCount={statusFilter === 'all' ? 0 : 1}
				searchPlaceholder="Search projects..."
				renderRow={renderRow}
				emptyMessage={searchTerm ? `No projects found matching "${searchTerm}"` : "No projects registered yet"}
			/>

			<Menu
				anchorEl={filterAnchorEl}
				open={filterOpen}
				onClose={handleFilterClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<MenuItem onClick={() => handleStatusSelect('all')} selected={statusFilter === 'all'}>Status: All</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('active')} selected={statusFilter === 'active'}>Status: Active</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('inactive')} selected={statusFilter === 'inactive'}>Status: Inactive</MenuItem>
			</Menu>

			<ProjectTableActions
				anchorEl={actionAnchorEl}
				open={actionOpen}
				onClose={handleActionClose}
				activeProject={activeProject}
				onEdit={onEdit}
				onDelete={onDelete}
			/>
		</>
	);
};

export default ProjectTable;

