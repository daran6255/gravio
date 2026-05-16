import { createSlice, createAsyncThunk, type ActionReducerMapBuilder, type PayloadAction } from '@reduxjs/toolkit';
import dsrProjectService from '../../services/dsrProjectService';
import dsrActivityService from '../../services/dsrActivityService';
import dsrService from '../../services/dsrService';
import type {
	DSRProject, DSRActivity, DSREntry,
	DSRProjectCreate, DSRActivityCreate, DSREntryCreate,
	DSRStatus, MissingDSR, PaginationResult,
	DSRPermissionRequest, DSRPermissionStats,
	DSRLeaveApplication, DSRLeaveStats
} from '../../models/dsr';

interface DSRState {
	projects: DSRProject[];
	activities: DSRActivity[];
	activitiesByProject: Record<string, DSRActivity[]>;
	myEntries: DSREntry[];
	adminEntries: DSREntry[];
	calendarEntries: DSREntry[];
	myLeaves: DSRLeaveApplication[];
	calendarLeaves: any[];
	missingReports: MissingDSR[];
	permissionRequests: DSRPermissionRequest[];
	permissionStats: DSRPermissionStats | null;
	leaveStats: DSRLeaveStats | null;
	adminLeaves: DSRLeaveApplication[];
	totalAdminLeaves: number;
	totalProjects: number;
	totalActivities: number;
	totalMyEntries: number;
	totalAdminEntries: number;
	totalPermissionRequests: number;
	userStatsSummary: {
		total_hours_month: number;
		total_hours_all_time: number;
		total_leaves: number;
		not_worked_days: number;
	} | null;
	projectManagementStats: {
		totalProjects: number;
		activeProjects: number;
		totalActivities: number;
		completedActivities: number;
	} | null;
	loading: boolean;
	error: string | null;
}

const initialState: DSRState = {
	projects: [],
	activities: [],
	activitiesByProject: {},
	myEntries: [],
	adminEntries: [],
	calendarEntries: [],
	myLeaves: [],
	calendarLeaves: [],
	missingReports: [],
	permissionRequests: [],
	permissionStats: null,
	leaveStats: null,
	adminLeaves: [],
	totalAdminLeaves: 0,
	totalProjects: 0,
	totalActivities: 0,
	totalMyEntries: 0,
	totalAdminEntries: 0,
	totalPermissionRequests: 0,
	userStatsSummary: null,
	projectManagementStats: null,
	loading: false,
	error: null,
};

// --- Project Thunks ---

export const fetchProjects = createAsyncThunk(
	'dsr/fetchProjects',
	async (params: { skip?: number; limit?: number; active_only?: boolean; search?: string; assigned_to?: string } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, active_only = false, search, assigned_to } = params || {};
			return await dsrProjectService.getProjects(Number(skip), Number(limit), active_only, search, assigned_to);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch projects');
		}
	}
);

export const fetchProject = createAsyncThunk(
	'dsr/fetchProject',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await dsrProjectService.getProject(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch project');
		}
	}
);

