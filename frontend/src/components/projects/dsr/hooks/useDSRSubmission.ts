import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchProjects,
	fetchActivitiesForProject,
	createEntry,
	submitEntry,
	fetchEntry,
	fetchPermissionRequests,
	fetchCalendarEntries
} from '../../../../store/slices/dsrSlice';
import { fetchActivityTypes } from '../../../../store/slices/dsrActivityTypeSlice';
import useToast from '../../../../hooks/useToast';
import type { DSRItem } from '../../../../models/dsr';
import { subDays, format, startOfDay } from 'date-fns';

export const GENERAL_PROJECT_ID = 'general_internal';

interface UseDSRSubmissionProps {
	onSubmitted?: () => void;
	onSuccess?: () => void;
	externalEntryId?: string | null;
}

export const useDSRSubmission = (props?: UseDSRSubmissionProps) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const entryId = props?.externalEntryId || searchParams.get('id');
	const dispatch = useAppDispatch();
	const toast = useToast();

	const { user } = useAppSelector((state) => state.auth);
	const { projects: rawProjects, activitiesByProject, calendarEntries: entries, permissionRequests, loading: dsrLoading } = useAppSelector((state) => state.dsr);
	const { holidays } = useAppSelector((state) => state.holidays);
	const { activityTypes, loading: typesLoading } = useAppSelector((state) => state.dsrActivityType);

	const projects = useMemo(() => {
		// 1. Get unique categories from activity types
		const categories = Array.from(new Set(activityTypes.map(at => at.category).filter(Boolean))) as string[];

		// 2. Map categories to virtual projects
		const categoryProjects = categories.map(cat => ({
			public_id: `category:${cat}`,
			name: cat,
			is_category: true,
			description: `Grouped activities for ${cat}`,
			group: 'Common Categories'
		}));

		// 3. Keep the legacy "General" if no categories yet, or as a catch-all if needed
		const generalProject: any = {
			public_id: GENERAL_PROJECT_ID,
			name: 'General / Internal Work',
			description: 'General activities like meetings, etc.',
			group: 'Common Categories'
		};

		const hasGeneralCategory = categories.some(c => c.toLowerCase() === 'general');
		const baseList = hasGeneralCategory ? [] : [generalProject];

		const baseProjects = rawProjects.map(p => ({
			...p,
			group: 'Active Projects'
		}));

		return [...baseList, ...categoryProjects, ...baseProjects];
	}, [rawProjects, activityTypes]);

	const loading = dsrLoading || typesLoading;

	const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
	const [items, setItems] = useState<Partial<DSRItem>[]>([
		{
			project_public_id: null as any,
			activity_public_id: null as any,
			activity_type_name: null,
			description: '',
			start_time: '09:00',
			end_time: '10:00',
			hours: 1
		}
	]);
	const [isLeave, setIsLeave] = useState(false);
	const [leaveType, setLeaveType] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [permissionError, setPermissionError] = useState<string | null>(null);
	const [hasExplicitPermission, setHasExplicitPermission] = useState(false);
	const [originalItems, setOriginalItems] = useState<any[]>([]);
	const [originalIsLeave, setOriginalIsLeave] = useState(false);
	const [originalLeaveType, setOriginalLeaveType] = useState('');

	const isDateAllowed = useMemo(() => {
		const today = new Date().toISOString().split('T')[0];

		// Check if there's a granted permission for this date (handles both past and holiday)
		const hasPermission = permissionRequests.some(req =>
			req.report_date === reportDate && req.status === 'granted'
		);

		// Holiday Check
		const isHoliday = holidays.some(h => h.holiday_date === reportDate);
		const userRole = user?.role?.toUpperCase();
		if (isHoliday) {
			return hasPermission || userRole === 'ADMIN' || userRole === 'MANAGER' || hasExplicitPermission;
		}

		if (reportDate === today) return true;
		if (reportDate > today) return false;

		return hasPermission || userRole === 'ADMIN' || userRole === 'MANAGER' || hasExplicitPermission;
	}, [reportDate, permissionRequests, holidays, user?.role, hasExplicitPermission]);

	const isValid = useMemo(() => {
		if (isLeave) return !!leaveType;
		if (items.length === 0) return false;
		
		return items.every(it => {
			const isGeneral = it.project_public_id === GENERAL_PROJECT_ID;
			const isCategory = it.project_public_id?.startsWith('category:');
			
			const baseValid = !!it.project_public_id && !!it.description && !!it.start_time && !!it.end_time && (it.hours || 0) > 0;
			if (!baseValid) return false;

			if (isGeneral || isCategory) {
				return !!it.activity_type_name;
			} else {
				return !!it.activity_public_id || !!it.activity_name_other;
			}
		});
	}, [items, isLeave, leaveType]);

	const isDirty = useMemo(() => {
		// If creating new entry, it's dirty if items differ from default or are filled
		if (!entryId) {
			const isInitialDefault = items.length === 1 && 
				!items[0].project_public_id && 
				items[0].description === '' && 
				items[0].hours === 0 &&
				!isLeave;
			return !isInitialDefault || isLeave;
		}

		// Change in leave status
		if (isLeave !== originalIsLeave) return true;
		if (isLeave && leaveType !== originalLeaveType) return true;
		if (isLeave) return false;

		// Change in row count
		if (items.length !== originalItems.length) return true;

		// Deep compare items (simplified for relevant fields)
		return items.some((item, idx) => {
			const orig = originalItems[idx];
			if (!orig) return true;
			return item.project_public_id !== orig.project_public_id ||
				   item.activity_public_id !== orig.activity_public_id ||
				   item.activity_type_name !== orig.activity_type_name ||
				   item.description !== orig.description ||
				   item.start_time !== orig.start_time ||
				   item.end_time !== orig.end_time ||
				   item.activity_name_other !== orig.activity_name_other;
		});
	}, [items, isLeave, leaveType, originalItems, originalIsLeave, originalLeaveType, entryId]);

	const dateStatuses = useMemo(() => {
		const statusMap: Record<string, string> = {};
		const today = startOfDay(new Date());

		// Mark dates from entries (Approved, Submitted, Rejected, Draft)
		entries.forEach(entry => {
			statusMap[entry.report_date] = entry.status;
		});

		// Mark missed dates (last 30 days) and check for granted permissions
		for (let i = 1; i <= 60; i++) { // Extend range for better visibility
			const d = subDays(today, i);
			const dateStr = format(d, 'yyyy-MM-dd');

			// Entries take precedence over permissions
			if (statusMap[dateStr]) continue;

			// Check if permission granted for this date
			const hasPermission = permissionRequests.some(req =>
				req.report_date === dateStr && req.status === 'granted'
			);

			if (hasPermission) {
				statusMap[dateStr] = 'granted';
			} else {
				// Only mark as "missed" if it's NOT a holiday
				const isHoliday = holidays.some(h => h.holiday_date === dateStr);
				if (!isHoliday) {
					statusMap[dateStr] = 'missed';
				}
			}
		}

		return statusMap;
	}, [entries, permissionRequests, holidays]);

	const loadEntry = useCallback(async (id: string) => {
		try {
			const entry = await dispatch(fetchEntry(id)).unwrap();
			setReportDate(entry.report_date);

			// Map null project_public_id to GENERAL_PROJECT_ID or Category for UI consistency
			const mappedItems = entry.items.map(item => {
				let projectId = item.project_public_id;
				if (!projectId) {
					const type = activityTypes.find(at => at.name === item.activity_type_name);
					if (type?.category) {
						projectId = `category:${type.category}`;
					} else {
						projectId = GENERAL_PROJECT_ID;
					}
				}
				return {
					...item,
					project_public_id: projectId
				};
			});
			setItems(mappedItems);
			setIsLeave(entry.is_leave);
			setLeaveType(entry.leave_type || '');
			// Set explicit permission if it was granted by an admin (directly or via revoke)
			setHasExplicitPermission(!!entry.previous_day_permission_granted_by || !!entry.is_previous_day_submission);
			
			// Store original state for dirty checking
			setOriginalItems(mappedItems);
			setOriginalIsLeave(entry.is_leave);
			setOriginalLeaveType(entry.leave_type || '');

			if (!entry.is_leave) {
				const uniqueProjects = Array.from(new Set(mappedItems.map(i => i.project_public_id)));
				uniqueProjects.forEach(pid => {
					if (pid && pid !== GENERAL_PROJECT_ID && !pid.startsWith('category:')) {
						dispatch(fetchActivitiesForProject({ projectId: pid, assigned_to: entry.user?.public_id }));
					}
				});
			}

			// Update calendar for this specific user
			const dateFrom = format(subDays(new Date(), 60), 'yyyy-MM-dd');
			const today = format(new Date(), 'yyyy-MM-dd');
			dispatch(fetchCalendarEntries({
				date_from: dateFrom,
				date_to: today,
				user_id: entry.user_id
			}));
		} catch (error: any) {
			toast.error(error || 'Failed to load DSR');
		}
	}, [dispatch, toast, user?.public_id]);

	useEffect(() => {
		dispatch(fetchProjects({ skip: 0, limit: 500, active_only: true, assigned_to: user?.public_id }));
		dispatch(fetchPermissionRequests({ skip: 0, limit: 100, user_id: user?.id as any }));
		dispatch(fetchActivityTypes({ skip: 0, limit: 100, onlyActive: true }));

		// Fetch calendar status with extended history (matching the 60-day UI check)
		const start = format(subDays(startOfDay(new Date()), 60), 'yyyy-MM-dd');
		const end = format(subDays(startOfDay(new Date()), -30), 'yyyy-MM-dd');
		dispatch(fetchCalendarEntries({
			date_from: start,
			date_to: end,
			user_id: user?.id as any
		}));

		if (entryId) {
			loadEntry(entryId);
		} else {
			// Reset for new entry
			setReportDate(new Date().toISOString().split('T')[0]);
			setItems([{ project_public_id: null as any, activity_public_id: null as any, description: '', start_time: '09:00', end_time: '10:00', hours: 1 }]);
			setIsLeave(false);
			setLeaveType('');
			setPermissionError(null);
			setHasExplicitPermission(false);
			setOriginalItems([]);
			setOriginalIsLeave(false);
			setOriginalLeaveType('');
		}
	}, [dispatch, entryId, loadEntry, user?.public_id, user?.id, holidays]);

	// Auto-repair project IDs when activity types are loaded (handles race condition during loadEntry)
	useEffect(() => {
		if (activityTypes.length > 0 && items.length > 0) {
			const needsRepair = items.some(it => it.project_public_id === GENERAL_PROJECT_ID && !!it.activity_type_name);
			if (needsRepair) {
				setItems(prev => prev.map(item => {
					if (item.project_public_id === GENERAL_PROJECT_ID && item.activity_type_name) {
						const type = activityTypes.find(at => at.name === item.activity_type_name);
						if (type?.category) {
							return { ...item, project_public_id: `category:${type.category}` };
						}
					}
					return item;
				}));
			}
		}
	}, [activityTypes, items]);

	// Update permissionError if it's a holiday
	useEffect(() => {
		const today = new Date().toISOString().split('T')[0];
		const hasPermission = permissionRequests.some(req =>
			req.report_date === reportDate && req.status === 'granted'
		);

		const holiday = holidays.find(h => h.holiday_date === reportDate);
		const userRole = user?.role?.toUpperCase();

		if (holiday && !hasPermission && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
			setPermissionError(`Cannot submit DSR for ${holiday.holiday_date} as it is a company holiday (${holiday.holiday_name}). Please request permission if you worked on this day.`);
		} else if (!isDateAllowed && reportDate < today) {
			// Only show the generic permission error if it's NOT a holiday or permission wasn't granted
			setPermissionError("You do not have permission to submit for this past date. Please raise a request first.");
		} else {
			setPermissionError(null);
		}
	}, [reportDate, holidays, isDateAllowed, permissionRequests, user?.role]);

	const calculateHours = (start: string, end: string) => {
		if (!start || !end) return 0;
		const [sH, sM] = start.split(':').map(Number);
		const [eH, eM] = end.split(':').map(Number);
		const startMin = sH * 60 + sM;
		const endMin = eH * 60 + eM;
		const diff = endMin - startMin;
		return diff > 0 ? parseFloat((diff / 60).toFixed(2)) : 0;
	};

	const handleRowChange = (index: number, field: keyof DSRItem, value: any) => {
		setItems((prevItems) => {
			const newItems = [...prevItems];
			const currentItem = newItems[index];

			// Create a new object for the item being changed
			const updatedItem = { ...currentItem, [field]: value };

			// Handle logical dependencies
			if (field === 'project_public_id') {
				// If project actually changed, clear its children
				if (currentItem.project_public_id !== value) {
					updatedItem.activity_public_id = null as any;
					updatedItem.activity_name_other = undefined;
					updatedItem.activity_type_name = null;
				}
			}

			if (field === 'start_time' || field === 'end_time') {
				updatedItem.hours = calculateHours(updatedItem.start_time || '', updatedItem.end_time || '');
			}

			newItems[index] = updatedItem;
			return newItems;
		});

		// Handle side effects (Redux dispatches) outside the state update
		if (field === 'project_public_id' && value && value !== GENERAL_PROJECT_ID && !value.startsWith('category:')) {
			dispatch(fetchActivitiesForProject({ projectId: value, assigned_to: user?.public_id }));
		}
	};

	const addRow = () => {
		const lastItem = items[items.length - 1];
		setItems([...items, {
			project_public_id: null as any,
			activity_public_id: null as any,
			activity_type_name: null,
			description: '',
			start_time: lastItem?.end_time || '09:00',
			end_time: '',
			hours: 0
		}]);
	};

	const removeRow = (index: number) => {
		if (items.length === 1) return;
		setItems(items.filter((_, i) => i !== index));
	};

	const totalHours = useMemo(() => items.reduce((sum, item) => sum + (item.hours || 0), 0), [items]);

	const validate = () => {
		if (isLeave) {
			if (!leaveType) {
				toast.warning('Please select a leave type');
				return false;
			}
			return true;
		}

		for (let i = 0; i < items.length; i++) {
			const it = items[i];
			const isGeneral = it.project_public_id === GENERAL_PROJECT_ID;
			const isCategory = it.project_public_id?.startsWith('category:');

			if (!it.project_public_id || !it.description || !it.start_time || !it.end_time) {
				toast.warning(`Please fill all fields in row ${i + 1}`);
				return false;
			}

			if (isGeneral || isCategory) {
				if (!it.activity_type_name) {
					toast.warning(`Please select an Activity Type for row ${i + 1}`);
					return false;
				}
			} else {
				if (!it.activity_public_id && !it.activity_name_other) {
					toast.warning(`Please select an Activity for row ${i + 1}`);
					return false;
				}
			}

			if ((it.hours || 0) <= 0) {
				toast.warning(`Invalid time range in row ${i + 1}`);
				return false;
			}
		}
		return true;
	};

	const handleSaveDraft = async () => {
		if (!validate()) return;
		setSubmitting(true);
		const sanitizedItems = items.map(item => ({
			...item,
			project_public_id: (item.project_public_id === GENERAL_PROJECT_ID || (typeof item.project_public_id === 'string' && item.project_public_id.startsWith('category:')))
				? null
				: item.project_public_id
		}));

		try {
			await dispatch(createEntry({
				report_date: reportDate,
				items: isLeave ? [] : sanitizedItems as any,
				is_leave: isLeave,
				leave_type: isLeave ? leaveType : undefined
			})).unwrap();
			toast.success('Draft saved successfully');
			setPermissionError(null);
			if (props?.onSubmitted) props.onSubmitted();
		} catch (error: any) {
			if (error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('date')) {
				setPermissionError(error);
			} else {
				toast.error(error || 'Failed to save draft');
			}
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmit = async () => {
		if (!validate()) return;
		setSubmitting(true);
		const sanitizedItems = items.map(item => ({
			...item,
			project_public_id: (item.project_public_id === GENERAL_PROJECT_ID || (typeof item.project_public_id === 'string' && item.project_public_id.startsWith('category:')))
				? null
				: item.project_public_id
		}));

		try {
			const entry = await dispatch(createEntry({
				report_date: reportDate,
				items: isLeave ? [] : sanitizedItems as any,
				is_leave: isLeave,
				leave_type: isLeave ? leaveType : undefined
			})).unwrap();
			await dispatch(submitEntry(entry.public_id)).unwrap();
			toast.success('DSR submitted successfully!');
			
			// Call success callback or navigate
			if (props?.onSuccess) {
				props.onSuccess();
			} else if (props?.onSubmitted) {
				props.onSubmitted();
			} else {
				setTimeout(() => navigate('/dashboard/dsr'), 1500);
			}
		} catch (error: any) {
			toast.error(error || 'Failed to submit DSR');
		} finally {
			setSubmitting(false);
		}
	};

	return {
		entryId,
		projects,
		activitiesByProject,
		activityTypes,
		loading,
		reportDate,
		setReportDate,
		items,
		isLeave,
		setIsLeave,
		leaveType,
		setLeaveType,
		totalHours,
		submitting,
		permissionError,
		isDateAllowed,
		isValid,
		isDirty,
		dateStatuses,
		handleRowChange,
		addRow,
		removeRow,
		handleSaveDraft,
		handleSubmit,
		navigate
	};
};
