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
	const [updatingUserPublicId, setUpdatingUserPublicId] = useState<string | null>(null);
	const [roleFilterOnlyManagers, setRoleFilterOnlyManagers] = useState(true);

	// Fetch all users and managers on mount
	useEffect(() => {
		dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
		dispatch(fetchOwners());
	}, [dispatch]);

	// Filter managers by role if filter is active
	const filteredManagers = useMemo(() => {
		if (!roleFilterOnlyManagers) return owners;

		const adminOrManagerEmails = new Set(
			allUsers
				.filter((u) => u.role === 'admin' || u.role === 'manager')
				.map((u) => u.email)
		);

		return owners.filter((o) => adminOrManagerEmails.has(o.email));
	}, [owners, allUsers, roleFilterOnlyManagers]);

	// TeamMember rows don't carry their own numeric id -- reporting_manager_id references
	// CRMOwnerOption.id, so every tree/lookup operation has to join through email first.
	const ownerIdByEmail = useMemo(() => {
		const map = new Map<string, number>();
		owners.forEach((o) => map.set(o.email, o.id));
		return map;
	}, [owners]);

	const getOwnerId = (user: TeamMember): number | undefined => ownerIdByEmail.get(user.email);

	const childrenByOwnerId = useMemo(() => {
		const map = new Map<number, TeamMember[]>();
		allUsers.forEach((u) => {
			const managerId = u.reporting_manager_id;
			if (managerId == null) return;
			// A self-assigned fallback manager (see isSelfManaged below) isn't a real
			// subordinate edge -- indexing it would make a node its own child and
			// recurse forever when the tree renders.
			if (managerId === ownerIdByEmail.get(u.email)) return;
			const arr = map.get(managerId) || [];
			arr.push(u);
			map.set(managerId, arr);
		});
		return map;
	}, [allUsers, ownerIdByEmail]);

	const getDirectReports = (user: TeamMember): TeamMember[] => {
		const ownerId = getOwnerId(user);
		return ownerId != null ? (childrenByOwnerId.get(ownerId) || []) : [];
	};

	// Solo admins with no other eligible manager get self-assigned as their own
	// manager (a pre-existing fallback elsewhere in this flow) -- that's not a
	// "real" manager above them, so treat it the same as no manager at all.
	const isSelfManaged = (user: TeamMember): boolean => {
		const ownerId = getOwnerId(user);
		return ownerId != null && user.reporting_manager_id === ownerId;
	};

	const isRootCandidate = (user: TeamMember): boolean =>
		user.reporting_manager_id == null || isSelfManaged(user);

	// Root of a tree branch: nobody real above them, but someone reports to them.
	const treeRoots = useMemo(
		() => allUsers.filter((u) => isRootCandidate(u) && getDirectReports(u).length > 0),
		[allUsers, childrenByOwnerId, ownerIdByEmail]
	);

	// Truly unassigned: nobody real above them, and nobody reports to them either.
	const unassignedPool = useMemo(
		() => allUsers.filter((u) => isRootCandidate(u) && getDirectReports(u).length === 0),
		[allUsers, childrenByOwnerId, ownerIdByEmail]
	);

	const matchesSearch = (user: TeamMember, query: string): boolean => {
		if (!query.trim()) return true;
		const q = query.toLowerCase();
		return (
			(user.full_name || '').toLowerCase().includes(q) ||
			user.email.toLowerCase().includes(q) ||
			user.username.toLowerCase().includes(q) ||
			user.role.toLowerCase().includes(q)
		);
	};

	// A node stays visible if it matches, or anyone beneath it in the tree matches --
	// keeps ancestor chains intact instead of collapsing the tree down to orphan matches.
	const subtreeMatchesSearch = (user: TeamMember, query: string, visited: Set<string> = new Set()): boolean => {
		if (matchesSearch(user, query)) return true;
		if (visited.has(user.public_id)) return false;
		visited.add(user.public_id);
		return getDirectReports(user).some((child) => subtreeMatchesSearch(child, query, visited));
	};

	// Trace reporting manager chain to detect circular reporting
	const wouldCreateCycle = (employeeEmail: string, potentialManagerId: number | ''): boolean => {
		if (!potentialManagerId) return false;

		const targetManager = owners.find((o) => o.id === potentialManagerId);
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

			const teammate = allUsers.find((u) => u.email === currentEmail);
			if (!teammate || !teammate.reporting_manager_id) {
				break;
			}

			const manager = owners.find((o) => o.id === teammate.reporting_manager_id);
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

	return {
		searchTerm, setSearchTerm,
		updatingUserPublicId,
		roleFilterOnlyManagers, setRoleFilterOnlyManagers,
		allUsers,
		usersLoading,
		owners,
		currentUser,
		filteredManagers,
		wouldCreateCycle,
		handleManagerChange,
		getOwnerId,
		getDirectReports,
		treeRoots,
		unassignedPool,
		subtreeMatchesSearch
	};
};
