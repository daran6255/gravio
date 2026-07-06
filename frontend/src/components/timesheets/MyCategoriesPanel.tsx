import React, { useState, useEffect } from 'react';
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
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyCategories, createCategory, deleteCategory } from '../../store/slices/timesheetSlice';

const CATEGORY_COLORS = [
	'#8B7CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899',
	'#14B8A6', '#EF4444', '#6366F1', '#A855F7', '#6B7280'
];

const MyCategoriesPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { categories, categoriesLoading } = useAppSelector((state) => state.timesheets);

	const [newCategoryName, setNewCategoryName] = useState('');
	const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		dispatch(fetchMyCategories());
	}, [dispatch]);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!newCategoryName.trim()) {
			setError('Category name is required');
			return;
		}

		setSubmitting(true);
		try {
			await dispatch(createCategory({ name: newCategoryName, color: selectedColor })).unwrap();
			setNewCategoryName('');
		} catch (err: any) {
			setError(err || 'Failed to create category');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id: number) => {
		setError(null);
		try {
			await dispatch(deleteCategory(id)).unwrap();
		} catch (err: any) {
			setError(err || 'Failed to delete category');
		}
	};

	return (
		<Grid container spacing={4}>
			{/* Creation Form */}
			<Grid size={{ xs: 12, md: 5 }}>
				<Paper
					component="form"
					onSubmit={handleCreate}
					elevation={0}
					sx={{
						p: 3,
						border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
						borderRadius: '12px',
						bgcolor: isDark ? '#141822' : '#ffffff'
					}}
				>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
						Create Personal Category
					</Typography>

					{error && (
						<Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
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
											boxShadow: selectedColor === color ? '0 0 0 2px #8B7CF6' : 'none',
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
							sx={{ py: 1.2, fontWeight: 700, borderRadius: '8px' }}
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
						border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
						borderRadius: '12px',
						bgcolor: isDark ? '#141822' : '#ffffff'
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
										borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
										'&:last-child': { borderBottom: 'none' }
									}}
								>
									<Box
										sx={{
											width: 16,
											height: 16,
											borderRadius: '50%',
											bgcolor: cat.color || '#6B7280',
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
											<IconButton edge="end" onClick={() => handleDelete(cat.id)}>
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
	);
};

export default MyCategoriesPanel;
