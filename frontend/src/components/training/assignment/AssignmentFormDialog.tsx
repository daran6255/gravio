import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Typography,
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Box
} from '@mui/material';

import type { TrainingBatch } from '../../../models/training';

interface AssignmentFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: {
		assignmentName: string;
		courses: string[];
		description: string;
		date: string;
		maxMarks: number;
	}) => void;
	batch: TrainingBatch;
}

const AssignmentFormDialog: React.FC<AssignmentFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	batch
}) => {
	const [formData, setFormData] = useState({
		assignmentName: '',
		courses: [] as string[],
		description: '',
		date: new Date().toISOString().split('T')[0],
		maxMarks: 100
	});

	useEffect(() => {
		if (!open) {
			// Reset form when dialog closes
			setFormData({
				assignmentName: '',
				courses: [],
				description: '',
				date: new Date().toISOString().split('T')[0],
				maxMarks: 100
			});
		}
	}, [open]);

	const handleSubmit = () => {
		if (!formData.assignmentName.trim() || formData.courses.length === 0) {
			return;
		}
		onSubmit(formData);
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ bgcolor: '#232f3e', borderBottom: '1px solid #16191f', p: 2 }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
						Configure Assignment Event
					</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent sx={{ pt: 3, pb: 2 }}>
				<Stack spacing={3}>
					<TextField
						fullWidth
						autoFocus
						label="Assignment Title"
						placeholder="e.g. Week 4 - Python fundamentals"
						value={formData.assignmentName}
						onChange={(e) => setFormData({ ...formData, assignmentName: e.target.value })}
						helperText="Give a clear name for this assignment event"
					/>
					<FormControl fullWidth>
						<InputLabel>Target Courses</InputLabel>
						<Select
							multiple
							value={formData.courses}
							label="Target Courses"
							onChange={(e) => setFormData({
								...formData,
								courses: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
							})}
							renderValue={(selected) => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map((value) => (
										<Typography key={value} sx={{
											bgcolor: '#f1faff',
											border: '1px solid #007eb9',
											px: 1,
											borderRadius: '4px',
											fontSize: '0.8rem',
											color: '#007eb9',
											fontWeight: 600
										}}>
											{value}
										</Typography>
									))}
								</Box>
							)}
						>
							{batch.courses?.map(c => {
								const name = typeof c === 'string' ? c : c.name;
								return <MenuItem key={name} value={name}>{name}</MenuItem>;
							})}
						</Select>
					</FormControl>
					<TextField
						fullWidth
						label="Context / Description"
						multiline
						rows={2}
						value={formData.description}
						onChange={(e) => setFormData({ ...formData, description: e.target.value })}
					/>
					<Grid container spacing={2}>
						<Grid size={{ xs: 6 }}>
							<TextField
								fullWidth
								label="Date Scheduled"
								type="date"
								value={formData.date}
								onChange={(e) => setFormData({ ...formData, date: e.target.value })}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid size={{ xs: 6 }}>
							<TextField
								fullWidth
								label="Max Marks (per course)"
								type="number"
								value={formData.maxMarks}
								onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
								helperText="Final score is calculated as average across all courses"
							/>
						</Grid>
					</Grid>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ p: 2, borderTop: '1px solid #eaeded', bgcolor: '#f2f3f3' }}>
				<Button onClick={onClose} sx={{ color: '#545b64', textTransform: 'none', fontWeight: 700 }}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={!formData.assignmentName.trim() || formData.courses.length === 0}
					sx={{
						bgcolor: '#ff9900',
						color: '#232f3e',
						'&:hover': { bgcolor: '#ec7211' },
						textTransform: 'none',
						fontWeight: 800,
						boxShadow: 'none'
					}}
				>
					Confirm configuration
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AssignmentFormDialog;
