import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchStats } from '../../../../store/slices/crmSlice';

export const useCrmDashboard = () => {
	const dispatch = useAppDispatch();
	const { stats, statsLoading } = useAppSelector((state) => state.crm);

	useEffect(() => {
		dispatch(fetchStats());
	}, [dispatch]);

	return { stats, statsLoading };
};
