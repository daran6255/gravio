import React, { useState, useEffect, useMemo } from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeamUsers, updateTeamUser } from '../../../store/slices/userSlice';
import { fetchOwners } from '../../../store/slices/crmSlice';
import useToast from '../../../hooks/useToast';
import type { TeamMember } from '../../../models/user';
import { ManagerAllocationStats } from './ManagerAllocationStats';
import { ManagerAllocationTable } from './ManagerAllocationTable';

export const ManagerAllocationPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();

	// Redux state
	const { users: allUsers, loading: usersLoading } = useAppSelector((state) => state.users);
	const { owners } = useAppSelector((state) => state.crm);

	// Local state
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [updatingUserPublicId, setUpdatingUserPublicId] = useState<string | null>(null);
	const [bulkManagerId, setBulkManagerId] = useState<number | ''>('');
	const [bulkLoading, setBulkLoading] = useState(false);
	const [roleFilterOnlyManagers, setRoleFilterOnlyManagers] = useState(true);
	const [filterUnassignedOnly, setFilterUnassignedOnly] = useState(false);
	
	// Pagination state
	const [page, setPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Stats calculations
	const totalTeammates = allUsers.length;
	const unassignedCount = allUsers.filter((u) => u.reporting_manager_id === null).length;
	const eligibleManagersCount = allUsers.filter((u) => u.role === 'admin' || u.role === 'manager').length;

	// Fetch all users and managers on mount
	useEffect(() => {
		dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		dispatch(fetchOwners());
	}, [dispatch]);

	// Filter managers by role if filter is active
	const filteredManagers = useMemo(() => {
		if (!roleFilterOnlyManagers) return owners;
		
		// Find user emails that are admin or manager
		const adminOrManagerEmails = new Set(
			allUsers
				.filter(u => u.role === 'admin' || u.role === 'manager')
				.map(u => u.email)
		);

		return owners.filter(o => adminOrManagerEmails.has(o.email));
	}, [owners, allUsers, roleFilterOnlyManagers]);

	// Trace reporting manager chain to detect circular reporting. Only flags a cycle
	// when the chain leads back to `employeeEmail` specifically -- a self-managing
	// terminal node (someone who reports to themselves, e.g. a sole admin with no
	// other manager) is a valid dead end for anyone walking *through* it, not a loop.
	const wouldCreateCycle = (employeeEmail: string, potentialManagerId: number | ''): boolean => {
		if (!potentialManagerId) return false;

		const targetManager = owners.find(o => o.id === potentialManagerId);
		if (!targetManager) return false;

		if (employeeEmail === targetManager.email) return true;

		const visited = new Set<string>();
		let currentEmail = targetManager.email;

		while (currentEmail) {
			if (currentEmail === employeeEmail) {
				return true;
			}
			if (visited.has(currentEmail)) {
				// Hit an unrelated repeat (e.g. someone else's self-managed chain) --
				// not a cycle back to employeeEmail, just stop walking.
				break;
			}
			visited.add(currentEmail);

			// Find teammate in allUsers by current email to get their manager
			const teammate = allUsers.find(u => u.email === currentEmail);
			if (!teammate || !teammate.reporting_manager_id) {
				break;
			}

			// Find manager's email by reporting_manager_id
			const manager = owners.find(o => o.id === teammate.reporting_manager_id);
			if (!manager) {
				break;
			}
			currentEmail = manager.email;
		}

		return false;
	};

	// Perform individual update
	const handleManagerChange = async (user: TeamMember, newManagerId: number | '') => {
		setUpdatingUserPublicId(user.public_id);
		try {
			await dispatch(
				updateTeamUser({
					publicId: user.public_id,
					payload: {
						reporting_manager_id: newManagerId === '' ? null : newManagerId
					}
				})
			).unwrap();
			toast.success(`Manager updated for ${user.full_name || user.username}`);
			dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		} catch (err: any) {
			toast.error(err || 'Failed to update reporting manager.');
		} finally {
			setUpdatingUserPublicId(null);
		}
	};

	// Bulk apply manager to checked employees
	const handleBulkApply = async () => {
		if (bulkManagerId === '') return;
		setBulkLoading(true);
		
		// Find selected users
		const selectedUsers = allUsers.filter(u => selectedIds.includes(u.public_id));
		
		// Validate cycles for all selected users first
		const cycleUsers = selectedUsers.filter(u => wouldCreateCycle(u.email, bulkManagerId));
		if (cycleUsers.length > 0) {
			const names = cycleUsers.map(u => u.full_name || u.username).join(', ');
			toast.error(`Cannot apply: Circular reporting detected for: ${names}`);
			setBulkLoading(false);
			return;
		}

		let successCount = 0;
		let failCount = 0;

		try {
			await Promise.all(
				selectedUsers.map(async (u) => {
					try {
						await dispatch(
							updateTeamUser({
								publicId: u.public_id,
								payload: {
									reporting_manager_id: bulkManagerId
								}
							})
						).unwrap();
						successCount++;
					} catch {
						failCount++;
					}
				})
			);

			if (successCount > 0) {
				toast.success(`Successfully assigned manager for ${successCount} employees.`);
			}
			if (failCount > 0) {
				toast.error(`Failed to assign manager for ${failCount} employees.`);
			}

			// Clear state and refresh
			setSelectedIds([]);
			setBulkManagerId('');
			dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		} catch (err: any) {
			toast.error('An error occurred during bulk assignment.');
		} finally {
			setBulkLoading(false);
		}
	};

	// Selection handlers
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const visibleIds = paginatedUsers.map((u) => u.public_id);
			setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
		} else {
			const visibleIds = paginatedUsers.map((u) => u.public_id);
			setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
		}
	};

	const handleSelectRow = (checked: boolean, publicId: string) => {
		if (checked) {
			setSelectedIds((prev) => [...prev, publicId]);
		} else {
			setSelectedIds((prev) => prev.filter((id) => id !== publicId));
		}
	};

	// Client-side search and filtering
	const processedUsers = useMemo(() => {
		return allUsers.filter((u) => {
			if (filterUnassignedOnly && u.reporting_manager_id !== null) {
				return false;
			}
			const query = searchTerm.toLowerCase();
			return (
				(u.full_name || '').toLowerCase().includes(query) ||
				u.email.toLowerCase().includes(query) ||
				u.username.toLowerCase().includes(query) ||
				u.role.toLowerCase().includes(query)
			);
		});
	}, [allUsers, searchTerm, filterUnassignedOnly]);

	// Paginated list
	const paginatedUsers = useMemo(() => {
		const start = (page - 1) * itemsPerPage;
		return processedUsers.slice(start, start + itemsPerPage);
	}, [processedUsers, page]);



	// Reset page on search, filter, or itemsPerPage change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, filterUnassignedOnly, itemsPerPage]);

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
