import { useAppSelector } from '../store/hooks';

export type UserFlow = 'super_admin' | 'org_admin' | 'org_team' | 'individual';

/**
 * Which of the app's four dashboard experiences the current user belongs to.
 * Mirrors the exact detection logic already used for nav visibility in
 * Sidebar.tsx / ProtectedRoute.tsx — kept here as a single source of truth
 * for anything (like the dashboard) that needs the flow as a whole rather
 * than one-off permission checks.
 */
export const useUserFlow = (): UserFlow => {
	const { user } = useAppSelector((state) => state.auth);

	if (user?.is_superuser) return 'super_admin';
	if (user?.organization?.others?.account_type === 'individual') return 'individual';
	if (user?.role === 'admin') return 'org_admin';
	return 'org_team';
};

export default useUserFlow;
