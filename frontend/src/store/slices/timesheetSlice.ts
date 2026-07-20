import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import timesheetService from '../../services/timesheetService';
import type {
	TimesheetCategory,
	OrgHoliday,
	TimesheetUserSettings,
	ProjectTimeLog,
	TimesheetReportRow,
	TimesheetWeekUnlockRequest
} from '../../models/timesheet';

function extractErrorMessage(error: any, fallback: string): string {
	const data = error?.response?.data;

	// The app's own error middleware: { error: { message: "..." } }
	if (typeof data?.error?.message === 'string' && data.error.message) {
		return data.error.message;
	}

	// FastAPI's built-in request validation errors arrive as an array of
	// { loc: [...], msg: "..." } objects under `detail`, not a string -- stringify
	// them into a readable sentence instead of leaking the raw shape into a toast.
	if (Array.isArray(data?.detail)) {
		const messages = data.detail
			.map((item: any) => {
				if (typeof item === 'string') return item;
				const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : undefined;
				if (!item?.msg) return null;
				return typeof field === 'string' ? `${field}: ${item.msg}` : item.msg;
			})
			.filter(Boolean);
		if (messages.length) return messages.join('; ');
	}

	if (typeof data?.detail === 'string' && data.detail) {
		return data.detail;
	}

	// A raw axios message ("Request failed with status code 400") isn't useful to a
	// user -- only fall back to it when there's no server response at all (network
	// failure, timeout), where the message itself is already readable.
	if (!error?.response && typeof error?.message === 'string' && error.message) {
		return error.message;
	}

	return fallback;
}

interface TimesheetState {
	myTimeLogs: ProjectTimeLog[];
	myTimeLogsLoading: boolean;
	myTimeLogsError: string | null;



	teamTimeLogs: ProjectTimeLog[];
	teamTimeLogsLoading: boolean;
	teamTimeLogsError: string | null;

	categories: TimesheetCategory[];
	categoriesLoading: boolean;
	categoriesError: string | null;

	holidays: OrgHoliday[];
	holidaysLoading: boolean;
	holidaysError: string | null;

	userSettings: TimesheetUserSettings | null;
	userSettingsLoading: boolean;
	userSettingsError: string | null;

	reportRows: TimesheetReportRow[];
	reportRowsLoading: boolean;
	reportRowsError: string | null;

	myUnlockRequests: TimesheetWeekUnlockRequest[];
	myUnlockRequestsLoading: boolean;

	teamUnlockRequests: TimesheetWeekUnlockRequest[];
	teamUnlockRequestsLoading: boolean;

	unlockRequestMutating: boolean;
	unlockRequestError: string | null;

	actionLoading: boolean;
	actionError: string | null;
}

const initialState: TimesheetState = {
	myTimeLogs: [],
	myTimeLogsLoading: false,
	myTimeLogsError: null,



	teamTimeLogs: [],
	teamTimeLogsLoading: false,
	teamTimeLogsError: null,

	categories: [],
	categoriesLoading: false,
	categoriesError: null,

	holidays: [],
	holidaysLoading: false,
	holidaysError: null,

	userSettings: null,
	userSettingsLoading: false,
	userSettingsError: null,

	reportRows: [],
	reportRowsLoading: false,
	reportRowsError: null,

	myUnlockRequests: [],
	myUnlockRequestsLoading: false,

	teamUnlockRequests: [],
	teamUnlockRequestsLoading: false,

	unlockRequestMutating: false,
	unlockRequestError: null,

	actionLoading: false,
	actionError: null
};

// ==========================================
// ASYNC THUNKS
// ==========================================

export const fetchMyTimeLogs = createAsyncThunk(
	'timesheets/fetchMyTimeLogs',
	async (arg: { startDate: string; endDate: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.getMyTimeLogs(arg.startDate, arg.endDate);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch your time logs'));
		}
	}
);



export const createTimeLog = createAsyncThunk(
	'timesheets/createTimeLog',
	async (
		arg: {
			project_id?: number | null;
			task_id?: number | null;
			category_id?: number | null;
			log_date: string;
			hours: number;
			notes?: string | null;
			billing_type: string;
		},
		{ rejectWithValue }
	) => {
		try {
			return await timesheetService.createTimeLog(arg);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to log time'));
		}
	}
);

export const updateTimeLog = createAsyncThunk(
	'timesheets/updateTimeLog',
	async (
		arg: {
			id: number;
			data: {
				project_id?: number | null;
				task_id?: number | null;
				category_id?: number | null;
				log_date?: string;
				hours?: number;
				notes?: string | null;
				billing_type?: string;
			};
		},
		{ rejectWithValue }
	) => {
		try {
			return await timesheetService.updateTimeLog(arg.id, arg.data);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update time log'));
		}
	}
);

