import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addNotification, setLastCandidateId, fetchNotifications } from '../store/slices/notificationSlice';
import candidateService from '../services/candidateService';

/**
 * Hook to watch for notifications:
 * 1. Persistent backend notifications (Approval/Rejection/Permissions)
 * 2. New candidate registrations (client-side polling)
 */
export const useNotificationWatcher = () => {
	const dispatch = useAppDispatch();
	const { lastCandidateId } = useAppSelector((state) => state.notifications);
	const { user } = useAppSelector((state) => state.auth);

	const lastSeenIdRef = useRef<string | null>(lastCandidateId);
	const candidatePollingActive = useRef(false);
	const notifPollingActive = useRef(false);

	// Sync ref with Redux state
	useEffect(() => {
		lastSeenIdRef.current = lastCandidateId;
	}, [lastCandidateId]);

	useEffect(() => {
		// Sync with localStorage on mount if Redux state is empty
		const savedId = localStorage.getItem('winvinaya_last_candidate_id');
		if (!lastSeenIdRef.current && savedId) {
			dispatch(setLastCandidateId(savedId));
			lastSeenIdRef.current = savedId;
		}
	}, [dispatch]);

	useEffect(() => {
		const checkForNewCandidates = async () => {
			if (candidatePollingActive.current) return;

			try {
				candidatePollingActive.current = true;
				const response = await candidateService.getAll(0, 5, undefined, 'created_at', 'desc');
				const items = response.items || [];

				if (items.length > 0) {
					const latestItem = items[0];
					const latestId = latestItem.public_id;

					if (lastSeenIdRef.current === null) {
						dispatch(setLastCandidateId(latestId));
						localStorage.setItem('winvinaya_last_candidate_id', latestId);
						lastSeenIdRef.current = latestId;
						return;
					}

					if (latestId !== lastSeenIdRef.current) {
						const newItems = [];
						for (const candidate of items) {
							if (candidate.public_id === lastSeenIdRef.current) break;
							newItems.push(candidate);
						}

						if (newItems.length > 0) {
							newItems.reverse().forEach((candidate) => {
								dispatch(addNotification({
									id: `reg-${candidate.public_id}-${Date.now()}`,
									title: 'New Candidate Registered',
									message: `${candidate.name} has registered.`,
									timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
									type: 'registration',
									link: `/candidates/${candidate.public_id}`
								}));
							});

							dispatch(setLastCandidateId(latestId));
							localStorage.setItem('winvinaya_last_candidate_id', latestId);
							lastSeenIdRef.current = latestId;
						}
					}
				} else if (lastSeenIdRef.current === null) {
					const baseBaseline = 'EMPTY_DB';
					dispatch(setLastCandidateId(baseBaseline));
					localStorage.setItem('winvinaya_last_candidate_id', baseBaseline);
					lastSeenIdRef.current = baseBaseline;
				}
			} catch (error) {
				console.error('[NotificationWatcher] Candidate poll error:', error);
			} finally {
				candidatePollingActive.current = false;
			}
		};

		const checkBackendNotifications = async () => {
			if (!user || notifPollingActive.current) return;

			try {
				notifPollingActive.current = true;
				await dispatch(fetchNotifications());
			} catch (error) {
				console.error('[NotificationWatcher] Backend notification poll error:', error);
			} finally {
				notifPollingActive.current = false;
			}
		};

		// Initial checks
		const initialCandidateTimeout = setTimeout(checkForNewCandidates, 2000);
		const initialNotifTimeout = setTimeout(checkBackendNotifications, 1000);

		// Intervals
		const candidateIntervalId = setInterval(checkForNewCandidates, 60000); // 60s for candidates
		const notifIntervalId = setInterval(checkBackendNotifications, 30000); // 30s for personal notifs

		return () => {
			clearTimeout(initialCandidateTimeout);
			clearTimeout(initialNotifTimeout);
			clearInterval(candidateIntervalId);
			clearInterval(notifIntervalId);
		};
	}, [dispatch, user]);
};
