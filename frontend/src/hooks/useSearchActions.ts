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

		// Project Management
		{ id: 'projects', title: 'Projects', path: '/projects', category: 'Projects', icon: ProjectIcon },
		{ id: 'activities', title: 'Activities', path: '/projects/activities', category: 'Projects', icon: ActivitiesIcon },
		{ id: 'timesheet', title: 'Timesheet', path: '/projects/timesheet', category: 'Projects', icon: TimesheetIcon },

		// Candidates
		{ id: 'all-candidates', title: 'All Candidates', path: '/candidates', category: 'Candidates', icon: CandidatesIcon },
		{ id: 'screening', title: 'Candidate Screening', path: '/candidates/screening', category: 'Candidates', roles: ['admin', 'sourcing'], icon: ScreeningIcon },
		{ id: 'counseling', title: 'Candidate Counseling', path: '/candidates/counseling', category: 'Candidates', roles: ['admin', 'trainer'], icon: CounselingIcon },
		{ id: 'documents', title: 'Document Collection', path: '/candidates/documents', category: 'Candidates', roles: ['admin', 'sourcing'], icon: DocumentsIcon },

		// Training
		{ id: 'training-batches', title: 'Training Batches', path: '/training/batches', category: 'Training', icon: TrainingIcon },
		{ id: 'training-weekly-plan', title: 'Weekly Training Plan', path: '/training/weekly-plan', category: 'Training', icon: WeeklyPlanIcon },
		{ id: 'training-allocation', title: 'Candidate Batch Allocation', path: '/training/allocation', category: 'Training', icon: AllocationIcon },
		{ id: 'training-attendance', title: 'Attendance', path: '/training/attendance', category: 'Training', icon: AttendanceIcon },

		// General
		{ id: 'reports', title: 'Reports & Analytics', path: '/reports', category: 'General', icon: AssessmentIcon },
		{ id: 'settings', title: 'Settings', path: '/settings', category: 'General', icon: SettingsIcon },
		{ id: 'support', title: 'Help and Support', path: '/support', category: 'General', icon: HelpIcon },
	], []);

	const filteredActions = useMemo(() => {
		if (!user) return [];
		return allActions.filter(action => {
			if (!action.roles) return true;
			return action.roles.includes(user.role);
		});
	}, [allActions, user]);

	return filteredActions;
};