export const createProject = createAsyncThunk(
	'dsr/createProject',
	async (data: DSRProjectCreate, { rejectWithValue }) => {
		try {
			return await dsrProjectService.createProject(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create project');
		}
	}
);

export const updateProject = createAsyncThunk(
	'dsr/updateProject',
	async ({ publicId, data }: { publicId: string; data: Partial<DSRProjectCreate> }, { rejectWithValue }) => {
		try {
			return await dsrProjectService.updateProject(publicId, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update project');
		}
	}
);

export const deleteProject = createAsyncThunk(
	'dsr/deleteProject',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await dsrProjectService.deleteProject(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete project');
		}
	}
);

// --- Activity Thunks ---

export const fetchActivities = createAsyncThunk(
	'dsr/fetchActivities',
	async (params: { projectId: string; skip?: number; limit?: number; search?: string; status?: any; active_only?: boolean; assigned_to?: string }, { rejectWithValue }) => {
		try {
			const { projectId, skip = 0, limit = 100, search, status, active_only, assigned_to } = params;
			return await dsrActivityService.getActivities(Number(skip), Number(limit), projectId, status, active_only, search, assigned_to);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activities');
		}
	}
);

export const fetchActivitiesForProject = createAsyncThunk(
	'dsr/fetchActivitiesForProject',
	async ({ projectId, assigned_to }: { projectId: string; assigned_to?: string }, { rejectWithValue }) => {
		try {
			const res = await dsrActivityService.getActivities(0, 500, projectId, undefined, undefined, undefined, assigned_to);
			return { projectId, activities: res.items };
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activities');
		}
	}
);

export const createActivity = createAsyncThunk(
	'dsr/createActivity',
	async (data: DSRActivityCreate, { rejectWithValue }) => {
		try {
			return await dsrActivityService.createActivity(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create activity');
		}
	}
);

export const updateActivity = createAsyncThunk(
	'dsr/updateActivity',
	async ({ publicId, data }: { publicId: string; data: Partial<DSRActivityCreate> }, { rejectWithValue }) => {
		try {
			return await dsrActivityService.updateActivity(publicId, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update activity');
		}
	}
);

export const deleteActivity = createAsyncThunk(
	'dsr/deleteActivity',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await dsrActivityService.deleteActivity(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete activity');
		}
	}
);

export const deleteActivities = createAsyncThunk(
	'dsr/deleteActivities',
	async (publicIds: string[], { rejectWithValue }) => {
		try {
			const response = await dsrActivityService.bulkDeleteActivities(publicIds);
			return response.deleted_public_ids;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete activities');
		}
	}
);

// --- Entry Thunks ---

export const fetchEntries = createAsyncThunk(
	'dsr/fetchEntries',
	async (params: { skip?: number; limit?: number; date_from?: string; date_to?: string; status?: DSRStatus } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, date_from, date_to, status } = params || {};
			return await dsrService.getEntries(Number(skip), Number(limit), date_from, date_to, status);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch entries');
		}
	}
);

export const fetchMyEntries = createAsyncThunk(
	'dsr/fetchMyEntries',
	async (params: { skip?: number; limit?: number; date_from?: string; date_to?: string; status?: DSRStatus; search?: string } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, date_from, date_to, status, search } = params || {};
			return await dsrService.getMyEntries(Number(skip), Number(limit), date_from, date_to, status, search);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch your entries');
		}
	}
);

export const fetchCalendarEntries = createAsyncThunk(
	'dsr/fetchCalendarEntries',
	async (params: { date_from: string; date_to?: string; user_id?: number }, { rejectWithValue }) => {
		try {
			const date_to = params.date_to || new Date().toISOString().split('T')[0];
			return await dsrService.getCalendarStatus(params.date_from, date_to, params.user_id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch calendar data');
		}
	}
);

export const fetchEntry = createAsyncThunk(
	'dsr/fetchEntry',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await dsrService.getEntry(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch entry');
		}
	}
);

export const createEntry = createAsyncThunk(
	'dsr/createEntry',
	async (data: DSREntryCreate, { rejectWithValue }) => {
		try {
			return await dsrService.createEntry(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create DSR entry');
		}
	}
);

export const applyLeave = createAsyncThunk(
	'dsr/applyLeave',
	async (data: { start_date: string; end_date: string; leave_type: string; reason?: string }, { rejectWithValue }) => {
		try {
			return await dsrService.applyLeave(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to apply leave');
		}
	}
);

export const fetchMyLeaves = createAsyncThunk(
	'dsr/fetchMyLeaves',
	async (params: { skip?: number; limit?: number; status?: string } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 50, status } = params || {};
			return await dsrService.getMyLeaves(skip, limit, status);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch your leaves');
		}
	}
);

export const cancelLeaveAction = createAsyncThunk(
	'dsr/cancelLeave',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await dsrService.cancelLeave(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to cancel leave');
		}
	}
);

export const fetchLeaveStats = createAsyncThunk(
	'dsr/fetchLeaveStats',
	async (_, { rejectWithValue }) => {
		try {
			return await dsrService.getLeaveStats();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch leave statistics');
		}
	}
);

export const submitEntry = createAsyncThunk(
	'dsr/submitEntry',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await dsrService.submitEntry(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to submit DSR entry');
		}
	}
);

export const deleteEntry = createAsyncThunk(
	'dsr/deleteEntry',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await dsrService.deleteEntry(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete DSR entry');
		}
	}
);

export const revokeEntryAction = createAsyncThunk(
	'dsr/revokeEntry',
	async ({ publicId, reason }: { publicId: string; reason?: string }, { rejectWithValue }) => {
		try {
			return await dsrService.revokeEntry(publicId, reason);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to revoke DSR entry');
		}
	}
);

// --- Admin Thunks ---

