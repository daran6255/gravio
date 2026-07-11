import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchTeamUsers, updateTeamUser } from '../../../../store/slices/userSlice';
import { fetchOwners } from '../../../../store/slices/crmSlice';
import { fetchCurrentUser } from '../../../../store/slices/authSlice';
import useToast from '../../../../hooks/useToast';
import type { TeamMember } from '../../../../models/user';

export const useManagerAllocation = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();

	// Redux state
	const { users: allUsers, loading: usersLoading } = useAppSelector((state) => state.users);
	const { owners } = useAppSelector((state) => state.crm);
	const currentUser = useAppSelector((state) => state.auth.user);

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

	// Trace reporting manager chain to detect circular reporting
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
				break;
			}
			visited.add(currentEmail);

			const teammate = allUsers.find(u => u.email === currentEmail);
			if (!teammate || !teammate.reporting_manager_id) {
				break;
			}

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
			if (user.public_id === currentUser?.public_id) {
				dispatch(fetchCurrentUser());
			}
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
		
		const selectedUsers = allUsers.filter(u => selectedIds.includes(u.public_id));
		
		const cycleUsers = selectedUsers.filter(u => wouldCreateCycle(u.email, bulkManagerId));
		if (cycleUsers.length > 0) {
			const names = cycleUsers.map(u => u.full_name || u.username).join(', ');
			toast.error(`Cannot assign manager: circular loops detected for [${names}]. Please uncheck them first.`);
			setBulkLoading(false);
			return;
		}

		try {
			let updatedCount = 0;
			await Promise.all(
				selectedUsers.map(async (u) => {
					try {
						await dispatch(
							updateTeamUser({
								publicId: u.public_id,
								payload: { reporting_manager_id: bulkManagerId }
							})
						).unwrap();
						updatedCount++;
					} catch {
						// Continue with others
					}
				})
			);

			toast.success(`Successfully assigned manager to ${updatedCount} team members.`);
			setSelectedIds([]);
			setBulkManagerId('');
			dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
			
			// Refresh current user if they were in the bulk update
			if (selectedUsers.some(u => u.public_id === currentUser?.public_id)) {
				dispatch(fetchCurrentUser());
			}
		} catch (err: any) {
			toast.error(err || 'Failed to update managers.');
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
	}, [processedUsers, page, itemsPerPage]);

	// Reset page on search, filter, or itemsPerPage change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, filterUnassignedOnly, itemsPerPage]);

	return {
		searchTerm, setSearchTerm,
		selectedIds, setSelectedIds,
		updatingUserPublicId, setUpdatingUserPublicId,
		bulkManagerId, setBulkManagerId,
		bulkLoading, setBulkLoading,
		roleFilterOnlyManagers, setRoleFilterOnlyManagers,
		filterUnassignedOnly, setFilterUnassignedOnly,
		page, setPage,
		itemsPerPage, setItemsPerPage,
		allUsers,
		usersLoading,
		owners,
		currentUser,
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
	};
};
