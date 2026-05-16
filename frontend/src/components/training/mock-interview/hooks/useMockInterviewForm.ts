import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../../../store/store';
import { createMockInterview, updateMockInterview } from '../../../../store/slices/mockInterviewSlice';
import { createSkill } from '../../../../store/slices/skillSlice';
import { type Question, type Skill, type MockInterviewCreate } from '../../../../models/MockInterview';
import useToast from '../../../../hooks/useToast';
import trainingExtensionService from '../../../../services/trainingExtensionService';

export const useMockInterviewForm = (batchId: number, onClose: () => void, viewMode: boolean = false) => {
	const dispatch = useDispatch<AppDispatch>();
	const { user } = useSelector((state: RootState) => state.auth);
	const { currentMockInterview, loading: saveLoading } = useSelector((state: RootState) => state.mockInterviews);

	const defaultInterviewer = user?.full_name || user?.username || '';
	
	const [formData, setFormData] = useState<Partial<MockInterviewCreate>>({
		candidate_id: undefined,
		interviewer_name: defaultInterviewer,
		interview_date: new Date().toISOString(),
		interview_type: 'internal',
		interview_category: 'domain',
		status: 'pending',
		overall_rating: 0,
		feedback: '',
		start_time: new Date().toISOString(),
		end_time: undefined,
		duration_minutes: 0,
	});

	const [questions, setQuestions] = useState<Question[]>([]);
	const [skills, setSkills] = useState<Skill[]>([]);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [isPaused, setIsPaused] = useState(true);
	const timerRef = useRef<any>(null);

	const toggleTimer = useCallback(() => {
		setIsPaused(prev => !prev);
	}, []);

	const currentIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (currentMockInterview) {
			// Only initialize form state if the ID has changed (loading a new one)
			if (currentIdRef.current !== currentMockInterview.id) {
				setFormData({
					candidate_id: currentMockInterview.candidate_id,
					interviewer_name: currentMockInterview.interviewer_name || '',
					interview_date: currentMockInterview.interview_date,
					interview_type: currentMockInterview.interview_type || 'internal',
					interview_category: currentMockInterview.interview_category || 'domain',
					status: currentMockInterview.status,
					overall_rating: currentMockInterview.overall_rating || 0,
					feedback: currentMockInterview.feedback || '',
					start_time: currentMockInterview.start_time,
					end_time: currentMockInterview.end_time,
					duration_minutes: currentMockInterview.duration_minutes || 0,
					candidate_token: currentMockInterview.candidate_token
				});
				setQuestions(currentMockInterview.questions || []);
				setSkills(currentMockInterview.skills || []);
				setElapsedSeconds((currentMockInterview.duration_minutes || 0) * 60);
				currentIdRef.current = currentMockInterview.id;
			}
		} else {
			const now = new Date().toISOString();
			setFormData({
				candidate_id: undefined,
				interviewer_name: defaultInterviewer,
				interview_date: now,
				status: 'pending',
				overall_rating: 0,
				feedback: '',
				start_time: now,
				end_time: undefined,
				duration_minutes: 0,
			});
			setQuestions([{ question: '', answer: '' }]);
			setSkills([{ skill: '', level: 'Beginner', rating: 5 }]);
			setElapsedSeconds(0);
			setIsPaused(true);
			currentIdRef.current = null;

			// Start stopwatch & inactivity tracker
			timerRef.current = setInterval(() => {
				setIsPaused(paused => {
					if (!paused) {
						setElapsedSeconds(prev => prev + 1);
						
						// Synchronized Inactivity Check
						setInactivitySeconds(prevInactivity => {
							const nextInactivity = prevInactivity + 1;
							
							if (nextInactivity === 180) { // 3 Minutes - Automatic Pause
								setIsPaused(true);
								setShowInactivityAlert(true);
								setShowTimeRunningAlert(false);
							} else if (nextInactivity === 120) { // 2 Minutes - Warning
								setShowTimeRunningAlert(true);
							}
							
							return nextInactivity;
						});
					}
					return paused;
				});
			}, 1000);
		}
		setErrors({});

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [currentMockInterview, defaultInterviewer]);
 
	const [isDirty, setIsDirty] = useState(false);
	const [_inactivitySeconds, setInactivitySeconds] = useState(0);
	const [showStartReminder, setShowStartReminder] = useState(false);
	const [showInactivityAlert, setShowInactivityAlert] = useState(false);
	const [showTimeRunningAlert, setShowTimeRunningAlert] = useState(false);

	const updateInteraction = useCallback(() => {
		setInactivitySeconds(0);
		setIsDirty(true);
		setShowTimeRunningAlert(false);
		setShowInactivityAlert(false);
	}, []);

	useEffect(() => {
		if (isDirty && isPaused && elapsedSeconds === 0 && !currentMockInterview) {
			setShowStartReminder(true);
		} else {
			setShowStartReminder(false);
		}
	}, [isDirty, isPaused, elapsedSeconds, currentMockInterview]);

	const lastSavedDataRef = useRef<string>('');

	// Trainer Auto-save (Enterprise-grade Deferred Sync)
	useEffect(() => {
		if (!currentMockInterview || viewMode || !isDirty) return;

		// Skip if data hasn't changed since last meaningful save (prevent redundant CPU/Network usage)
		const currentDataStr = JSON.stringify({ questions, skills });
		if (currentDataStr === lastSavedDataRef.current) return;

		const timer = setTimeout(async () => {
			try {
				await handleSubmit(false); // Save without closing
				lastSavedDataRef.current = currentDataStr;
			} catch (e) {
				console.error('Auto-save failed', e);
			}
		}, 5000); // 5 second window for enterprise stability

		return () => clearTimeout(timer);
	}, [questions, skills, currentMockInterview?.id, isDirty, viewMode]);

	const toast = useToast();
	const { aggregatedSkills: masterSkills } = useSelector((state: RootState) => state.skills);

	const refreshQuestions = useCallback(async (showToast = false) => {
		if (!currentMockInterview) return;
		try {
			const updated = await trainingExtensionService.getMockInterview(currentMockInterview.id);
			if (updated.questions) {
				setQuestions(updated.questions);
				if (showToast) toast.success('Synchronized with candidate answers');
			}
		} catch (error) {
			console.error('Failed to sync questions', error);
		}
	}, [currentMockInterview, toast]);

	// Trainer Auto-sync (pull candidate answers automatically every 10s)
	useEffect(() => {
		if (!currentMockInterview?.candidate_token || viewMode || !currentMockInterview?.id) return;

		const interval = setInterval(() => {
			// Don't auto-sync if trainer is currently typing (dirty state)
			// to avoid jumping inputs
			if (!isDirty) {
				refreshQuestions(false); // No toast for auto-sync
			}
		}, 10000); // 10 second poll for candidate answers

		return () => clearInterval(interval);
	}, [currentMockInterview?.candidate_token, currentMockInterview?.id, isDirty, viewMode, refreshQuestions]);

	const handleChange = useCallback((field: keyof MockInterviewCreate, value: any) => {
		updateInteraction();
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => {
			if (prev[field]) {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			}
			return prev;
		});
	}, [updateInteraction]);

	const handleQuestionChange = useCallback((index: number, field: keyof Question, value: string) => {
		updateInteraction();
		setQuestions((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
	}, [updateInteraction]);

	const addQuestion = useCallback(() => {
		// Adding a question structure is a layout change, not a data change yet
		setQuestions((prev) => [...prev, { question: '', answer: '' }]);
	}, []);
	
	const removeQuestion = useCallback((index: number) => {
		updateInteraction();
		setQuestions((prev) => prev.filter((_, i) => i !== index));
	}, [updateInteraction]);

	const handleSkillChange = useCallback((index: number, field: keyof Skill, value: any) => {
		updateInteraction();
		setSkills((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
	}, [updateInteraction]);

	const addSkill = useCallback(() => setSkills((prev) => [...prev, { skill: '', level: 'Beginner', rating: 5 }]), []);
	const removeSkill = useCallback((index: number) => setSkills((prev) => prev.filter((_, i) => i !== index)), []);

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.candidate_id) newErrors.candidate_id = 'Candidate selection is required';
		if (!formData.interviewer_name) newErrors.interviewer_name = "Interviewer name is required";
		if (!formData.interview_date) newErrors.interview_date = "Interview date is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (shouldClose = true) => {
		if (!validate()) {
			toast.error('Please fix the errors in the form');
			return;
		}

		const now = new Date().toISOString();
		const finalDuration = Math.ceil(elapsedSeconds / 60);

		// Handle new skills creation
		const newSkillsToAdd = skills
			.map(s => s.skill.trim())
			.filter(s => s && !masterSkills.includes(s));
		
		for (const skillName of Array.from(new Set(newSkillsToAdd))) {
			try {
				await dispatch(createSkill({ name: skillName, is_verified: false })).unwrap();
			} catch (e) {
				console.error(`Failed to create skill: ${skillName}`, e);
			}
		}

		const payload: MockInterviewCreate = {
			batch_id: batchId,
			candidate_id: formData.candidate_id!,
			interviewer_name: formData.interviewer_name!,
			interview_type: formData.interview_type || 'internal',
			interview_category: formData.interview_category || 'domain',
			status: formData.status!,
			overall_rating: formData.overall_rating!,
			feedback: formData.feedback!,
			questions: questions.filter(q => q.question.trim()),
			skills: skills.filter(s => s.skill.trim()),
			interview_date: formData.interview_date!,
			start_time: formData.start_time,
			end_time: currentMockInterview && !isPaused ? now : (formData.end_time || now),
			duration_minutes: finalDuration
		};

		try {
			let result;
			if (currentMockInterview) {
				result = await dispatch(updateMockInterview({ id: currentMockInterview.id, data: payload })).unwrap();
			} else {
				result = await dispatch(createMockInterview(payload)).unwrap();
			}
			setIsDirty(false); // Reset dirty flag after successful save
			if (shouldClose) {
				onClose();
			}
			return result;
		} catch (error: any) {
			toast.error(error?.message || 'Failed to save mock interview');
			return null;
		}
	};

	const handleGenerateLink = async () => {
		let interviewId = currentMockInterview?.id;
		
		if (!interviewId) {
			// Auto-save first to create the record
			const saved = await handleSubmit(false);
			if (!saved) return;
			interviewId = saved.id;
		}

		try {
			const updated = await trainingExtensionService.generateMockInterviewToken(interviewId);
			setFormData(prev => ({ ...prev, candidate_token: updated.candidate_token }));
			toast.success('Shareable link generated!');
		} catch (error: any) {
			toast.error(error?.message || 'Failed to generate link');
		}
	};

	return {
		formData,
		questions,
		skills,
		errors,
		saveLoading,
		elapsedSeconds,
		isPaused,
		showStartReminder,
		showInactivityAlert,
		showTimeRunningAlert,
		setShowStartReminder,
		setShowInactivityAlert,
		setShowTimeRunningAlert,
		toggleTimer,
		handleChange,
		handleQuestionChange,
		addQuestion,
		removeQuestion,
		handleSkillChange,
		addSkill,
		removeSkill,
		handleSubmit,
		handleGenerateLink,
		refreshQuestions,
		updateInteraction
	};
};

