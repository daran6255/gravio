import React, { useState, useEffect } from 'react';
import {
	Button,
	TextField,
	Box,
	Typography,
	Stack,
	Avatar,
	Paper,
	Chip
} from '@mui/material';

interface TrainerNotesDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: (notes: string) => void;
	candidateName: string;
	periodName: string;
	periodTime: string;
	currentNotes: string;
}

import { useTheme, alpha } from '@mui/material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';

const TrainerNotesDialog: React.FC<TrainerNotesDialogProps> = ({
	open,
	onClose,
	onSave,
	candidateName,
	periodName,
	periodTime,
	currentNotes
}) => {
	const theme = useTheme();
	const [notes, setNotes] = useState(currentNotes);

	// Update notes when dialog opens with new data
	useEffect(() => {
		if (open) {
			setNotes(currentNotes);
		}
	}, [open, currentNotes]);

	const handleSave = () => {
		onSave(notes);
		onClose();
	};

	const handleCancel = () => {
		setNotes(currentNotes); // Reset to original
		onClose();
	};

	return (
		<BaseDialog
			open={open}
			onClose={handleCancel}
			title="Trainer Notes"
			subtitle="Add observations or performance notes for this student"
			maxWidth="sm"
			actions={
				<>
					<Button
						onClick={handleCancel}
						sx={{
							textTransform: 'none',
							color: 'text.secondary',
							fontWeight: 600,
							'&:hover': { bgcolor: alpha(theme.palette.action.active, 0.05) }
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						sx={{
							bgcolor: 'primary.main',
							'&:hover': { bgcolor: 'primary.dark' },
							textTransform: 'none',
							fontWeight: 700,
							boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
							px: 3,
							borderRadius: 1.5
						}}
					>
						Save Notes
					</Button>
				</>
			}
		>
			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
					<Avatar 
						sx={{ 
							width: 40, 
							height: 40, 
							bgcolor: alpha(theme.palette.primary.main, 0.1), 
							color: 'primary.main',
							fontWeight: 800,
							fontSize: '1rem',
							border: '2px solid',
							borderColor: alpha(theme.palette.primary.main, 0.2)
						}}
					>
						{candidateName[0]?.toUpperCase()}
					</Avatar>
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
							{candidateName}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
							Student Record
						</Typography>
					</Box>
				</Box>

				<Paper 
					elevation={0} 
					sx={{ 
						p: 2, 
						bgcolor: alpha(theme.palette.info.main, 0.05), 
						border: '1px solid',
						borderColor: alpha(theme.palette.info.main, 0.1),
						borderRadius: 2,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between'
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<Chip 
							label={periodName} 
							size="small" 
							sx={{ 
								bgcolor: 'info.main', 
								color: 'white', 
								fontWeight: 800,
								fontSize: '0.65rem'
							}} 
						/>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
							Training Session
						</Typography>
					</Stack>
					<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.02em' }}>
						{periodTime}
					</Typography>
				</Paper>
			</Box>

			<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
				Internal Observations
			</Typography>
			<TextField
				fullWidth
				multiline
				rows={5}
				placeholder="Add observations, performance notes, or any relevant comments about this student's attendance for this period..."
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				variant="outlined"
				autoFocus
				sx={{
					'& .MuiOutlinedInput-root': {
						fontSize: '0.875rem',
						borderRadius: 2,
						bgcolor: alpha(theme.palette.background.default, 0.3),
						'& fieldset': {
							borderColor: 'divider'
						},
						'&:hover fieldset': {
							borderColor: 'primary.main'
						},
						'&.Mui-focused fieldset': {
							borderWidth: '2px'
						}
					}
				}}
				helperText={`${notes.length} characters recorded`}
			/>
		</BaseDialog>
	);
};

export default TrainerNotesDialog;