export const fetchAdminOverview = createAsyncThunk(
	'dsr/fetchAdminOverview',
	async (params: { skip?: number; limit?: number; date_from?: string; date_to?: string; search?: string; status?: string } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, date_from, date_to, search, status } = params || {};
			return await dsrService.getAdminOverview(Number(skip), Number(limit), date_from, date_to, search, status);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch admin overview');
		}
	}
);

export const fetchMissingReports = createAsyncThunk(
	'dsr/fetchMissingReports',
	async (date: string, { rejectWithValue }) => {
		try {
			return await dsrService.getMissingReports(date);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch missing reports');
		}
	}
);

export const grantDSRPermission = createAsyncThunk(
	'dsr/grantPermission',
	async (data: { user_public_id: string; target_date: string; expiry_hours?: number }, { rejectWithValue }) => {
		try {
			return await dsrService.grantPermission(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to grant permission');
		}
	}
);

export const sendDSRReminders = createAsyncThunk(
	'dsr/sendReminders',
	async (date: string, { rejectWithValue }) => {
		try {
			return await dsrService.sendReminders(date);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to send reminders');
		}
	}
);

export const fetchPermissionRequests = createAsyncThunk(
	'dsr/fetchPermissionRequests',
	async (params: { skip?: number; limit?: number; user_id?: number; status?: string; search?: string } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, user_id, status, search } = params || {};
			return await dsrService.getPermissionRequests(skip, limit, user_id, status, search);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch permission requests');
		}
	}
);

export const handlePermissionRequestAction = createAsyncThunk(
	'dsr/handlePermissionRequest',
	async ({ publicId, status, admin_notes }: { publicId: string; status: string; admin_notes?: string }, { rejectWithValue }) => {
		try {
			return await dsrService.handlePermissionRequest(publicId, { status, admin_notes });
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to handle permission request');
		}
	}
);

export const fetchAllLeaves = createAsyncThunk(
	'dsr/fetchAllLeaves',
	async (params: { skip?: number; limit?: number; status?: string; user_id?: number } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, status, user_id } = params || {};
			return await dsrService.getAllLeaves(skip, limit, status, user_id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch leave applications');
		}
	}
);

export const handleLeaveAction = createAsyncThunk(
	'dsr/handleLeaveAction',
	async ({ publicId, status, admin_notes }: { publicId: string; status: string; admin_notes?: string }, { rejectWithValue }) => {
		try {
			return await dsrService.handleLeaveRequest(publicId, { status, admin_notes });
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to handle leave application');
		}
	}
);

