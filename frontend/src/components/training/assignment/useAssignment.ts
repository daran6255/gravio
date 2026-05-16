import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import trainingExtensionService from '../../../services/trainingExtensionService';
import userService from '../../../services/userService';
import type { TrainingBatch, CandidateAllocation, TrainingAssignment } from '../../../models/training';
import type { User } from '../../../models/user';
import { useAppSelector } from '../../../store/hooks';

export const useAssignment = (batch: TrainingBatch, allocations: CandidateAllocation[]) => {
	const { enqueueSnackbar } = useSnackbar();
	const user = useAppSelector((state) => state.auth.user);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
	const [trainers, setTrainers] = useState<User[]>([]);

	// Form state for creating/editing an assignment event
	const [activeAssignmentName, setActiveAssignmentName] = useState('');
	const [activeDate, setActiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
	const [activeMaxMarks, setActiveMaxMarks] = useState(100);
	const [activeCourses, setActiveCourses] = useState<string[]>([]);
	const [activeTrainerId, setActiveTrainerId] = useState<number | ''>('');
	const [activeDescription, setActiveDescription] = useState('');

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [assignmentData, userData] = await Promise.all([
				trainingExtensionService.getAssignments(batch.id),
				userService.getAll(0, 100)
			]);

			setAssignments(assignmentData);
			setTrainers(userData.items.filter(u => u.role === 'trainer' || u.role === 'admin' || u.role === 'manager'));

			const names = Array.from(new Set(assignmentData.map(a => a.assignment_name)));
			if (names.length > 0) {
				const name = names[0];
				const firstMatch = assignmentData.find(a => a.assignment_name === name);
				if (firstMatch) {
					setActiveAssignmentName(name);
					setActiveDate(firstMatch.assignment_date);
					const coursesCount = Array.isArray(firstMatch.course_name) ? firstMatch.course_name.length : (firstMatch.course_name ? 1 : 1);
					setActiveMaxMarks(firstMatch.max_marks / (coursesCount || 1));
					setActiveCourses(Array.isArray(firstMatch.course_name) ? firstMatch.course_name : (firstMatch.course_name ? [firstMatch.course_name as any] : []));
					setActiveTrainerId(firstMatch.trainer_id || '');
					setActiveDescription(firstMatch.description || '');
				}
			} else {
				setActiveAssignmentName('New Assignment');
				if (batch.courses && batch.courses.length > 0) {
					const firstCourse = batch.courses[0];
					setActiveCourses([typeof firstCourse === 'string' ? firstCourse : firstCourse.name]);
				}
				if (user && (user.role === 'trainer' || user.role === 'admin' || user.role === 'manager')) {
					setActiveTrainerId(user.id);
				}
			}
		} catch (error) {
			console.error('Failed to fetch data', error);
			enqueueSnackbar('Failed to load assignment data', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [batch.id, batch.courses, user, enqueueSnackbar]);

	useEffect(() => {
		if (batch.id) {
			fetchData();
		}
	}, [batch.id, fetchData]);

	const handleSelectAssignment = useCallback((name: string) => {
		setActiveAssignmentName(name);
		const firstMatch = assignments.find(a => a.assignment_name === name);
		if (firstMatch) {
			setActiveDate(firstMatch.assignment_date);
			const coursesCount = Array.isArray(firstMatch.course_name) ? firstMatch.course_name.length : (firstMatch.course_name ? 1 : 1);
			setActiveMaxMarks(firstMatch.max_marks / (coursesCount || 1));
			setActiveCourses(Array.isArray(firstMatch.course_name) ? firstMatch.course_name : (firstMatch.course_name ? [firstMatch.course_name as any] : []));
			setActiveTrainerId(firstMatch.trainer_id || '');
			setActiveDescription(firstMatch.description || '');
		}
	}, [assignments]);

	const assignmentNames = useMemo(() => {
		return Array.from(new Set(assignments.map(a => a.assignment_name)));
	}, [assignments]);

	const handleMarkChange = useCallback((candidateId: number, field: keyof TrainingAssignment | 'remarks' | 'course_mark', value: any, courseName?: string) => {
		setAssignments(prev => {
			const existingIdx = prev.findIndex(a => a.candidate_id === candidateId && a.assignment_name === activeAssignmentName);
			const updated = [...prev];

			if (existingIdx >= 0) {
				if (field === 'remarks') {
					updated[existingIdx] = {
						...updated[existingIdx],
						others: { ...(updated[existingIdx].others || {}), remarks: value }
					};
				} else if (field === 'course_mark' && courseName) {
					const currentCourseMarks = updated[existingIdx].course_marks || {};
					const newCourseMarks = { ...currentCourseMarks, [courseName]: value };
					const totalMarks = Object.values(newCourseMarks).reduce((sum, m) => sum + (m as number), 0);
					updated[existingIdx] = {
						...updated[existingIdx],
						course_marks: newCourseMarks,
						marks_obtained: totalMarks
					};
				} else {
					updated[existingIdx] = { ...updated[existingIdx], [field]: value };
				}
			} else {
				const newRecord: TrainingAssignment = {
					batch_id: batch.id,
					candidate_id: candidateId,
					assignment_name: activeAssignmentName,
					assignment_date: activeDate,
					marks_obtained: 0,
					max_marks: activeMaxMarks,
					course_name: activeCourses,
					trainer_id: activeTrainerId || undefined,
					description: activeDescription,
					submission_date: format(new Date(), 'yyyy-MM-dd'),
					course_marks: {}
				};

				if (field === 'remarks') {
					newRecord.others = { remarks: value };
				} else if (field === 'course_mark' && courseName) {
					newRecord.course_marks = { [courseName]: value };
					newRecord.marks_obtained = value;
				} else {
					(newRecord as any)[field] = value;
				}
				updated.push(newRecord);
			}
			return updated;
		});
	}, [activeAssignmentName, activeDate, activeMaxMarks, activeCourses, activeTrainerId, activeDescription, batch.id]);

	const handleSave = async () => {
		if (!activeAssignmentName) {
			enqueueSnackbar('Assignment name is required', { variant: 'warning' });
			return;
		}

		setSaving(true);
		try {
			const assignmentsToSave = allocations.map(allocation => {
				const existing = assignments.find(a => a.candidate_id === allocation.candidate_id && a.assignment_name === activeAssignmentName);
				return {
					batch_id: batch.id,
					candidate_id: allocation.candidate_id,
					assignment_name: activeAssignmentName,
					assignment_date: activeDate,
					max_marks: activeMaxMarks * (activeCourses.length || 1),
					course_name: activeCourses,
					trainer_id: activeTrainerId || undefined,
					description: activeDescription,
					course_marks: existing?.course_marks || {},
					marks_obtained: existing?.marks_obtained || 0,
					submission_date: existing?.submission_date || activeDate,
					others: existing?.others || {}
				};
			});

			await trainingExtensionService.updateBulkAssignments(assignmentsToSave as any);
			enqueueSnackbar('Assignments saved successfully', { variant: 'success' });
			fetchData();
		} catch (error) {
			console.error('Failed to save assignments', error);
			enqueueSnackbar('Failed to save assignments', { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteAssignment = async () => {
		if (!activeAssignmentName) return;
		if (!window.confirm(`Are you sure you want to delete the assignment "${activeAssignmentName}"? This will remove all marks for all students.`)) return;

		setSaving(true);
		try {
			await trainingExtensionService.deleteAssignment(batch.id, activeAssignmentName);
			enqueueSnackbar('Assignment deleted successfully', { variant: 'success' });
			setActiveAssignmentName('');
			fetchData();
		} catch (error) {
			console.error('Failed to delete assignment', error);
			enqueueSnackbar('Failed to delete assignment', { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const stats = useMemo(() => {
		if (!activeAssignmentName) return { totalAssignments: assignmentNames.length, submittedCount: 0, pendingCount: allocations.length };

		const currentAssignments = assignments.filter(a => a.assignment_name === activeAssignmentName);
		const submittedCount = currentAssignments.length;
		const pendingCount = Math.max(0, allocations.length - submittedCount);

		return {
			totalAssignments: assignmentNames.length,
			submittedCount,
			pendingCount
		};
	}, [assignmentNames.length, activeAssignmentName, assignments, allocations.length]);

	return {
		loading,
		saving,
		assignments,
		trainers,
		activeAssignmentName,
		activeDate,
		activeMaxMarks,
		activeCourses,
		activeTrainerId,
		activeDescription,
		assignmentNames,
		stats,
		setActiveDate,
		setActiveCourses,
		setActiveTrainerId,
		setActiveMaxMarks,
		setActiveDescription,
		handleSelectAssignment,
		handleMarkChange,
		handleSave,
		handleDeleteAssignment,
		setActiveAssignmentName
	};
};
