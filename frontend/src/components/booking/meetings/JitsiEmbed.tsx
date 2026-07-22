import React, { useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';

declare global {
	interface Window {
		JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
			dispose: () => void;
		};
	}
}

const scriptPromiseByDomain = new Map<string, Promise<void>>();

/** Loads the Jitsi IFrame External API script for a given domain exactly once,
 * regardless of how many JitsiEmbed instances mount/unmount over the page's life. */
function loadExternalApiScript(domain: string): Promise<void> {
	let promise = scriptPromiseByDomain.get(domain);
	if (promise) return promise;

	promise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(`script[data-jitsi-domain="${domain}"]`);
		if (existing) {
			resolve();
			return;
		}
		const script = document.createElement('script');
		script.src = `https://${domain}/external_api.js`;
		script.async = true;
		script.dataset.jitsiDomain = domain;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load the video call script.'));
		document.head.appendChild(script);
	});
	scriptPromiseByDomain.set(domain, promise);
	return promise;
}

interface JitsiEmbedProps {
	domain: string;
	room: string;
	displayName?: string;
	subject?: string;
	onLoadError?: () => void;
}

/** Embeds a Jitsi call via the official IFrame External API (not a raw link in a new
 * tab) so we can strip Jitsi's own branding — this is the only supported way to do
 * that even on the free public meet.jit.si server. */
const JitsiEmbed: React.FC<JitsiEmbedProps> = ({ domain, room, displayName, subject, onLoadError }) => {
	const theme = useTheme();
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let disposed = false;
		let apiInstance: { dispose: () => void } | null = null;

		loadExternalApiScript(domain)
			.then(() => {
				if (disposed || !containerRef.current || !window.JitsiMeetExternalAPI) return;
				apiInstance = new window.JitsiMeetExternalAPI(domain, {
					roomName: room,
					parentNode: containerRef.current,
					width: '100%',
					height: '100%',
					userInfo: displayName ? { displayName } : undefined,
					configOverwrite: {
						prejoinPageEnabled: true,
						disableDeepLinking: true,
						subject,
					},
					interfaceConfigOverwrite: {
						SHOW_JITSI_WATERMARK: false,
						SHOW_WATERMARK_FOR_GUESTS: false,
						SHOW_BRAND_WATERMARK: false,
						SHOW_POWERED_BY: false,
						HIDE_DEEP_LINKING_LOGO: true,
						MOBILE_APP_PROMO: false,
						DEFAULT_LOGO_URL: '',
						DEFAULT_BACKGROUND: theme.palette.background.default,
					},
				});
			})
			.catch(() => {
				if (!disposed) onLoadError?.();
			});

		return () => {
			disposed = true;
			apiInstance?.dispose();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domain, room]);

	return <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />;
};

export default JitsiEmbed;
