import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import aiService, { type AICreditBalance } from '../services/aiService';

/** Shared by Navbar (desktop) and Sidebar (mobile) so both surfaces show the same balance
 * without duplicating the fetch/shape logic -- each still makes its own lightweight GET,
 * which is fine for a balance this cheap to read. */
export const useAICreditBalance = (): AICreditBalance | null => {
	const hasOrg = useAppSelector((state) => !!state.auth.user?.organization);
	const [credits, setCredits] = useState<AICreditBalance | null>(null);

	useEffect(() => {
		if (!hasOrg) return;
		aiService.getCreditBalance().then(setCredits).catch(() => setCredits(null));
	}, [hasOrg]);

	return credits;
};

export default useAICreditBalance;
