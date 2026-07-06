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
	useTheme
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchHolidays, createHoliday, deleteHoliday } from '../../store/slices/timesheetSlice';

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

	const handleDelete = async (id: number) => {
		setError(null);
		try {
			await dispatch(deleteHoliday(id)).unwrap();
		} catch (err: any) {
			setError(err || 'Failed to delete holiday');
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
							border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
							borderRadius: '12px',
							bgcolor: isDark ? '#141822' : '#ffffff'
						}}
					>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
							Add New Holiday
						</Typography>

						{error && (
							<Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
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

							<TextField
								label="Holiday Date"
								type="date"
								value={holidayDate}
								onChange={(e) => setHolidayDate(e.target.value)}
								fullWidth
								required
								InputLabelProps={{ shrink: true }}
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
								sx={{ py: 1.2, fontWeight: 700, borderRadius: '8px' }}
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
						border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
						borderRadius: '12px',
						bgcolor: isDark ? '#141822' : '#ffffff'
					}}
				>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
						Organization Holidays
					</Typography>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow sx={{ bgcolor: isDark ? '#1C212E' : '#F8FAFC' }}>
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
													<IconButton size="small" onClick={() => handleDelete(h.id)}>
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
		</Grid>
	);
};

export default HolidayCalendarPanel;
