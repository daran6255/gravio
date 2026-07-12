import React from 'react';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { PlaylistAddCheckOutlined as EmptyIcon } from '@mui/icons-material';
import type { HRChecklistInstance } from '../../../../models/hr';
import TrackerCard from './TrackerCard';

interface TrackersGridProps {
	instances: HRChecklistInstance[];
	onSelect: (instance: HRChecklistInstance) => void;
	onLaunchClick: () => void;
}

const TrackersGrid: React.FC<TrackersGridProps> = ({ instances, onSelect, onLaunchClick }) => {
	const theme = useTheme();

	if (instances.length === 0) {
		return (
			<Box sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
				<EmptyIcon sx={{ fontSize: '3.5rem', color: 'text.disabled', mb: 2 }} />
				<Typography variant="h6" fontWeight={700}>No Active Checklists</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
					Launch an onboarding or offboarding tracker for any employee to begin.
				</Typography>
				<Button variant="contained" onClick={onLaunchClick}>Launch Now</Button>
			</Box>
		);
	}

	return (
		<Grid container spacing={3}>
			{instances.map((inst) => (
				<Grid size={{ xs: 12, sm: 6, md: 4 }} key={inst.id}>
					<TrackerCard instance={inst} onClick={() => onSelect(inst)} />
				</Grid>
			))}
		</Grid>
	);
};

export default TrackersGrid;
