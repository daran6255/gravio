import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchTimesheetReport } from '../../../../store/slices/timesheetSlice';
import { fetchProjects } from '../../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../../store/slices/crmSlice';
import { fetchTeamUsers } from '../../../../store/slices/userSlice';

export const useTimesheetReport = () => {
	const dispatch = useAppDispatch();

	const currentUser = useAppSelector((state) => state.auth.user);
	const { projects } = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);
	const { users: allUsers } = useAppSelector((state) => state.users);
	const { reportRows, reportRowsLoading } = useAppSelector((state) => state.timesheets);

	const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

	// Project Management is a separate plan add-on
	const hasProjectModule = useMemo(() => {
		if (currentUser?.is_superuser) return true;
		const org = currentUser?.organization;
		if (!org) return false;
		if (org.subscription_status === 'trial') return true;
		return org.plan?.enabled_modules?.includes('project_management') ?? false;
	}, [currentUser]);

	// Report filter states
	const [startDate, setStartDate] = useState(
		new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
	);
	const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
	const [projectId, setProjectId] = useState<number | ''>('');
	const [userId, setUserId] = useState<number | ''>('');
	const [billingType, setBillingType] = useState<string | ''>('');

	// Pagination states
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		if (hasProjectModule) {
			dispatch(fetchProjects({ pageSize: 100 }));
		}
		dispatch(fetchOwners());
		dispatch(fetchTeamUsers({ page: 1, pageSize: 100 }));
	}, [dispatch, hasProjectModule]);

	// Filter user options in the dropdown
	const userOptions = useMemo(() => {
		if (!currentUser) return [];

		// Create a map of email -> TeamMember to easily lookup reporting_manager_id
		const memberMap = new Map<string, typeof allUsers[0]>();
		allUsers.forEach((u) => memberMap.set(u.email.toLowerCase(), u));

		if (currentUser.role === 'admin') {
			return owners;
		}

		if (currentUser.role === 'manager') {
			return owners.filter((o) => {
				if (o.id === currentUser.id) return true;
				const member = memberMap.get(o.email.toLowerCase());
				return member?.reporting_manager_id === currentUser.id;
			});
		}

		// Otherwise (regular employee)
		return owners.filter((o) => o.id === currentUser.id);
	}, [owners, allUsers, currentUser]);

	const loadReport = () => {
		dispatch(
			fetchTimesheetReport({
				start_date: startDate,
				end_date: endDate,
				project_id: projectId || null,
				user_id: isManagerOrAdmin ? (userId || null) : (currentUser?.id || null),
				billing_type: billingType || null
			})
		);
		setPage(0);
	};

	useEffect(() => {
		loadReport();
	}, [startDate, endDate, projectId, userId, billingType, currentUser]);

	// Summaries
	const summaryStats = useMemo(() => {
		let total = 0;
		let billable = 0;
		let nonBillable = 0;

		reportRows.forEach((r) => {
			total += r.total_hours;
			if (r.billing_type === 'billable') {
				billable += r.total_hours;
			} else {
				nonBillable += r.total_hours;
			}
		});

		return { total, billable, nonBillable };
	}, [reportRows]);

	const handleChangePage = (_: unknown, newPage: number) => {
		setPage(newPage);
	};

	const paginatedRows = reportRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return {
		startDate, setStartDate,
		endDate, setEndDate,
		projectId, setProjectId,
		userId, setUserId,
		billingType, setBillingType,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		currentUser,
		projects,
		reportRows,
		reportRowsLoading,
		isManagerOrAdmin,
		hasProjectModule,
		userOptions,
		summaryStats,
		handleChangePage,
		paginatedRows,
		loadReport
	};
};
