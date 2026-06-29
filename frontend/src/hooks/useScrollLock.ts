import { useEffect } from 'react';

/**
 * A custom hook to lock body/HTML scroll and prevent scroll chaining at boundary containers.
 * @param open - Boolean flag indicating if scroll lock should be active.
 * @param containerSelectorClass - CSS class name of the target paper/dialog to scope internal scrolls (e.g. 'MuiDrawer-paper').
 */
export const useScrollLock = (open: boolean, containerSelectorClass: string = 'MuiDrawer-paper') => {
	useEffect(() => {
		if (!open) return;

		const prevBodyOverflow = document.body.style.overflow;
		const prevHtmlOverflow = document.documentElement.style.overflow;
		
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';

		let touchStartY = 0;

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				touchStartY = e.touches[0].clientY;
			}
		};

		const preventDefault = (e: any) => {
			let el = e.target as HTMLElement | null;
			let isInsideContainer = false;
			let scrollableContainer: HTMLElement | null = null;

			while (el) {
				if (el.classList && el.classList.contains(containerSelectorClass)) {
					isInsideContainer = true;
				}
				if (el.scrollHeight > el.clientHeight) {
					const overflowY = window.getComputedStyle(el).overflowY;
					if (overflowY === 'auto' || overflowY === 'scroll') {
						if (!scrollableContainer) {
							scrollableContainer = el;
						}
					}
				}
				el = el.parentElement;
			}

			if (!isInsideContainer) {
				e.preventDefault();
				return;
			}

			if (scrollableContainer) {
				const { scrollTop, scrollHeight, clientHeight } = scrollableContainer;
				
				let deltaY = 0;
				if (e.type === 'wheel') {
					deltaY = e.deltaY;
				} else if (e.type === 'touchmove' && e.touches.length === 1) {
					const touchY = e.touches[0].clientY;
					deltaY = touchStartY - touchY;
				}

				// Scrolling down and reached bottom
				if (deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1) {
					e.preventDefault();
				}
				// Scrolling up and reached top
				else if (deltaY < 0 && scrollTop <= 0) {
					e.preventDefault();
				}
			} else {
				e.preventDefault();
			}
		};

		window.addEventListener('wheel', preventDefault, { passive: false });
		window.addEventListener('touchstart', handleTouchStart, { passive: true });
		window.addEventListener('touchmove', preventDefault, { passive: false });

		return () => {
			document.body.style.overflow = prevBodyOverflow;
			document.documentElement.style.overflow = prevHtmlOverflow;
			window.removeEventListener('wheel', preventDefault);
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchmove', preventDefault);
		};
	}, [open, containerSelectorClass]);
};

export default useScrollLock;
