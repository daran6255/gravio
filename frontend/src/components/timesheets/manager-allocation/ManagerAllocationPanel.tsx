import React from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { ManagerAllocationStats } from './ManagerAllocationStats';
import { ManagerAllocationTable } from './ManagerAllocationTable';
import { useManagerAllocation } from './hooks/useManagerAllocation';

export const ManagerAllocationPanel: React.FC = () => {
	const {
		searchTerm, setSearchTerm,
		selectedIds,
		updatingUserPublicId,
		bulkManagerId, setBulkManagerId,
		bulkLoading,
		roleFilterOnlyManagers, setRoleFilterOnlyManagers,
		filterUnassignedOnly, setFilterUnassignedOnly,
		page, setPage,
		itemsPerPage, setItemsPerPage,
		allUsers,
		usersLoading,
		owners,
		totalTeammates,
		unassignedCount,
		eligibleManagersCount,
		filteredManagers,
		wouldCreateCycle,
		handleManagerChange,
		handleBulkApply,
		handleSelectAll,
		handleSelectRow,
		processedUsers,
		paginatedUsers
	} = useManagerAllocation();

	if (usersLoading && allUsers.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress size={40} />
			</Box>
		);
	}

	return (
		<Stack spacing={3}>
			<ManagerAllocationStats
				totalTeammates={totalTeammates}
				unassignedCount={unassignedCount}
				eligibleManagersCount={eligibleManagersCount}
				filterUnassignedOnly={filterUnassignedOnly}
				onToggleUnassignedFilter={() => setFilterUnassignedOnly(!filterUnassignedOnly)}
			/>

			<ManagerAllocationTable
				users={paginatedUsers}
				owners={owners}
				allUsers={allUsers}
				selectedIds={selectedIds}
				onSelectRow={handleSelectRow}
				onSelectAll={handleSelectAll}
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				roleFilterOnlyManagers={roleFilterOnlyManagers}
				onRoleFilterChange={setRoleFilterOnlyManagers}
				filterUnassignedOnly={filterUnassignedOnly}
				onClearUnassignedFilter={() => setFilterUnassignedOnly(false)}
				updatingUserPublicId={updatingUserPublicId}
				onManagerChange={handleManagerChange}
				bulkManagerId={bulkManagerId}
				onBulkManagerChange={setBulkManagerId}
				bulkLoading={bulkLoading}
				onBulkApply={handleBulkApply}
				wouldCreateCycle={wouldCreateCycle}
				page={page}
				totalCount={processedUsers.length}
				itemsPerPage={itemsPerPage}
				onItemsPerPageChange={setItemsPerPage}
				onPageChange={setPage}
				filteredManagers={filteredManagers}
			/>
		</Stack>
	);
};

export default ManagerAllocationPanel;