export const deleteTimeLog = createAsyncThunk(
	'timesheets/deleteTimeLog',
	async (id: number, { rejectWithValue }) => {
		try {
			await timesheetService.deleteTimeLog(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete time log'));
		}
	}
);

export const submitWeek = createAsyncThunk(
	'timesheets/submitWeek',
	async (arg: { startDate: string; endDate: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.submitWeek(arg.startDate, arg.endDate);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to submit weekly timesheet'));
		}
	}
);

export const fetchMyCategories = createAsyncThunk(
	'timesheets/fetchMyCategories',
	async (_, { rejectWithValue }) => {
		try {
			return await timesheetService.getMyCategories();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch categories'));
		}
	}
);

export const createCategory = createAsyncThunk(
	'timesheets/createCategory',
	async (data: { name: string; color?: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.createCategory(data);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create category'));
		}
	}
);

export const deleteCategory = createAsyncThunk(
	'timesheets/deleteCategory',
	async (id: number, { rejectWithValue }) => {
		try {
			await timesheetService.deleteCategory(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete category'));
		}
	}
);

export const fetchHolidays = createAsyncThunk(
	'timesheets/fetchHolidays',
	async (arg: { startDate?: string; endDate?: string } | undefined, { rejectWithValue }) => {
		try {
			return await timesheetService.listHolidays(arg?.startDate, arg?.endDate);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch holidays'));
		}
	}
);

export const createHoliday = createAsyncThunk(
	'timesheets/createHoliday',
	async (data: { name: string; holiday_date: string; type: string; country_code?: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.createHoliday(data);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create holiday'));
		}
	}
);

export const deleteHoliday = createAsyncThunk(
	'timesheets/deleteHoliday',
	async (id: number, { rejectWithValue }) => {
		try {
			await timesheetService.deleteHoliday(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete holiday'));
		}
	}
);

export const fetchUserSettings = createAsyncThunk(
	'timesheets/fetchUserSettings',
	async (userId: number, { rejectWithValue }) => {
		try {
			return await timesheetService.getUserSettings(userId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch user timesheet settings'));
		}
	}
);

export const updateUserSettings = createAsyncThunk(
	'timesheets/updateUserSettings',
	async (arg: { userId: number; data: Partial<TimesheetUserSettings> }, { rejectWithValue }) => {
		try {
			return await timesheetService.updateUserSettings(arg.userId, arg.data);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update user timesheet settings'));
		}
	}
);

export const fetchTeamTimeLogs = createAsyncThunk(
	'timesheets/fetchTeamTimeLogs',
	async (
		arg: {
			start_date: string;
			end_date: string;
			user_id?: number | null;
			project_id?: number | null;
			status?: string | null;
		},
		{ rejectWithValue }
	) => {
		try {
			return await timesheetService.getTeamLogs(arg);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch team timesheets'));
		}
	}
);

export const approveWeek = createAsyncThunk(
	'timesheets/approveWeek',
	async (arg: { targetUserId: number; startDate: string; endDate: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.approveWeek(arg.targetUserId, arg.startDate, arg.endDate);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to approve timesheet'));
		}
	}
);

export const rejectWeek = createAsyncThunk(
	'timesheets/rejectWeek',
	async (
		arg: { targetUserId: number; startDate: string; endDate: string; rejectionNote: string },
		{ rejectWithValue }
	) => {
		try {
			return await timesheetService.rejectWeek(arg.targetUserId, arg.startDate, arg.endDate, arg.rejectionNote);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to reject timesheet'));
		}
	}
);

export const unapproveWeek = createAsyncThunk(
	'timesheets/unapproveWeek',
	async (arg: { targetUserId: number; startDate: string; endDate: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.unapproveWeek(arg.targetUserId, arg.startDate, arg.endDate);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to unapprove timesheet'));
		}
	}
);

// --- Week Unlock Requests ---
export const requestWeekUnlock = createAsyncThunk(
	'timesheets/requestWeekUnlock',
	async (arg: { weekStartDate: string; weekEndDate: string; reason?: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.requestWeekUnlock(arg.weekStartDate, arg.weekEndDate, arg.reason);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to request week unlock'));
		}
	}
);

export const fetchMyWeekUnlockRequests = createAsyncThunk(
	'timesheets/fetchMyWeekUnlockRequests',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await timesheetService.getMyWeekUnlockRequests();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch your unlock requests'));
		}
	}
);

export const fetchTeamWeekUnlockRequests = createAsyncThunk(
	'timesheets/fetchTeamWeekUnlockRequests',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await timesheetService.getTeamWeekUnlockRequests();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch team unlock requests'));
		}
	}
);

export const approveWeekUnlock = createAsyncThunk(
	'timesheets/approveWeekUnlock',
	async (arg: { requestId: number; resolutionNote?: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.approveWeekUnlock(arg.requestId, arg.resolutionNote);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to approve unlock request'));
		}
	}
);

