import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';

import {
	Home as HomeIcon,
	ManageAccounts as UserIcon,
	Group as CandidatesIcon,
	FactCheck as ScreeningIcon,
	Psychology as CounselingIcon,
	Description as DocumentsIcon,
	School as TrainingIcon,
	AssignmentInd as AllocationIcon,
	Assessment as AssessmentIcon,
	Settings as SettingsIcon,
	HelpOutline as HelpIcon,
	Folder as ProjectIcon,
	Timeline as ActivitiesIcon,
	Timer as TimesheetIcon,
	EventAvailable as AttendanceIcon,
	Assignment as WeeklyPlanIcon,
} from '@mui/icons-material';

export {
	HomeIcon,
	UserIcon,
	CandidatesIcon,
	ScreeningIcon,
	CounselingIcon,
	DocumentsIcon,
	TrainingIcon,
	AllocationIcon,
	AssessmentIcon,
	SettingsIcon,
	HelpIcon,
	ProjectIcon,
	ActivitiesIcon,
	TimesheetIcon,
	AttendanceIcon,
	WeeklyPlanIcon,
};

export interface SearchAction {
	id: string;
	title: string;
	path: string;
	category: string;
	roles?: string[];
	icon: React.ElementType;
}

export const useSearchActions = () => {
	const { user } = useAppSelector((state) => state.auth);

	const allActions: SearchAction[] = useMemo(() => [
		{ id: 'dashboard', title: 'Home / Dashboard', path: '/dashboard', category: 'General', icon: HomeIcon },
		{ id: 'users', title: 'User Management', path: '/users', category: 'Admin', roles: ['admin'], icon: UserIcon },
		{ id: 'settings', title: 'Settings', path: '/settings', category: 'General', icon: SettingsIcon },
	], []);

	const filteredActions = useMemo(() => {
		if (!user) return [];
		return allActions.filter(action => {
			if (action.id === 'users' && user?.organization?.others?.account_type === 'individual') return false;
			if (!action.roles) return true;
			return action.roles.includes(user.role);
		});
	}, [allActions, user]);

	return filteredActions;
};
