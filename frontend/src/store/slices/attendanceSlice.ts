import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import trainingExtensionService from '../../services/trainingExtensionService';
import type { TrainingAttendance } from '../../models/training';

interface AttendanceState {
	attendance: TrainingAttendance[];
	loading: boolean;
	saving: boolean;
	error: string | null;
}

const initialState: AttendanceState = {
	attendance: [],
	loading: false,
	saving: false,
	error: null,
};

export const fetchAttendanceByBatch = createAsyncThunk(
	'attendance/fetchByBatch',
	async (batchId: number, { rejectWithValue }) => {
		try {
			const response = await trainingExtensionService.getAttendance(batchId);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
		}
	}
);

export const fetchAttendanceByDate = createAsyncThunk(
	'attendance/fetchByDate',
	async ({ batchId, date }: { batchId: number, date: string }, { rejectWithValue }) => {
		try {
			const response = await trainingExtensionService.getAttendanceByDate(batchId, date);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance for date');
		}
	}
);

export const updateBulkAttendance = createAsyncThunk(
	'attendance/updateBulk',
	async (data: TrainingAttendance[], { rejectWithValue }) => {
		try {
			const response = await trainingExtensionService.updateBulkAttendance(data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to save bulk attendance');
		}
	}
);

export const updateAttendance = createAsyncThunk(
	'attendance/update',
	async ({ attendanceId, data }: { attendanceId: number, data: Partial<TrainingAttendance> }, { rejectWithValue }) => {
		try {
			const response = await trainingExtensionService.updateAttendance(attendanceId, data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to update attendance');
		}
	}
);

export const deleteAttendance = createAsyncThunk(
	'attendance/delete',
	async (attendanceId: number, { rejectWithValue }) => {
		try {
			await trainingExtensionService.deleteAttendance(attendanceId);
			return attendanceId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to delete attendance');
		}
	}
);

export const deleteAttendanceByCandidate = createAsyncThunk(
	'attendance/deleteByCandidate',
	async ({ candidateId, batchId }: { candidateId: number; batchId: number }, { rejectWithValue }) => {
		try {
			const result = await trainingExtensionService.deleteAttendanceByCandidate(candidateId, batchId);
			return { candidateId, batchId, deleted_count: result.deleted_count };
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.detail || error.response?.data?.message || 'Failed to delete candidate attendance'
			);
		}
	}
);

const attendanceSlice = createSlice({
	name: 'attendance',
	initialState,
	reducers: {
		setAttendance: (state, action: PayloadAction<TrainingAttendance[]>) => {
			state.attendance = action.payload;
		},
		updateLocalAttendance: (state, action: PayloadAction<TrainingAttendance>) => {
			const index = state.attendance.findIndex(a =>
				a.candidate_id === action.payload.candidate_id &&
				a.date === action.payload.date &&
				a.period_id === action.payload.period_id
			);
			if (index !== -1) {
				state.attendance[index] = { ...state.attendance[index], ...action.payload };
			} else {
				state.attendance.push(action.payload);
			}
		},
		clearAttendanceError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch
			.addCase(fetchAttendanceByBatch.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAttendanceByBatch.fulfilled, (state, action: PayloadAction<TrainingAttendance[]>) => {
				state.loading = false;
				state.attendance = action.payload;
			})
			.addCase(fetchAttendanceByBatch.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Fetch By Date
			.addCase(fetchAttendanceByDate.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchAttendanceByDate.fulfilled, (state, action: PayloadAction<TrainingAttendance[]>) => {
				state.loading = false;
				// Merge or replace? For tracker we usually replace for the date if we are just viewing that date
				// But tracker fetches once for the batch. Let's merge for now.
				action.payload.forEach(newRecord => {
					const index = state.attendance.findIndex(a => a.id === newRecord.id);
					if (index !== -1) {
						state.attendance[index] = newRecord;
					} else {
						state.attendance.push(newRecord);
					}
				});
			})
			// Bulk Update
			.addCase(updateBulkAttendance.pending, (state) => {
				state.saving = true;
			})
			.addCase(updateBulkAttendance.fulfilled, (state, action: PayloadAction<TrainingAttendance[]>) => {
				state.saving = false;
				action.payload.forEach(newRecord => {
					const index = state.attendance.findIndex(a => a.id === newRecord.id);
					if (index !== -1) {
						state.attendance[index] = newRecord;
					} else {
						state.attendance.push(newRecord);
					}
				});
			})
			.addCase(updateBulkAttendance.rejected, (state, action: PayloadAction<any>) => {
				state.saving = false;
				state.error = action.payload;
			})
			// Update single
			.addCase(updateAttendance.fulfilled, (state, action: PayloadAction<TrainingAttendance>) => {
				const index = state.attendance.findIndex(a => a.id === action.payload.id);
				if (index !== -1) {
					state.attendance[index] = action.payload;
				}
			})
			// Delete
			.addCase(deleteAttendance.fulfilled, (state, action: PayloadAction<number>) => {
				state.attendance = state.attendance.filter(a => a.id !== action.payload);
			})
			// Delete all for a candidate in a batch
			.addCase(deleteAttendanceByCandidate.fulfilled, (state, action) => {
				const { candidateId, batchId } = action.payload;
				state.attendance = state.attendance.filter(
					a => !(a.candidate_id === candidateId && a.batch_id === batchId)
				);
			});
	},
});

export const { setAttendance, updateLocalAttendance, clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
