import { useState } from 'react';

/** Tracks whether a dismissible banner should show, persisting the dismissal in localStorage. */
export function useDismissibleBanner(storageKey: string) {
	const [show, setShow] = useState(() => {
		if (typeof window === 'undefined') return false;
		return !localStorage.getItem(storageKey);
	});

	const dismiss = () => {
		localStorage.setItem(storageKey, 'true');
		setShow(false);
	};

	return { show, dismiss };
}

export default useDismissibleBanner;
