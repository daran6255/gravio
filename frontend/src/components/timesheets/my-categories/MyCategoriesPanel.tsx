import React from 'react';
import {
	Paper,
	Typography,
	TextField,
	Button,
	IconButton,
	Box,
	Stack,
	Grid,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Alert,
	useTheme
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ConfirmationDialog } from '../../common/dialogbox';
import { useMyCategories, CATEGORY_COLORS } from './hooks/useMyCategories';

const MyCategoriesPanel: React.FC = () => {
	const theme = useTheme();
	
	const {
		newCategoryName, setNewCategoryName,
		selectedColor, setSelectedColor,
		error,
		submitting,
		deleteTarget, setDeleteTarget,
		deleteLoading,
		categories,
		categoriesLoading,
		handleCreate,
		handleConfirmDelete
	} = useMyCategories();

	return (
		<>
		<Grid container spacing={4}>
			{/* Creation Form */}
			<Grid size={{ xs: 12, md: 5 }}>
				<Paper
					component="form"
					onSubmit={handleCreate}
					elevation={0}
					sx={{
						p: 3,
						border: 1,
						borderColor: 'divider',
						borderRadius: 6,
						bgcolor: 'background.paper'
					}}
				>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
						Create Personal Category
					</Typography>

					{error && (
						<Alert severity="error" sx={{ mb: 3, borderRadius: 4 }}>
							{error}
						</Alert>
					)}

					<Stack spacing={3}>
						<TextField
							label="Category Name"
							value={newCategoryName}
							onChange={(e) => setNewCategoryName(e.target.value)}
							placeholder="e.g. Code Review, Mentorship"
							fullWidth
							required
						/>

						<Box>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
								Select Color Tag
							</Typography>
							<Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
								{CATEGORY_COLORS.map((color) => (
									<Box
										key={color}
										onClick={() => setSelectedColor(color)}
										sx={{
											width: 32,
											height: 32,
											borderRadius: '50%',
											bgcolor: color,
											cursor: 'pointer',
											border: selectedColor === color ? '2px solid white' : 'none',
											boxShadow: selectedColor === color ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
											transition: 'all 0.15s ease-in-out',
											'&:hover': { transform: 'scale(1.1)' }
										}}
									/>
								))}
							</Stack>
						</Box>

						<Button
							type="submit"
							variant="contained"
							disabled={submitting}
							sx={{ py: 1.2, fontWeight: 700, borderRadius: 4 }}
						>
							{submitting ? 'Creating...' : 'Create Category'}
						</Button>
					</Stack>
				</Paper>
			</Grid>

			{/* List of Categories */}
			<Grid size={{ xs: 12, md: 7 }}>
				<Paper
					elevation={0}
					sx={{
						p: 3,
						border: 1,
						borderColor: 'divider',
						borderRadius: 6,
						bgcolor: 'background.paper'
					}}
				>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
						My General Time Categories
					</Typography>
					<List>
						{categoriesLoading && categories.length === 0 ? (
							<Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic' }}>
								Loading categories...
							</Typography>
						) : categories.length === 0 ? (
							<Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic' }}>
								No general categories found. Create one on the left to log general time.
							</Typography>
						) : (
							categories.map((cat) => (
								<ListItem
									key={cat.id}
									sx={{
										borderBottom: 1,
										borderColor: 'divider',
										'&:last-child': { borderBottom: 'none' }
									}}
								>
									<Box
										sx={{
											width: 16,
											height: 16,
											borderRadius: '50%',
											bgcolor: cat.color || 'text.disabled',
											mr: 2
										}}
									/>
									<ListItemText
										primary={cat.name}
										primaryTypographyProps={{ sx: { fontWeight: 600 } }}
										secondary={cat.is_org_default ? 'Organization Default' : 'Personal Category'}
									/>
									{!cat.is_org_default && (
										<ListItemSecondaryAction>
											<IconButton edge="end" onClick={() => setDeleteTarget(cat)}>
												<DeleteIcon color="error" />
											</IconButton>
										</ListItemSecondaryAction>
									)}
								</ListItem>
							))
						)}
					</List>
				</Paper>
			</Grid>
		</Grid>

		<ConfirmationDialog
			open={!!deleteTarget}
			onClose={() => setDeleteTarget(null)}
			onConfirm={handleConfirmDelete}
			title="Delete Category"
			message={`Are you sure you want to delete "${deleteTarget?.name}"? Existing time logs using this category will keep their history but lose the category label.`}
			confirmLabel="Delete"
			severity="error"
			loading={deleteLoading}
		/>
		</>
	);
};

export default MyCategoriesPanel;
