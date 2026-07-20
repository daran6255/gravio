import React from 'react';
import { DialogActions, Stack, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import { CancelButton, SubmitButton } from '../../../../common/button';
import type { ProjectTask } from '../../../../../models/projects/projectTask';

interface TaskCreateFooterProps {
	onClose: () => void;
	handleCreate: () => void;
	createMore: boolean;
	setCreateMore: (val: boolean) => void;
	submitting: boolean;
	isValid: boolean;
	parentTask?: ProjectTask | null;
}

export const TaskCreateFooter: React.FC<TaskCreateFooterProps> = ({
	onClose,
	handleCreate,
	createMore,
	setCreateMore,
	submitting,
	isValid,
	parentTask,
}) => {
	const theme = useTheme();

	return (
		<DialogActions
			sx={{
				px: 3,
				py: 2.25,
				borderTop: '1px solid',
				borderColor: theme.palette.divider,
				bgcolor: theme.palette.action.hover,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}
		>
			{/* Checkbox: Create more */}
			<FormControlLabel
				control={
					<Checkbox
						checked={createMore}
						onChange={(e) => setCreateMore(e.target.checked)}
						color="primary"
						size="small"
					/>
				}
				label={
					<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.secondary' }}>
						{parentTask ? 'Create more sub-tasks' : 'Create more tasks'}
					</Typography>
				}
			/>

			{/* Cancel and Create buttons */}
			<Stack direction="row" spacing={1.5}>
				<CancelButton
					onClick={onClose}
					disabled={submitting}
					sx={{
						fontWeight: 700,
						fontSize: '0.825rem',
						borderRadius: '6px',
						color: 'text.primary',
						px: 2.5,
						py: 0.75,
						border: '1px solid',
						borderColor: theme.palette.divider,
						bgcolor: theme.palette.action.hover,
						'&:hover': { bgcolor: theme.palette.action.selected },
					}}
				/>
				<SubmitButton
					onClick={handleCreate}
					loading={submitting}
					disabled={!isValid}
					disableElevation
					sx={{
						color: theme.palette.success.contrastText,
						fontSize: '0.825rem',
						px: 3,
						py: 0.75,
						borderRadius: '6px',
						bgcolor: theme.palette.success.main,
						'&:hover': { bgcolor: theme.palette.success.dark },
						'&.Mui-disabled': { bgcolor: theme.palette.action.disabledBackground },
					}}
				>
					{parentTask ? 'Create sub-task' : 'Create task'}
				</SubmitButton>
			</Stack>
		</DialogActions>
	);
};
