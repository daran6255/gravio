import React from 'react';
import {
	Paper,
	Typography,
	TextField,
	Button,
	IconButton,
	Stack,
	Grid,
	TableRow,
	TableCell,
	MenuItem,
	Alert,
	useTheme,
	alpha,
	CircularProgress,
	Box,
	Chip,
	Tooltip
} from '@mui/material';
import {
	Delete as DeleteIcon,
	Public as GlobeIcon,
	CloudUpload as UploadIcon,
	Settings as SettingsIcon,
	EventAvailable as ActiveIcon
} from '@mui/icons-material';
import { useHolidayCalendar } from './hooks/useHolidayCalendar';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';
import { DatePicker } from '../../common/form';
import { DataTable, TableView, type ColumnDefinition, type TableColumnDef } from '../../common/table';
import type { OrgHoliday } from '../../../models/timesheet';

const HolidayCalendarPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const {
		name, setName,
		holidayDate, setHolidayDate,
		type, setType,
		countryCode, setCountryCode,
		error,
		submitting,
		importDialogOpen, setImportDialogOpen,
		dragOver, setDragOver,
		importPreview,
		importError,
		importLoading,
		fileInputRef,
		deleteTarget, setDeleteTarget,
		deleteLoading,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		holidays,
		holidaysLoading,
		currentUser,
		paginatedHolidays,
		handleCreate,
		handleConfirmDelete,
		handleCloseImport,
		handleFileSelect,
		handleFileDrop,
		handleConfirmImport
	} = useHolidayCalendar();

	const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

	const previewColumns: TableColumnDef[] = [
		{ id: 'holiday_date', label: 'Date', width: '25%' },
		{ id: 'name', label: 'Name', width: '50%' },
		{ id: 'type', label: 'Type', width: '25%' }
	];

	const renderPreviewRow = (h: { holiday_date: string; name: string; type: string }) => (
		<TableRow key={h.holiday_date}>
			<TableCell sx={{ fontWeight: 600 }}>{h.holiday_date}</TableCell>
			<TableCell>{h.name}</TableCell>
			<TableCell sx={{ textTransform: 'capitalize' }}>{h.type}</TableCell>
		</TableRow>
	);

	const columns: ColumnDefinition<OrgHoliday>[] = [
		{ id: 'holiday_date', label: 'Holiday & Date' },
		{ id: 'type', label: 'Holiday Type', align: 'center', width: '20%' },
		{ id: 'country_code', label: 'Applicable Location', align: 'center', width: '25%' },
		...(isAdminOrManager ? [{ id: 'actions' as const, label: 'Actions', align: 'right' as const, width: 80 }] : [])
	];

	const getTypeChip = (holidayType: string) => {
		const configs: Record<string, { bg: string; color: string; label: string }> = {
			public: {
				bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#E6F4EA',
				color: isDark ? '#10B981' : '#047857',
				label: 'Public Holiday'
			},
			org: {
				bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
				color: isDark ? '#8F93FB' : '#4F46E5',
				label: 'Company Holiday'
			},
			custom: {
				bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF9E6',
				color: isDark ? '#F59E0B' : '#B45309',
				label: 'Override Day'
			}
		};
		const c = configs[holidayType] || { bg: 'action.selected', color: 'text.secondary', label: holidayType };
		return (
			<Chip
				label={c.label}
				size="small"
				sx={{
					bgcolor: c.bg,
					color: c.color,
					fontWeight: 800,
					fontSize: '0.75rem',
					borderRadius: '6px',
					px: 0.5,
					border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}`
				}}
			/>
		);
	};

	const renderRow = (h: OrgHoliday) => {
		const parsedDate = new Date(h.holiday_date);
		const isValidDate = !isNaN(parsedDate.getTime());
		const monthStr = isValidDate ? parsedDate.toLocaleDateString('en-US', { month: 'short' }) : '—';
		const dayStr = isValidDate ? parsedDate.toLocaleDateString('en-US', { day: 'numeric' }) : '—';
		const weekdayStr = isValidDate ? parsedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' }) : '—';

		return (
			<TableRow key={h.id} hover sx={{ '&:last-child td': { border: 0 } }}>
				<TableCell>
					<Stack direction="row" spacing={2} alignItems="center">
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								width: 44,
								height: 44,
								borderRadius: '10px',
								bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
								color: 'primary.main',
								border: '1px solid',
								borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF',
								flexShrink: 0
							}}
						>
							<Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.62rem', textTransform: 'uppercase', lineHeight: 1, color: isDark ? '#A78BFA' : '#6366F1' }}>
								{monthStr}
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.1, color: isDark ? '#FFF' : '#1E1B4B' }}>
								{dayStr}
							</Typography>
						</Box>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 800 }}>
								{h.name}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{weekdayStr}
							</Typography>
						</Box>
					</Stack>
				</TableCell>
				<TableCell align="center">
					{getTypeChip(h.type)}
				</TableCell>
				<TableCell align="center">
					<Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
						<GlobeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							{h.country_code ? h.country_code.toUpperCase() : 'All Offices'}
						</Typography>
					</Stack>
				</TableCell>
				{isAdminOrManager && (
					<TableCell align="right" sx={{ pr: 3 }}>
						<Tooltip title="Delete Holiday" arrow>
							<IconButton
								size="small"
								onClick={() => setDeleteTarget(h)}
								sx={{
									bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FDF2F2',
									color: 'error.main',
									'&:hover': { bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FDE8E8' }
								}}
							>
								<DeleteIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</TableCell>
				)}
			</TableRow>
		);
	};

	return (
		<Grid container spacing={3}>
			{/* Creation Form */}
			{isAdminOrManager && (
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper
						component="form"
						onSubmit={handleCreate}
						elevation={0}
						sx={{
							p: 3,
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: '16px',
							bgcolor: 'background.paper',
							position: 'sticky',
							top: 24
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
							<SettingsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
							<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
								Add New Holiday
							</Typography>
						</Stack>

						{error && (
							<Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
								{error}
							</Alert>
						)}

						<Stack spacing={2.5}>
							<TextField
								label="Holiday Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. New Year's Day"
								fullWidth
								required
								InputProps={{
									sx: { borderRadius: '10px' }
								}}
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
								InputProps={{
									sx: { borderRadius: '10px' }
								}}
							>
								<MenuItem value="public">Public Holiday</MenuItem>
								<MenuItem value="org">Organization Holiday</MenuItem>
								<MenuItem value="custom">Custom Override Day</MenuItem>
							</TextField>

							<TextField
								label="Country Code (Optional)"
								value={countryCode}
								onChange={(e) => setCountryCode(e.target.value)}
								placeholder="e.g. US, IN, SG"
								fullWidth
								InputProps={{
									sx: { borderRadius: '10px' }
								}}
							/>

							<Button
								type="submit"
								variant="contained"
								disabled={submitting}
								sx={{
									py: 1.2,
									fontWeight: 700,
									borderRadius: '10px',
									textTransform: 'none',
									boxShadow: 'none',
									'&:hover': { boxShadow: 'none' }
								}}
							>
								{submitting ? 'Creating...' : 'Add Holiday'}
							</Button>
						</Stack>
					</Paper>
				</Grid>
			)}

			{/* List of Holidays */}
			<Grid size={{ xs: 12, md: isAdminOrManager ? 8 : 12 }}>
				<DataTable<OrgHoliday>
					columns={columns}
					data={paginatedHolidays}
					loading={holidaysLoading}
					totalCount={holidays.length}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={(_, newPage) => setPage(newPage)}
					onRowsPerPageChange={(newRows) => { setRowsPerPage(newRows); setPage(0); }}
					searchTerm=""
					headerActions={
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
							<Stack direction="row" spacing={1} alignItems="center">
								<ActiveIcon sx={{ color: 'success.main', fontSize: 22 }} />
								<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
									Holidays Calendar
								</Typography>
							</Stack>
							{isAdminOrManager && (
								<Button
									variant="contained"
									size="small"
									startIcon={<UploadIcon />}
									onClick={() => setImportDialogOpen(true)}
									sx={{
										textTransform: 'none',
										borderRadius: '8px',
										fontWeight: 700,
										boxShadow: 'none',
										'&:hover': { boxShadow: 'none' }
									}}
								>
									Import Holidays
								</Button>
							)}
						</Stack>
					}
					renderRow={renderRow}
					emptyMessage="No holidays configured for your organization."
				/>
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
						<Button onClick={handleCloseImport} variant="outlined" disabled={importLoading} sx={{ borderRadius: 3, textTransform: 'none' }}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmImport}
							disabled={importPreview.length === 0 || importLoading}
							variant="contained"
							sx={{ fontWeight: 700, borderRadius: 3, textTransform: 'none', boxShadow: 'none' }}
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
							p: 4,
							border: '2px dashed',
							borderColor: dragOver ? 'primary.main' : 'divider',
							borderRadius: '16px',
							textAlign: 'center',
							cursor: 'pointer',
							bgcolor: dragOver ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05) : 'transparent',
							transition: 'all 0.2s ease',
							'&:hover': {
								borderColor: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.02)
							}
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
						<UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1.5 }} />
						<Typography variant="body2" sx={{ fontWeight: 800 }}>
							Click to upload or drag & drop
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
							Supports .JSON or .CSV files
						</Typography>
					</Box>

					{importError && (
						<Alert severity="error" sx={{ borderRadius: '10px' }}>
							{importError}
						</Alert>
					)}

					{importPreview.length > 0 && (
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
								Preview ({importPreview.length} holidays found)
							</Typography>
							<Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
								<TableView<{ holiday_date: string; name: string; type: string }>
									columns={previewColumns}
									items={importPreview}
									getItemId={(h) => h.holiday_date}
									renderRow={renderPreviewRow}
								/>
							</Box>
						</Box>
					)}

					<Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
						<Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 1, color: 'text.primary' }}>
							Expected File Schema:
						</Typography>
						<Typography variant="caption" color="text.secondary" component="pre" sx={{ fontFamily: 'monospace', display: 'block', overflowX: 'auto' }}>
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
