import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchActivityFeed, fetchOwners } from '../../../../store/slices/crmSlice';

export const useActivityFeed = () => {
	const dispatch = useAppDispatch();
	const { feedActivities, feedActivitiesTotal, feedActivitiesLoading, owners } = useAppSelector((state) => state.crm);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [type, setType] = useState('');
	const [ownerId, setOwnerId] = useState<number | ''>('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	useEffect(() => {
		dispatch(fetchOwners());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchActivityFeed({
			page: page + 1,
			pageSize: rowsPerPage,
			type: type || undefined,
			ownerId: ownerId === '' ? undefined : ownerId,
			dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
			dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
		}));
	}, [dispatch, page, rowsPerPage, type, ownerId, dateFrom, dateTo]);

	const handlePageChange = (_event: unknown, newPage: number) => setPage(newPage);

	const handleRowsPerPageChange = (rows: number) => {
		setRowsPerPage(rows);
		setPage(0);
	};

	const handleTypeChange = (value: string) => {
		setType(value);
		setPage(0);
	};

	const handleOwnerChange = (value: number | '') => {
		setOwnerId(value);
		setPage(0);
	};

	const handleDateFromChange = (value: string) => {
		setDateFrom(value);
		setPage(0);
	};

	const handleDateToChange = (value: string) => {
		setDateTo(value);
		setPage(0);
	};

	return {
		feedActivities,
		feedActivitiesTotal,
		feedActivitiesLoading,
		owners,

		page,
		rowsPerPage,
		type,
		ownerId,
		dateFrom,
		dateTo,

		handlePageChange,
		handleRowsPerPageChange,
		handleTypeChange,
		handleOwnerChange,
		handleDateFromChange,
		handleDateToChange,
	};
};
