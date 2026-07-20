import React from 'react';
import { Button, TextField, Stack, Box, Alert, Typography, CircularProgress, alpha, useTheme } from '@mui/material';
import { BaseDialog } from '../../../common/dialogbox';
import { CATEGORY_COLORS } from '../utils';

interface AddCategoryDialogProps {
	open: boolean;
	onClose: () => void;
	name: string;
	onNameChange: (name: string) => void;
	color: string;
	onColorChange: (color: string) => void;
	error: string | null;
	creating: boolean;
	onCreate: () => void;
}

// Inline "add category" flow, triggered from the General row's Category select.
export const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
	open,
	onClose,
	name,
	onNameChange,
	color,
	onColorChange,
	error,
	creating,
	onCreate
}) => {
	const theme = useTheme();
	return (
		<BaseDialog
			open={open}
			onClose={() => {
				if (creating) return;
				onClose();
			}}
			title="Add Category"
			subtitle="Create a personal category for logging general/internal time"
			maxWidth="xs"
			loading={creating}
			actions={
				<>
					<Button onClick={onClose} disabled={creating}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={onCreate}
						disabled={creating || !name.trim()}
						sx={{ fontWeight: 700, borderRadius: 4 }}
					>
						{creating ? <CircularProgress size={18} /> : 'Create'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
				{error && (
					<Alert severity="error" sx={{ borderRadius: 4 }}>
						{error}
					</Alert>
				)}
				<TextField
					label="Category Name"
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					fullWidth
					required
					autoFocus
					disabled={creating}
					placeholder="e.g. Meetings, Training, Admin"
				/>
				<Box>
					<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
						Color
					</Typography>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						{CATEGORY_COLORS.map((c) => (
							<Box
								key={c}
								onClick={() => !creating && onColorChange(c)}
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									bgcolor: c,
									cursor: creating ? 'default' : 'pointer',
									border: '2px solid',
									borderColor: color === c ? 'text.primary' : 'transparent',
									boxShadow: color === c ? `0 0 0 2px ${alpha(theme.palette.common.black, 0.05)}` : 'none'
								}}
							/>
						))}
					</Stack>
				</Box>
			</Stack>
		</BaseDialog>
	);
};
