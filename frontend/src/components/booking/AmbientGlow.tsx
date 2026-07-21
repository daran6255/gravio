import React from 'react';
import { Box } from '@mui/material';

/** Two soft, blurred radial-gradient blobs behind a page's content — the same
 * "aurora" recipe used by AuthBrandPanel/LeaveSnapshotBar elsewhere in the app,
 * just scaled up for a full page. Purely decorative: absolutely positioned,
 * `pointerEvents: 'none'`, sits behind content via a negative z-index. */
const AmbientGlow: React.FC = () => (
	<>
		<Box
			sx={{
				position: 'fixed', top: '-10%', left: '-10%', width: '45vw', height: '45vw', maxWidth: 600, maxHeight: 600,
				borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,124,246,0.12) 0%, rgba(0,0,0,0) 70%)',
				filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
				animation: 'ambientDrift 25s infinite alternate ease-in-out',
				'@keyframes ambientDrift': {
					'0%': { transform: 'translate(0, 0) scale(1)' },
					'100%': { transform: 'translate(4%, 4%) scale(1.08)' },
				},
			}}
		/>
		<Box
			sx={{
				position: 'fixed', bottom: '-15%', right: '-10%', width: '40vw', height: '40vw', maxWidth: 550, maxHeight: 550,
				borderRadius: '50%', background: 'radial-gradient(circle, rgba(78,168,255,0.08) 0%, rgba(0,0,0,0) 70%)',
				filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0,
				animation: 'ambientDriftReverse 20s infinite alternate-reverse ease-in-out',
				'@keyframes ambientDriftReverse': {
					'0%': { transform: 'translate(0, 0) scale(1)' },
					'100%': { transform: 'translate(-4%, -4%) scale(1.1)' },
				},
			}}
		/>
	</>
);

export default AmbientGlow;
