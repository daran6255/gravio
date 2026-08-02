import React, { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { prefersReducedMotion } from './motion';

/** Crossfades statusLabel text on change (e.g. "Searching CRM…" -> "Creating task…") instead
 * of jump-cutting -- a single node whose opacity/translate is toggled around the text swap,
 * skipped entirely under reduced-motion. Shared across every IRIS chat surface. */
export const StatusLabel: React.FC<{ label: string }> = ({ label }) => {
	const reduced = useRef(prefersReducedMotion());
	const [display, setDisplay] = useState(label);
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		if (label === display) return;
		if (reduced.current) {
			setDisplay(label);
			return;
		}
		setVisible(false);
		const t = setTimeout(() => {
			setDisplay(label);
			setVisible(true);
		}, 140);
		return () => clearTimeout(t);
	}, [label, display]);

	return (
		<Typography
			variant="caption"
			sx={{
				color: 'text.secondary',
				fontWeight: 600,
				opacity: visible ? 1 : 0,
				transform: visible ? 'translateY(0)' : 'translateY(-3px)',
				transition: 'opacity 140ms ease, transform 140ms ease',
			}}
		>
			{display}
		</Typography>
	);
};

export default StatusLabel;
