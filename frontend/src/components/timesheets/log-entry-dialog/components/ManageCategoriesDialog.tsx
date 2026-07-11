import React from 'react';
import { Button, Stack, Box, Typography, IconButton } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { BaseDialog, ConfirmationDialog } from '../../../common/dialogbox';
import type { TimesheetCategory } from '../../../../models/timesheet';

interface ManageCategoriesDialogProps {
	open: boolean;
	onClose: () => void;
	categories: TimesheetCategory[];
	deleteTarget: TimesheetCategory | null;
	onRequestDelete: (category: TimesheetCategory) => void;
	onCancelDelete: () => void;
	onConfirmDelete: () => void;
	deleting: boolean;
}

// Manage/delete the categories the current user has personally added, plus the
// delete-confirmation dialog for that action.
export const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
	open,
	onClose,
	categories,
	deleteTarget,
	onRequestDelete,
	onCancelDelete,
	onConfirmDelete,
	deleting
}) => {
	return (
		<>
			<BaseDialog
				open={open}
				onClose={onClose}
				title="Manage My Categories"
				subtitle="Delete personal categories you no longer need. Organization-wide defaults can't be removed here."
				maxWidth="xs"
				actions={
					<Button onClick={onClose} sx={{ fontWeight: 700 }}>
						Close
					</Button>
				}
			>
				<Stack spacing={0.5}>
					{categories.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							You haven't added any personal categories yet.
						</Typography>
					) : (
						categories.map((c) => (
							<Stack
								key={c.id}
								direction="row"
								alignItems="center"
								justifyContent="space-between"
								sx={{ py: 0.75 }}
							>
								<Stack direction="row" spacing={1.5} alignItems="center">
									<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color || 'text.disabled', flexShrink: 0 }} />
									<Typography variant="body2">{c.name}</Typography>
								</Stack>
								<IconButton size="small" onClick={() => onRequestDelete(c)}>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Stack>
						))
					)}
				</Stack>
			</BaseDialog>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={onCancelDelete}
				onConfirm={onConfirmDelete}
				title="Delete Category"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? Existing time logs using this category will keep their history but lose the category label.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</>
	);
};