export const denyWeekUnlock = createAsyncThunk(
	'timesheets/denyWeekUnlock',
	async (arg: { requestId: number; resolutionNote?: string }, { rejectWithValue }) => {
		try {
			return await timesheetService.denyWeekUnlock(arg.requestId, arg.resolutionNote);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to deny unlock request'));
		}
	}
);

export const fetchTimesheetReport = createAsyncThunk(
	'timesheets/fetchTimesheetReport',
	async (
		arg: {
			start_date: string;
			end_date: string;
			project_id?: number | null;
			user_id?: number | null;
			billing_type?: string | null;
		},
		{ rejectWithValue }
	) => {
		try {
			return await timesheetService.getTimesheetReport(arg);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to load timesheet report'));
		}
	}
);


// ==========================================
// TIMESHEET SLICE
// ==========================================

const timesheetSlice = createSlice({
	name: 'timesheets',
	initialState,
	reducers: {
		clearTimesheetErrors(state) {
			state.myTimeLogsError = null;
			state.teamTimeLogsError = null;
			state.categoriesError = null;
			state.holidaysError = null;
			state.userSettingsError = null;
			state.reportRowsError = null;
			state.actionError = null;
		}
	},
	extraReducers: (builder) => {
		builder
			// My Logs
			.addCase(fetchMyTimeLogs.pending, (state) => {
				state.myTimeLogsLoading = true;
				state.myTimeLogsError = null;
			})
			.addCase(fetchMyTimeLogs.fulfilled, (state, action: PayloadAction<ProjectTimeLog[]>) => {
				state.myTimeLogsLoading = false;
				state.myTimeLogs = action.payload;
			})
			.addCase(fetchMyTimeLogs.rejected, (state, action) => {
				state.myTimeLogsLoading = false;
				state.myTimeLogsError = action.payload as string;
			})



			// Create Log
			.addCase(createTimeLog.fulfilled, (state, action: PayloadAction<ProjectTimeLog>) => {
				state.myTimeLogs.push(action.payload);
			})

			// Update Log
			.addCase(updateTimeLog.fulfilled, (state, action: PayloadAction<ProjectTimeLog>) => {
				const idx = state.myTimeLogs.findIndex((l) => l.id === action.payload.id);
				if (idx !== -1) {
					state.myTimeLogs[idx] = action.payload;
				}
			})

			// Delete Log
			.addCase(deleteTimeLog.fulfilled, (state, action: PayloadAction<number>) => {
				state.myTimeLogs = state.myTimeLogs.filter((l) => l.id !== action.payload);
			})

			// Categories
			.addCase(fetchMyCategories.pending, (state) => {
				state.categoriesLoading = true;
				state.categoriesError = null;
			})
			.addCase(fetchMyCategories.fulfilled, (state, action: PayloadAction<TimesheetCategory[]>) => {
				state.categoriesLoading = false;
				state.categories = action.payload;
			})
			.addCase(fetchMyCategories.rejected, (state, action) => {
				state.categoriesLoading = false;
				state.categoriesError = action.payload as string;
			})
			.addCase(createCategory.fulfilled, (state, action: PayloadAction<TimesheetCategory>) => {
				state.categories.push(action.payload);
			})
			.addCase(deleteCategory.fulfilled, (state, action: PayloadAction<number>) => {
				state.categories = state.categories.filter((c) => c.id !== action.payload);
			})

			// Holidays
			.addCase(fetchHolidays.pending, (state) => {
				state.holidaysLoading = true;
				state.holidaysError = null;
			})
			.addCase(fetchHolidays.fulfilled, (state, action: PayloadAction<OrgHoliday[]>) => {
				state.holidaysLoading = false;
				state.holidays = action.payload;
			})
			.addCase(fetchHolidays.rejected, (state, action) => {
				state.holidaysLoading = false;
				state.holidaysError = action.payload as string;
			})
			.addCase(createHoliday.fulfilled, (state, action: PayloadAction<OrgHoliday>) => {
				state.holidays.push(action.payload);
				state.holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
			})
			.addCase(deleteHoliday.fulfilled, (state, action: PayloadAction<number>) => {
				state.holidays = state.holidays.filter((h) => h.id !== action.payload);
			})

			// User Settings
			.addCase(fetchUserSettings.pending, (state) => {
				state.userSettingsLoading = true;
				state.userSettingsError = null;
			})
			.addCase(fetchUserSettings.fulfilled, (state, action: PayloadAction<TimesheetUserSettings>) => {
				state.userSettingsLoading = false;
				state.userSettings = action.payload;
			})
			.addCase(fetchUserSettings.rejected, (state, action) => {
				state.userSettingsLoading = false;
				state.userSettingsError = action.payload as string;
			})
			.addCase(updateUserSettings.fulfilled, (state, action: PayloadAction<TimesheetUserSettings>) => {
				state.userSettings = action.payload;
			})

			// Team Logs
			.addCase(fetchTeamTimeLogs.pending, (state) => {
				state.teamTimeLogsLoading = true;
				state.teamTimeLogsError = null;
			})
			.addCase(fetchTeamTimeLogs.fulfilled, (state, action: PayloadAction<ProjectTimeLog[]>) => {
				state.teamTimeLogsLoading = false;
				state.teamTimeLogs = action.payload;
			})
			.addCase(fetchTeamTimeLogs.rejected, (state, action) => {
				state.teamTimeLogsLoading = false;
				state.teamTimeLogsError = action.payload as string;
			})

			// Week Unlock Requests
			.addCase(fetchMyWeekUnlockRequests.pending, (state) => {
				state.myUnlockRequestsLoading = true;
			})
			.addCase(fetchMyWeekUnlockRequests.fulfilled, (state, action: PayloadAction<TimesheetWeekUnlockRequest[]>) => {
				state.myUnlockRequestsLoading = false;
				state.myUnlockRequests = action.payload;
			})
			.addCase(fetchMyWeekUnlockRequests.rejected, (state) => {
				state.myUnlockRequestsLoading = false;
			})
			.addCase(fetchTeamWeekUnlockRequests.pending, (state) => {
				state.teamUnlockRequestsLoading = true;
			})
			.addCase(fetchTeamWeekUnlockRequests.fulfilled, (state, action: PayloadAction<TimesheetWeekUnlockRequest[]>) => {
				state.teamUnlockRequestsLoading = false;
				state.teamUnlockRequests = action.payload;
			})
			.addCase(fetchTeamWeekUnlockRequests.rejected, (state) => {
				state.teamUnlockRequestsLoading = false;
			})
			.addCase(requestWeekUnlock.pending, (state) => {
				state.unlockRequestMutating = true;
				state.unlockRequestError = null;
			})
			.addCase(requestWeekUnlock.fulfilled, (state, action: PayloadAction<TimesheetWeekUnlockRequest>) => {
				state.unlockRequestMutating = false;
				state.myUnlockRequests = [action.payload, ...state.myUnlockRequests];
			})
			.addCase(requestWeekUnlock.rejected, (state, action: PayloadAction<any>) => {
				state.unlockRequestMutating = false;
				state.unlockRequestError = action.payload;
			})
			.addCase(approveWeekUnlock.fulfilled, (state, action: PayloadAction<TimesheetWeekUnlockRequest>) => {
				state.teamUnlockRequests = state.teamUnlockRequests.map((r) =>
					r.id === action.payload.id ? action.payload : r
				);
			})
			.addCase(denyWeekUnlock.fulfilled, (state, action: PayloadAction<TimesheetWeekUnlockRequest>) => {
				state.teamUnlockRequests = state.teamUnlockRequests.map((r) =>
					r.id === action.payload.id ? action.payload : r
				);
			})

			// Report Rows
			.addCase(fetchTimesheetReport.pending, (state) => {
				state.reportRowsLoading = true;
				state.reportRowsError = null;
			})
			.addCase(fetchTimesheetReport.fulfilled, (state, action: PayloadAction<TimesheetReportRow[]>) => {
				state.reportRowsLoading = false;
				state.reportRows = action.payload;
			})
			.addCase(fetchTimesheetReport.rejected, (state, action) => {
				state.reportRowsLoading = false;
				state.reportRowsError = action.payload as string;
			})

			// Generic Action Loading (Submissions, Approvals)
			.addMatcher(
				(action) =>
					action.type.endsWith('/pending') &&
					(action.type.includes('submitWeek') ||
						action.type.includes('approveWeek') ||
						action.type.includes('rejectWeek') ||
						action.type.includes('unapproveWeek')),
				(state) => {
					state.actionLoading = true;
					state.actionError = null;
				}
			)
			.addMatcher(
				(action) =>
					action.type.endsWith('/fulfilled') &&
					(action.type.includes('submitWeek') ||
						action.type.includes('approveWeek') ||
						action.type.includes('rejectWeek') ||
						action.type.includes('unapproveWeek')),
				(state) => {
					state.actionLoading = false;
				}
			)
			.addMatcher(
				(action) =>
					action.type.endsWith('/rejected') &&
					(action.type.includes('submitWeek') ||
						action.type.includes('approveWeek') ||
						action.type.includes('rejectWeek') ||
						action.type.includes('unapproveWeek')),
				(state, action: any) => {
					state.actionLoading = false;
					state.actionError = action.payload as string;
				}
			);
	}
});

export const { clearTimesheetErrors } = timesheetSlice.actions;
export default timesheetSlice.reducer;
