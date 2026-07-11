import React, { useState, useEffect } from 'react';
import {
	Paper,
	Typography,
	TextField,
	Button,
	IconButton,
	Stack,
	Grid,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	MenuItem,
	Alert,
	useTheme,
	alpha,
	CircularProgress,
	Box
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchHolidays, createHoliday, deleteHoliday } from '../../../store/slices/timesheetSlice';
import { responsiveStyles } from '../../../theme';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';
import { DatePicker } from '../../common/form';
import type { OrgHoliday } from '../../../models/timesheet';

const HolidayCalendarPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const currentUser = useAppSelector((state) => state.auth.user);
	const { holidays, holidaysLoading } = useAppSelector((state) => state.timesheets);

	const [name, setName] = useState('');
	const [holidayDate, setHolidayDate] = useState('');
	const [type, setType] = useState('public');
	const [countryCode, setCountryCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Import state
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [importPreview, setImportPreview] = useState<{ holiday_date: string; name: string; type: string; country_code?: string }[]>([]);
	const [importError, setImportError] = useState<string | null>(null);
	const [importLoading, setImportLoading] = useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// Delete confirmation state
	const [deleteTarget, setDeleteTarget] = useState<OrgHoliday | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		dispatch(fetchHolidays());
	}, [dispatch]);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim() || !holidayDate) {
			setError('Holiday Name and Date are required');
			return;
		}

		setSubmitting(true);
		try {
			await dispatch(
				createHoliday({
					name,
					holiday_date: holidayDate,
					type,
					country_code: countryCode || undefined
				})
			).unwrap();
			setName('');
			setHolidayDate('');
			setCountryCode('');
		} catch (err: any) {
			setError(err || 'Failed to create holiday');
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setError(null);
		setDeleteLoading(true);
		try {
			await dispatch(deleteHoliday(deleteTarget.id)).unwrap();
			setDeleteTarget(null);
		} catch (err: any) {
			setError(err || 'Failed to delete holiday');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleCloseImport = () => {
		setImportDialogOpen(false);
		setImportPreview([]);
		setImportError(null);
		setDragOver(false);
	};

	const parseFile = (file: File) => {
		setImportError(null);
		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target?.result as string;
			if (!text) {
				setImportError('Failed to read file content');
				return;
			}

			try {
				if (file.name.endsWith('.json')) {
					const parsed = JSON.parse(text);
					if (!Array.isArray(parsed)) {
						throw new Error('JSON file must contain an array of holiday objects');
					}
					
					// Validate format
					const validated = parsed.map((item: any, index: number) => {
						if (!item.holiday_date || !item.name) {
							throw new Error(`Item at index ${index} is missing required 'holiday_date' or 'name'`);
						}
						return {
							holiday_date: String(item.holiday_date),
							name: String(item.name),
							type: String(item.type || 'public'),
							country_code: item.country_code ? String(item.country_code) : undefined
						};
					});
					setImportPreview(validated);
				} else if (file.name.endsWith('.csv')) {
					const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
					if (lines.length <= 1) {
						throw new Error('CSV file is empty or missing headers');
					}

					const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
					const dateIdx = headers.indexOf('holiday_date');
					const nameIdx = headers.indexOf('name');
					const typeIdx = headers.indexOf('type');
					const countryIdx = headers.indexOf('country_code');

					if (dateIdx === -1 || nameIdx === -1) {
						throw new Error('CSV must contain "holiday_date" and "name" columns');
					}

					const validated = [];
					for (let i = 1; i < lines.length; i++) {
						const row = lines[i].split(',').map(cell => cell.trim());
						if (row.length < 2) continue; // Skip incomplete lines

						const dateVal = row[dateIdx];
						const nameVal = row[nameIdx];
						
						if (!dateVal || !nameVal) {
							throw new Error(`Line ${i + 1} is missing required date or name value`);
						}

						validated.push({
							holiday_date: dateVal,
							name: nameVal,
							type: typeIdx !== -1 && row[typeIdx] ? row[typeIdx] : 'public',
							country_code: countryIdx !== -1 && row[countryIdx] ? row[countryIdx] : undefined
						});
					}
					setImportPreview(validated);
				} else {
					setImportError('Unsupported file type. Please upload a .csv or .json file');
				}
			} catch (err: any) {
				setImportError(err.message || 'Error parsing file content');
				setImportPreview([]);
			}
		};

		reader.readAsText(file);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			parseFile(files[0]);
		}
	};

	const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			parseFile(files[0]);
		}
	};

	const handleConfirmImport = async () => {
		setImportLoading(true);
		setImportError(null);

		let successCount = 0;
		let failCount = 0;

		try {
			await Promise.all(
				importPreview.map(async (h) => {
					try {
						// Check if holiday already exists on this date to prevent duplicates
						const isDuplicate = holidays.some(
							(existing) => existing.holiday_date === h.holiday_date
						);
						if (isDuplicate) return;

						await dispatch(
							createHoliday({
								name: h.name,
								holiday_date: h.holiday_date,
								type: h.type,
								country_code: h.country_code
							})
						).unwrap();
						successCount++;
					} catch {
						failCount++;
					}
				})
			);

			if (successCount > 0) {
				dispatch(fetchHolidays()); // reload
				handleCloseImport();
			} else {
				setImportError('No new holidays were imported (they might already exist).');
			}
		} catch (err: any) {
			setImportError('An unexpected error occurred during import');
		} finally {
			setImportLoading(false);
		}
	};

	const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

	return (
		<Grid container spacing={4}>
			{/* Creation Form */}
			{isAdminOrManager && (
				<Grid size={{ xs: 12, md: 4 }}>
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
							Add New Holiday
						</Typography>

						{error && (
							<Alert severity="error" sx={{ mb: 3, borderRadius: 4 }}>
								{error}
							</Alert>
						)}

						<Stack spacing={3}>
							<TextField
								label="Holiday Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Christmas Day"
								fullWidth
								required
							/>

							<DatePicker
								label="Holiday Date"
								value={holidayDate || null}
								onChange={(value) => setHolidayDate(value)}
								fullWidth
							/>

							<TextField
								select
								label="Holiday Type"
								value={type}
								onChange={(e) => setType(e.target.value)}
								fullWidth
								required
							>
								<MenuItem value="public">Public Holiday</MenuItem>
								<MenuItem value="org">Organization Holiday</MenuItem>
								<MenuItem value="custom">Custom Override Day</MenuItem>
							</TextField>

							<TextField
								label="Country Code (Optional)"
								value={countryCode}
								onChange={(e) => setCountryCode(e.target.value)}
								placeholder="e.g. US, IN"
								fullWidth
							/>

							<Button
								type="submit"
								variant="contained"
								disabled={submitting}
								sx={{ py: 1.2, fontWeight: 700, borderRadius: 4 }}
							>
								{submitting ? 'Creating...' : 'Add Holiday'}
							</Button>
						</Stack>
					</Paper>
				</Grid>
			)}

			{/* List of Holidays */}
			<Grid size={{ xs: 12, md: isAdminOrManager ? 8 : 12 }}>
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
					<Stack sx={{ ...responsiveStyles.headerRow, mb: 2.5 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							Organization Holidays
						</Typography>
						{isAdminOrManager && (
							<Button
								variant="outlined"
								size="small"
								onClick={() => setImportDialogOpen(true)}
								sx={{ textTransform: 'none', borderRadius: 4, fontWeight: 600 }}
							>
								Import Holidays
							</Button>
						)}
					</Stack>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow sx={{ bgcolor: 'action.hover' }}>
									<TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Holiday Name</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Country</TableCell>
									{isAdminOrManager && <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>}
								</TableRow>
							</TableHead>
							<TableBody>
								{holidaysLoading && holidays.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} align="center" sx={{ py: 4 }}>
											Loading holidays...
										</TableCell>
									</TableRow>
								) : holidays.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
											No holidays configured for your organization.
										</TableCell>
									</TableRow>
								) : (
									holidays.map((h) => (
										<TableRow key={h.id}>
											<TableCell sx={{ fontWeight: 600 }}>{h.holiday_date}</TableCell>
											<TableCell>{h.name}</TableCell>
											<TableCell sx={{ textTransform: 'capitalize' }}>{h.type} Holiday</TableCell>
											<TableCell>{h.country_code || 'All'}</TableCell>
											{isAdminOrManager && (
												<TableCell align="right" sx={{ pr: 2 }}>
													<IconButton size="small" onClick={() => setDeleteTarget(h)}>
														<DeleteIcon color="error" fontSize="small" />
													</IconButton>
												</TableCell>
											)}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Paper>
			</Grid>

			{/* Import Holidays Dialog */}
			<BaseDialog
				open={importDialogOpen}
				onClose={handleCloseImport}
				title="Import Holidays"
				maxWidth="sm"
				loading={importLoading}
				actions={
					<>
						<Button onClick={handleCloseImport} variant="outlined" disabled={importLoading} sx={{ borderRadius: 3 }}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmImport}
							disabled={importPreview.length === 0 || importLoading}
							variant="contained"
							sx={{ fontWeight: 700, borderRadius: 3 }}
						>
							{importLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Import'}
						</Button>
					</>
				}
			>
				<Stack spacing={3}>
					<Typography variant="body2" color="text.secondary">
						Upload a CSV or JSON file containing holidays for your organization.
					</Typography>

					<Box
						sx={{
							p: 3,
							border: '2px dashed',
							borderColor: dragOver ? 'primary.main' : 'divider',
							borderRadius: 6,
							textAlign: 'center',
							cursor: 'pointer',
							bgcolor: dragOver ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05) : 'transparent',
							transition: 'all 0.2s ease'
						}}
						onClick={() => fileInputRef.current?.click()}
						onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); }}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleFileDrop}
					>
						<input
							type="file"
							ref={fileInputRef}
							style={{ display: 'none' }}
							accept=".json,.csv"
							onChange={handleFileSelect}
						/>
						<Typography variant="body2" sx={{ fontWeight: 700 }}>
							Click to upload or drag & drop
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
							Supports .JSON or .CSV files
						</Typography>
					</Box>

					{importError && (
						<Alert severity="error" sx={{ borderRadius: 4 }}>
							{importError}
						</Alert>
					)}

					{importPreview.length > 0 && (
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
								Preview ({importPreview.length} holidays found)
							</Typography>
							<Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
								<Table size="small">
									<TableHead sx={{ bgcolor: 'action.hover' }}>
										<TableRow>
											<TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{importPreview.map((h, i) => (
											<TableRow key={i}>
												<TableCell>{h.holiday_date}</TableCell>
												<TableCell>{h.name}</TableCell>
												<TableCell sx={{ textTransform: 'capitalize' }}>{h.type}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Box>
						</Box>
					)}

					<Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 4 }}>
						<Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
							Expected File Schema:
						</Typography>
						<Typography variant="caption" color="text.secondary" component="pre" sx={{ fontFamily: 'monospace', display: 'block' }}>
							{`JSON:\n[\n  { "holiday_date": "2026-12-25", "name": "Christmas Day", "type": "public" }\n]\n\nCSV:\nholiday_date,name,type\n2026-12-25,Christmas Day,public`}
						</Typography>
					</Box>
				</Stack>
			</BaseDialog>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Holiday"
				message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.holiday_date})? Anyone who logged time on this date under the holiday override will be unaffected.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleteLoading}
			/>
		</Grid>
	);
};

export default HolidayCalendarPanel;
