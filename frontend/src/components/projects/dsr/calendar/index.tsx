import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Divider,
	useTheme
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { fetchHolidays } from '../../../../store/slices/holidaySlice';
import { fetchCalendarEntries } from '../../../../store/slices/dsrSlice';
import { type CompanyHoliday } from '../../../../services/holidayService';
import { DSRStatusValues } from '../../../../models/dsr';
import { awsStyles } from '../../../../theme/theme';
import StatusDay from './StatusDay';
import CalendarLegend from './CalendarLegend';
import HolidayList from './HolidayList';
import { getStatusTheme } from './calendarUtils';

const DSRCalendarView: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { calendarEntries, calendarLeaves } = useAppSelector((state) => state.dsr);
	const { user } = useAppSelector((state) => state.auth);
	const { holidays, loading: holidaysLoading } = useAppSelector((state) => state.holidays);
	const [viewDate, setViewDate] = useState(dayjs());

	const statusTheme = useMemo(() => getStatusTheme(theme), [theme]);

	useEffect(() => {
		const start = viewDate.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
		const end = viewDate.endOf('month').add(7, 'day').format('YYYY-MM-DD');
		
		dispatch(fetchHolidays({ date_from: start, date_to: end, limit: 100 }));
		
		// Fetch calendar entries for the entire month range displayed
		dispatch(fetchCalendarEntries({ 
			date_from: start, 
			date_to: end,
			user_id: user?.id 
		}));
	}, [dispatch, viewDate, user?.id]);

	const dateStatuses = useMemo(() => {
		const statuses: Record<string, string> = {};
		const today = dayjs().format('YYYY-MM-DD');

		// 1. Mark Sundays and Company Holidays (Lowest priority)
		let current = viewDate.startOf('month').subtract(7, 'day');
		const end = viewDate.endOf('month').add(7, 'day');
		while (current.isBefore(end)) {
			const d = current.format('YYYY-MM-DD');
			if (current.day() === 0) statuses[d] = 'holiday';

			// 2. Default missing status for past workdays
			if (current.isBefore(dayjs(today)) && current.day() !== 0) {
				statuses[d] = 'missing';
			}
			current = current.add(1, 'day');
		}

		// Overlay company holidays
		holidays.forEach((h: CompanyHoliday) => {
			statuses[dayjs(h.holiday_date).format('YYYY-MM-DD')] = 'holiday';
		});

		// 3. User Leaves
		calendarLeaves.forEach(l => {
			if (l.status === 'approved') {
				statuses[dayjs(l.date).format('YYYY-MM-DD')] = 'leave';
			}
		});

		// 4. DSR Entries (Highest priority)
		calendarEntries.forEach((entry: any) => {
			const d = dayjs(entry.report_date || entry.date).format('YYYY-MM-DD');
			const isRevoked = entry.status === DSRStatusValues.DRAFT && !!entry.admin_notes;
			statuses[d] = isRevoked ? DSRStatusValues.REJECTED : entry.status;
		});

		return statuses;
	}, [calendarEntries, calendarLeaves, holidays, viewDate]);

	const monthHolidays = useMemo(() => {
		const filtered = holidays.filter((h: CompanyHoliday) => dayjs(h.holiday_date).month() === viewDate.month());
		return [...filtered].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
	}, [holidays, viewDate]);

	return (
		<Box sx={{
			...awsStyles.awsPanel,
			p: 0,
			overflow: 'hidden',
			display: 'flex',
			flexDirection: 'column'
		}}>
			<LocalizationProvider dateAdapter={AdapterDayjs}>
				<Box sx={{
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					bgcolor: 'background.paper',
					pt: 1
				}}>
					<Box sx={{ width: '100%' }}>
						<StaticDatePicker
							displayStaticWrapperAs="desktop"
							value={viewDate}
							onMonthChange={(newMonth) => setViewDate(newMonth)}
							readOnly
							slots={{
								day: (props: any) => (
									<StatusDay
										{...props}
										dateStatuses={dateStatuses}
										statusTheme={statusTheme}
									/>
								)
							}}
							slotProps={{
								actionBar: { actions: [], sx: { display: 'none' } },
								toolbar: { hidden: true }
							}}
							sx={{
								'& .MuiPickerStaticWrapper-content': { bgcolor: 'transparent', minWidth: 'unset', width: '100%' },
								'& .MuiDateCalendar-root': {
									width: '100%',
									maxWidth: '100%',
									height: 'auto',
									p: 0,
									minWidth: 'unset',
									'& .MuiDayCalendar-header': {
										justifyContent: 'space-around',
										gap: 0,
										px: 1,
										mb: 1
									},
									'& .MuiDayCalendar-weekContainer': {
										justifyContent: 'space-around',
										gap: 0,
										my: '1px',
										px: 1
									}
								},
								'& .MuiDayCalendar-weekDayLabel': {
									fontWeight: 700,
									fontSize: '0.7rem',
									color: 'text.secondary',
									width: '36px',
									flex: 1,
									textTransform: 'uppercase'
								},
								'& .MuiPickersCalendarHeader-root': {
									mt: 0.5,
									mb: 1,
									px: 2,
									borderBottom: '1px solid',
									borderColor: 'divider',
									pb: 1
								},
								'& .MuiPickersCalendarHeader-label': {
									...theme.typography.subtitle2,
									fontWeight: 700,
									color: 'text.primary'
								},
								'& .MuiPickersCalendarHeader-switchViewButton': { display: 'none' }
							}}
						/>
					</Box>
				</Box>
			</LocalizationProvider>

			<CalendarLegend statusTheme={statusTheme} />

			<Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />

			<HolidayList holidays={monthHolidays} loading={holidaysLoading} />
		</Box>
	);
};

export default DSRCalendarView;
