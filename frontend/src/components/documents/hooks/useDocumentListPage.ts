import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';

/**
 * useDocumentListPage - Specialized hook for the main Document Listing page.
 * Manages tab state and provides access to module-wide statistics.
 */
export const useDocumentListPage = () => {
	const [tabValue, setTabValue] = useState(0); // 0 = Not Collected, 1 = Pending, 2 = Collected
	const { stats, loading: statsLoading } = useAppSelector((state) => state.candidates);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	return {
		tabValue,
		stats,
		statsLoading,
		handleTabChange
	};
};