export const fetchPermissionStats = createAsyncThunk(
	'dsr/fetchPermissionStats',
	async (params: { user_id?: number } | undefined, { rejectWithValue }) => {
		try {
			const { user_id } = params || {};
			return await dsrService.getPermissionStats(user_id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch permission stats');
		}
	}
);

export const fetchMyStatsSummary = createAsyncThunk(
	'dsr/fetchMyStatsSummary',
	async (_, { rejectWithValue }) => {
		try {
			return await dsrService.getMyStatsSummary();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch summary stats');
		}
	}
);

export const fetchProjectManagementStats = createAsyncThunk(
	'dsr/fetchProjectManagementStats',
	async (_, { rejectWithValue }) => {
		try {
			const [projectsRes, activeProjectsRes, activitiesRes, completedActivitiesRes] = await Promise.all([
				dsrProjectService.getProjects(0, 1),
				dsrProjectService.getProjects(0, 1, true),
				dsrActivityService.getActivities(0, 1),
				dsrActivityService.getActivities(0, 1, undefined, 'completed')
			]);

			return {
				totalProjects: projectsRes.total,
				activeProjects: activeProjectsRes.total,
				totalActivities: activitiesRes.total,
				completedActivities: completedActivitiesRes.total
			};
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch project management statistics');
		}
	}
);

const dsrSlice = createSlice({
	name: 'dsr',
	initialState,
	reducers: {
		clearDSRError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builderValue: ActionReducerMapBuilder<DSRState>) => {
		builderValue
			// Projects
			.addCase(fetchProjects.fulfilled, (state, action: PayloadAction<PaginationResult<DSRProject>>) => {
				state.loading = false;
				state.projects = action.payload.items;
				state.totalProjects = action.payload.total;
			})
			.addCase(fetchProject.fulfilled, (state, action: PayloadAction<DSRProject>) => {
				state.loading = false;
				const index = state.projects.findIndex(p => p.public_id === action.payload.public_id);
				if (index !== -1) {
					state.projects[index] = action.payload;
				} else {
					state.projects.push(action.payload);
				}
			})
			.addCase(createProject.fulfilled, (state, action: PayloadAction<DSRProject>) => {
				state.loading = false;
				state.projects.unshift(action.payload);
				state.totalProjects += 1;
			})
			.addCase(updateProject.fulfilled, (state, action: PayloadAction<DSRProject>) => {
				state.loading = false;
				const index = state.projects.findIndex(p => p.public_id === action.payload.public_id);
				if (index !== -1) {
					state.projects[index] = action.payload;
				}
			})
			.addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
				state.loading = false;
				state.projects = state.projects.filter(p => p.public_id !== action.payload);
				state.totalProjects -= 1;
			})
			// Activities
			.addCase(fetchActivities.fulfilled, (state, action: PayloadAction<PaginationResult<DSRActivity>>) => {
				state.loading = false;
				state.activities = action.payload.items;
				state.totalActivities = action.payload.total;
			})
			.addCase(fetchActivitiesForProject.fulfilled, (state, action: PayloadAction<{ projectId: string; activities: DSRActivity[] }>) => {
				state.loading = false;
				state.activitiesByProject[action.payload.projectId] = action.payload.activities;
			})
			.addCase(createActivity.fulfilled, (state, action: PayloadAction<DSRActivity>) => {
				state.loading = false;
				state.activities.unshift(action.payload);
				state.totalActivities += 1;
			})
			.addCase(updateActivity.fulfilled, (state, action: PayloadAction<DSRActivity>) => {
				state.loading = false;
				const index = state.activities.findIndex(a => a.public_id === action.payload.public_id);
				if (index !== -1) {
					state.activities[index] = action.payload;
				}
			})
			.addCase(deleteActivity.fulfilled, (state, action: PayloadAction<string>) => {
				state.loading = false;
				state.activities = state.activities.filter(a => a.public_id !== action.payload);
				state.totalActivities -= 1;
			})
			.addCase(deleteActivities.fulfilled, (state, action: PayloadAction<string[]>) => {
				state.loading = false;
				state.activities = state.activities.filter(a => !action.payload.includes(a.public_id));
				state.totalActivities -= action.payload.length;
			})
			// Entries
			.addCase(fetchEntries.fulfilled, (state, action: PayloadAction<PaginationResult<DSREntry>>) => {
				state.loading = false;
				state.calendarEntries = action.payload.items;
			})
			.addCase(fetchCalendarEntries.fulfilled, (state, action: PayloadAction<{ entries: any[], leaves: any[] }>) => {
				state.loading = false;
				state.calendarEntries = action.payload.entries as any[];
				state.calendarLeaves = action.payload.leaves;
			})
			.addCase(fetchMyEntries.fulfilled, (state, action: PayloadAction<PaginationResult<DSREntry>>) => {
				state.loading = false;
				state.myEntries = action.payload.items;
				state.totalMyEntries = action.payload.total;
			})
			.addCase(fetchEntry.fulfilled, (state, action: PayloadAction<DSREntry>) => {
				state.loading = false;
				// Update in all relevant lists if present
				[state.myEntries, state.adminEntries, state.calendarEntries].forEach(list => {
					const index = list.findIndex(e => e.public_id === action.payload.public_id);
					if (index !== -1) list[index] = action.payload;
				});
			})
			.addCase(createEntry.fulfilled, (state, action: PayloadAction<DSREntry>) => {
				state.loading = false;

				// Deduplicate myEntries
				const myIndex = state.myEntries.findIndex(e => e.public_id === action.payload.public_id);
				if (myIndex !== -1) {
					state.myEntries[myIndex] = action.payload;
				} else {
					state.myEntries.unshift(action.payload);
					state.totalMyEntries += 1;
				}

				// Deduplicate calendarEntries
				const calIndex = state.calendarEntries.findIndex(e => e.public_id === action.payload.public_id);
				if (calIndex !== -1) {
					state.calendarEntries[calIndex] = action.payload;
				} else {
					state.calendarEntries.unshift(action.payload);
				}
			})
			.addCase(submitEntry.fulfilled, (state, action: PayloadAction<DSREntry>) => {
				state.loading = false;
				[state.myEntries, state.adminEntries, state.calendarEntries].forEach(list => {
					const index = list.findIndex(e => e.public_id === action.payload.public_id);
					if (index !== -1) list[index] = action.payload;
				});
			})
			.addCase(revokeEntryAction.fulfilled, (state, action: PayloadAction<DSREntry>) => {
				state.loading = false;
				[state.myEntries, state.adminEntries, state.calendarEntries].forEach(list => {
					const index = list.findIndex(e => e.public_id === action.payload.public_id);
					if (index !== -1) {
						list[index] = action.payload;
					}
				});
			})
			.addCase(applyLeave.fulfilled, (state, action: PayloadAction<DSRLeaveApplication>) => {
				state.loading = false;
				state.myLeaves.unshift(action.payload);
			})
			.addCase(fetchMyLeaves.fulfilled, (state, action: PayloadAction<{ items: DSRLeaveApplication[], total: number }>) => {
				state.loading = false;
				state.myLeaves = action.payload.items;
			})
			.addCase(cancelLeaveAction.fulfilled, (state, action: PayloadAction<DSRLeaveApplication>) => {
				state.loading = false;
				const index = state.myLeaves.findIndex(l => l.public_id === action.payload.public_id);
				if (index !== -1) {
					state.myLeaves[index] = action.payload;
				}
			})
			.addCase(deleteEntry.fulfilled, (state, action: PayloadAction<string>) => {
				state.loading = false;
				state.myEntries = state.myEntries.filter(e => e.public_id !== action.payload);
				state.totalMyEntries -= 1;
				state.adminEntries = state.adminEntries.filter(e => e.public_id !== action.payload);
				state.calendarEntries = state.calendarEntries.filter(e => e.public_id !== action.payload);
			})
			// Admin
			.addCase(fetchAdminOverview.fulfilled, (state, action: PayloadAction<PaginationResult<DSREntry>>) => {
				state.loading = false;
				state.adminEntries = action.payload.items;
				state.totalAdminEntries = action.payload.total;
			})
			.addCase(fetchMissingReports.fulfilled, (state, action: PayloadAction<MissingDSR[]>) => {
				state.loading = false;
				state.missingReports = action.payload;
			})
			.addCase(fetchPermissionRequests.fulfilled, (state, action: PayloadAction<{ items: any[]; total: number }>) => {
				state.loading = false;
				state.permissionRequests = action.payload.items;
				state.totalPermissionRequests = action.payload.total;
			})
			.addCase(handlePermissionRequestAction.fulfilled, (state, action: PayloadAction<DSRPermissionRequest>) => {
				state.loading = false;
				const index = state.permissionRequests.findIndex(r => r.public_id === action.payload.public_id);
				if (index !== -1) {
					state.permissionRequests[index] = action.payload;
				}
			})
			.addCase(fetchPermissionStats.fulfilled, (state, action: PayloadAction<DSRPermissionStats>) => {
				state.loading = false;
				state.permissionStats = action.payload;
			})
			.addCase(fetchLeaveStats.fulfilled, (state, action: PayloadAction<DSRLeaveStats>) => {
				state.loading = false;
				state.leaveStats = action.payload;
			})
			.addCase(fetchAllLeaves.fulfilled, (state, action: PayloadAction<{ items: DSRLeaveApplication[]; total: number }>) => {
				state.loading = false;
				state.adminLeaves = action.payload.items;
				state.totalAdminLeaves = action.payload.total;
			})
			.addCase(handleLeaveAction.fulfilled, (state, action: PayloadAction<DSRLeaveApplication>) => {
				state.loading = false;
				const index = state.adminLeaves.findIndex(l => l.public_id === action.payload.public_id);
				if (index !== -1) {
					state.adminLeaves[index] = action.payload;
				}
				// Also update in user's myLeaves if present
				const myIndex = state.myLeaves.findIndex(l => l.public_id === action.payload.public_id);
				if (myIndex !== -1) {
					state.myLeaves[myIndex] = action.payload;
				}
			})
			.addCase(fetchMyStatsSummary.fulfilled, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.userStatsSummary = action.payload;
			})
			.addCase(fetchProjectManagementStats.fulfilled, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.projectManagementStats = action.payload;
			})
			.addMatcher(
				(action) => action.type.startsWith('dsr/') && action.type.endsWith('/pending'),
				(state) => {
					state.loading = true;
					state.error = null;
				}
			)
			.addMatcher(
				(action) => action.type.startsWith('dsr/') && action.type.endsWith('/rejected'),
				(state, action: any) => {
					state.loading = false;
					state.error = action.payload || 'An unknown error occurred';
				}
			)
			.addMatcher(
				(action) => action.type.startsWith('dsr/') && action.type.endsWith('/fulfilled'),
				(state) => {
					state.loading = false;
				}
			);
	},
});

export const { clearDSRError } = dsrSlice.actions;
export default dsrSlice.reducer;
