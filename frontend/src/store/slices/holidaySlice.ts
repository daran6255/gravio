import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import holidayService, { type CompanyHoliday, type CompanyHolidayListResponse } from '../../services/holidayService';

interface HolidayState {
	holidays: CompanyHoliday[];
	totalHolidays: number;
	loading: boolean;
	error: string | null;
}

const initialState: HolidayState = {
	holidays: [],
	totalHolidays: 0,
	loading: false,
	error: null,
};

export const fetchHolidays = createAsyncThunk(
	'holiday/fetchHolidays',
	async (params: { date_from?: string; date_to?: string; skip?: number; limit?: number } | undefined, { rejectWithValue }) => {
		try {
			const { date_from, date_to, skip, limit } = params || {};
			return await holidayService.getHolidays(date_from, date_to, skip, limit);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch holidays');
		}
	}
);

export const createHoliday = createAsyncThunk(
	'holiday/createHoliday',
	async (data: { holiday_date: string; holiday_name: string }, { rejectWithValue }) => {
		try {
			return await holidayService.createHoliday(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create holiday');
		}
	}
);

export const deleteHoliday = createAsyncThunk(
	'holiday/deleteHoliday',
	async (public_id: string, { rejectWithValue }) => {
		try {
			await holidayService.deleteHoliday(public_id);
			return public_id;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete holiday');
		}
	}
);

export const importHolidays = createAsyncThunk(
	'holiday/importHolidays',
	async (file: File, { rejectWithValue }) => {
		try {
			return await holidayService.importHolidays(file);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to import holidays');
		}
	}
);

export const updateHoliday = createAsyncThunk(
	'holiday/updateHoliday',
	async ({ public_id, data }: { public_id: string; data: { holiday_date?: string; holiday_name?: string } }, { rejectWithValue }) => {
		try {
			return await holidayService.updateHoliday(public_id, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update holiday');
		}
	}
);

const holidaySlice = createSlice({
	name: 'holiday',
	initialState,
	reducers: {
		clearHolidayError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builderValue) => {
		builderValue
			.addCase(fetchHolidays.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHolidays.fulfilled, (state, action: PayloadAction<CompanyHolidayListResponse>) => {
				state.loading = false;
				state.holidays = action.payload.items;
				state.totalHolidays = action.payload.total;
			})
			.addCase(fetchHolidays.rejected, (state, action: any) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(createHoliday.fulfilled, (state, action: PayloadAction<CompanyHoliday>) => {
				// If it was restored (existing ID), replace or just refresh. 
				// For simplicity, if it's already in state (restored), update it.
				const index = state.holidays.findIndex(h => h.public_id === action.payload.public_id);
				if (index !== -1) {
					state.holidays[index] = action.payload;
				} else {
					state.holidays.push(action.payload);
					state.totalHolidays += 1;
				}
				state.holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
			})
			.addCase(deleteHoliday.fulfilled, (state, action: PayloadAction<string>) => {
				state.holidays = state.holidays.filter((h) => h.public_id !== action.payload);
				state.totalHolidays -= 1;
			})
			.addCase(updateHoliday.fulfilled, (state, action: PayloadAction<CompanyHoliday>) => {
				const index = state.holidays.findIndex(h => h.public_id === action.payload.public_id);
				if (index !== -1) {
					state.holidays[index] = action.payload;
					state.holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
				}
			});
	},
});

export const { clearHolidayError } = holidaySlice.actions;
export default holidaySlice.reducer;
