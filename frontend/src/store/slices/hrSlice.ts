import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
	hrDepartmentApi,
	hrDesignationApi,
	hrEmployeeApi,
	hrLeaveTypeApi,
	hrLeaveBalanceApi,
	hrLeaveRequestApi,
	hrPayrollComponentApi,
	hrPayrollStructureApi,
	hrEmployeeSalaryApi,
	hrPayrollRunApi,
	hrVariablePayApi,
	hrPayslipApi,
	hrChecklistTemplateApi,
	hrChecklistInstanceApi,
	hrEmployeeDocumentApi,
	hrAnalyticsApi,
	type EmployeeListParams,
	type PayslipListParams,
} from '../../services/hrService';
import type {
	HRDepartmentListItem, HRDepartmentResponse, HRDepartmentCreate, HRDepartmentUpdate,
	HRDesignationListItem, HRDesignationResponse, HRDesignationCreate, HRDesignationUpdate,
	HREmployeeListItem, HREmployeeResponse, HREmployeeProfileCreate, HREmployeeProfileUpdate,
	HRLeaveTypeListItem, HRLeaveTypeResponse, HRLeaveTypeCreate, HRLeaveTypeUpdate,
	HRLeaveBalanceResponse, HRLeaveBalanceUpdate,
	HRLeaveRequestResponse, HRLeaveRequestCreate, HRLeaveApprovalRequest,
	HRSalaryComponent, HRSalaryComponentCreate, HRSalaryComponentUpdate,
	HRSalaryStructure, HRSalaryStructureCreate, HRSalaryStructureUpdate,
	HREmployeeSalary, HREmployeeSalaryCreate,
	HRPayrollRun, HRPayrollRunCreate,
	HRVariablePayEntry, HRVariablePayEntryCreate,
	HRPayslip,
	HRChecklistTemplate, HRChecklistInstance, HREmployeeDocument,
	HeadcountReport, AttritionReport, LeaveSummaryReport, PayrollCostReport,
} from '../../models/hr';

function extractErrorMessage(error: any, fallback: string): string {
	return error?.response?.data?.error?.message || error?.response?.data?.detail || error?.message || fallback;
}

interface HRState {
	// Departments
	departments: HRDepartmentListItem[];
	departmentsLoading: boolean;
	departmentsError: string | null;

	// Designations
	designations: HRDesignationListItem[];
	designationsLoading: boolean;
	designationsError: string | null;

	// Employees
	employees: HREmployeeListItem[];
	employeesTotal: number;
	employeesLoading: boolean;
	employeesError: string | null;
	currentEmployee: HREmployeeResponse | null;
	currentEmployeeLoading: boolean;
	currentEmployeeError: string | null;

	// Leave Types
	leaveTypes: HRLeaveTypeListItem[];
	leaveTypesLoading: boolean;
	leaveTypesError: string | null;

	// Leave Balances
	myLeaveBalances: HRLeaveBalanceResponse[];
	myLeaveBalancesLoading: boolean;
	employeeLeaveBalances: HRLeaveBalanceResponse[];
	employeeLeaveBalancesLoading: boolean;

	// Leave Requests
	myLeaveRequests: HRLeaveRequestResponse[];
	myLeaveRequestsLoading: boolean;
	myLeaveRequestsError: string | null;
	pendingLeaveRequests: HRLeaveRequestResponse[];
	pendingLeaveRequestsLoading: boolean;

	// Payroll Components
	payrollComponents: HRSalaryComponent[];
	payrollComponentsLoading: boolean;
	payrollComponentsError: string | null;

	// Payroll Structures
	payrollStructures: HRSalaryStructure[];
	payrollStructuresLoading: boolean;
	payrollStructuresError: string | null;

	// Employee Salary Assignment
	employeeSalary: HREmployeeSalary | null;
	employeeSalaryLoading: boolean;

	// Payroll Runs
	payrollRuns: HRPayrollRun[];
	payrollRunsLoading: boolean;
	payrollRunsError: string | null;

	// Payslips
	payslips: HRPayslip[];
	payslipsLoading: boolean;
	payslipsError: string | null;

	// Checklist Templates
	checklistTemplates: HRChecklistTemplate[];
	checklistTemplatesLoading: boolean;
	checklistTemplatesError: string | null;

	// Checklist Instances
	checklistInstances: HRChecklistInstance[];
	checklistInstancesLoading: boolean;
	checklistInstancesError: string | null;

	// Employee Documents
	documents: HREmployeeDocument[];
	documentsLoading: boolean;
	documentsError: string | null;

	// Analytics & Reports
	headcountReport: HeadcountReport | null;
	attritionReport: AttritionReport | null;
	leaveSummaryReport: LeaveSummaryReport | null;
	payrollCostReport: PayrollCostReport | null;
	analyticsLoading: boolean;
	analyticsError: string | null;

	// Generic mutation flag shared by create/update/delete actions across HR
	actionLoading: boolean;
	actionError: string | null;
}

const initialState: HRState = {
	departments: [],
	departmentsLoading: false,
	departmentsError: null,

	designations: [],
	designationsLoading: false,
	designationsError: null,

	employees: [],
	employeesTotal: 0,
	employeesLoading: false,
	employeesError: null,
	currentEmployee: null,
	currentEmployeeLoading: false,
	currentEmployeeError: null,

	leaveTypes: [],
	leaveTypesLoading: false,
	leaveTypesError: null,

	myLeaveBalances: [],
	myLeaveBalancesLoading: false,
	employeeLeaveBalances: [],
	employeeLeaveBalancesLoading: false,

	myLeaveRequests: [],
	myLeaveRequestsLoading: false,
	myLeaveRequestsError: null,
	pendingLeaveRequests: [],
	pendingLeaveRequestsLoading: false,

	payrollComponents: [],
	payrollComponentsLoading: false,
	payrollComponentsError: null,

	payrollStructures: [],
	payrollStructuresLoading: false,
	payrollStructuresError: null,

	employeeSalary: null,
	employeeSalaryLoading: false,

	payrollRuns: [],
	payrollRunsLoading: false,
	payrollRunsError: null,

	payslips: [],
	payslipsLoading: false,
	payslipsError: null,

	checklistTemplates: [],
	checklistTemplatesLoading: false,
	checklistTemplatesError: null,

	checklistInstances: [],
	checklistInstancesLoading: false,
	checklistInstancesError: null,

	documents: [],
	documentsLoading: false,
	documentsError: null,

	headcountReport: null,
	attritionReport: null,
	leaveSummaryReport: null,
	payrollCostReport: null,
	analyticsLoading: false,
	analyticsError: null,

	actionLoading: false,
	actionError: null,
};

// ==========================================
// ASYNC THUNKS -- Departments
// ==========================================

export const fetchDepartments = createAsyncThunk(
	'hr/fetchDepartments',
	async (includeInactive: boolean | undefined, { rejectWithValue }) => {
		try {
			return await hrDepartmentApi.list(includeInactive);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch departments'));
		}
	}
);

export const createDepartment = createAsyncThunk(
	'hr/createDepartment',
	async (payload: HRDepartmentCreate, { rejectWithValue }) => {
		try {
			return await hrDepartmentApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create department'));
		}
	}
);

export const updateDepartment = createAsyncThunk(
	'hr/updateDepartment',
	async (arg: { id: number; payload: HRDepartmentUpdate }, { rejectWithValue }) => {
		try {
			return await hrDepartmentApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update department'));
		}
	}
);

export const deleteDepartment = createAsyncThunk(
	'hr/deleteDepartment',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrDepartmentApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete department'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Designations
// ==========================================

export const fetchDesignations = createAsyncThunk(
	'hr/fetchDesignations',
	async (departmentId: number | undefined, { rejectWithValue }) => {
		try {
			return await hrDesignationApi.list(departmentId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch designations'));
		}
	}
);

export const createDesignation = createAsyncThunk(
	'hr/createDesignation',
	async (payload: HRDesignationCreate, { rejectWithValue }) => {
		try {
			return await hrDesignationApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create designation'));
		}
	}
);

export const updateDesignation = createAsyncThunk(
	'hr/updateDesignation',
	async (arg: { id: number; payload: HRDesignationUpdate }, { rejectWithValue }) => {
		try {
			return await hrDesignationApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update designation'));
		}
	}
);

export const deleteDesignation = createAsyncThunk(
	'hr/deleteDesignation',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrDesignationApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete designation'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Employees
// ==========================================

export const fetchEmployees = createAsyncThunk(
	'hr/fetchEmployees',
	async (params: EmployeeListParams | undefined, { rejectWithValue }) => {
		try {
			return await hrEmployeeApi.list(params);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch employees'));
		}
	}
);

export const fetchEmployee = createAsyncThunk(
	'hr/fetchEmployee',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await hrEmployeeApi.get(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch employee'));
		}
	}
);

export const fetchEmployeeByUserId = createAsyncThunk(
	'hr/fetchEmployeeByUserId',
	async (userId: number, { rejectWithValue }) => {
		try {
			return await hrEmployeeApi.getByUserId(userId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch employee'));
		}
	}
);

export const createEmployee = createAsyncThunk(
	'hr/createEmployee',
	async (payload: HREmployeeProfileCreate, { rejectWithValue }) => {
		try {
			return await hrEmployeeApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create employee profile'));
		}
	}
);

export const updateEmployee = createAsyncThunk(
	'hr/updateEmployee',
	async (arg: { publicId: string; payload: HREmployeeProfileUpdate }, { rejectWithValue }) => {
		try {
			return await hrEmployeeApi.update(arg.publicId, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update employee profile'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Leave Types
// ==========================================

export const fetchLeaveTypes = createAsyncThunk(
	'hr/fetchLeaveTypes',
	async (includeInactive: boolean | undefined, { rejectWithValue }) => {
		try {
			return await hrLeaveTypeApi.list(includeInactive);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch leave types'));
		}
	}
);

export const createLeaveType = createAsyncThunk(
	'hr/createLeaveType',
	async (payload: HRLeaveTypeCreate, { rejectWithValue }) => {
		try {
			return await hrLeaveTypeApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create leave type'));
		}
	}
);

export const updateLeaveType = createAsyncThunk(
	'hr/updateLeaveType',
	async (arg: { id: number; payload: HRLeaveTypeUpdate }, { rejectWithValue }) => {
		try {
			return await hrLeaveTypeApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update leave type'));
		}
	}
);

export const deleteLeaveType = createAsyncThunk(
	'hr/deleteLeaveType',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrLeaveTypeApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete leave type'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Leave Balances
// ==========================================

export const fetchMyLeaveBalances = createAsyncThunk(
	'hr/fetchMyLeaveBalances',
	async (year: number | undefined, { rejectWithValue }) => {
		try {
			return await hrLeaveBalanceApi.getMyBalances(year);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch your leave balances'));
		}
	}
);

export const fetchEmployeeLeaveBalances = createAsyncThunk(
	'hr/fetchEmployeeLeaveBalances',
	async (arg: { userId: number; year?: number }, { rejectWithValue }) => {
		try {
			return await hrLeaveBalanceApi.getEmployeeBalances(arg.userId, arg.year);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch employee leave balances'));
		}
	}
);

export const updateLeaveBalance = createAsyncThunk(
	'hr/updateLeaveBalance',
	async (arg: { id: number; payload: HRLeaveBalanceUpdate }, { rejectWithValue }) => {
		try {
			return await hrLeaveBalanceApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update leave balance'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Leave Requests
// ==========================================

export const fetchMyLeaveRequests = createAsyncThunk(
	'hr/fetchMyLeaveRequests',
	async (statusFilter: string | undefined, { rejectWithValue }) => {
		try {
			return await hrLeaveRequestApi.getMyRequests(statusFilter);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch your leave requests'));
		}
	}
);

export const createLeaveRequest = createAsyncThunk(
	'hr/createLeaveRequest',
	async (payload: HRLeaveRequestCreate, { rejectWithValue }) => {
		try {
			return await hrLeaveRequestApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to submit leave request'));
		}
	}
);

export const fetchPendingLeaveRequests = createAsyncThunk(
	'hr/fetchPendingLeaveRequests',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrLeaveRequestApi.listPending();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch pending leave requests'));
		}
	}
);

export const fetchLeaveRequest = createAsyncThunk(
	'hr/fetchLeaveRequest',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await hrLeaveRequestApi.get(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch leave request'));
		}
	}
);

export const approveRejectLeaveRequest = createAsyncThunk(
	'hr/approveRejectLeaveRequest',
	async (arg: { publicId: string; payload: HRLeaveApprovalRequest }, { rejectWithValue }) => {
		try {
			return await hrLeaveRequestApi.approveReject(arg.publicId, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to resolve leave request'));
		}
	}
);

export const cancelLeaveRequest = createAsyncThunk(
	'hr/cancelLeaveRequest',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await hrLeaveRequestApi.cancel(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to cancel leave request'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Payroll Components
// ==========================================

export const fetchPayrollComponents = createAsyncThunk(
	'hr/fetchPayrollComponents',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrPayrollComponentApi.list();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch payroll components'));
		}
	}
);

export const createPayrollComponent = createAsyncThunk(
	'hr/createPayrollComponent',
	async (payload: HRSalaryComponentCreate, { rejectWithValue }) => {
		try {
			return await hrPayrollComponentApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create payroll component'));
		}
	}
);

export const updatePayrollComponent = createAsyncThunk(
	'hr/updatePayrollComponent',
	async (arg: { id: number; payload: HRSalaryComponentUpdate }, { rejectWithValue }) => {
		try {
			return await hrPayrollComponentApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update payroll component'));
		}
	}
);

export const deletePayrollComponent = createAsyncThunk(
	'hr/deletePayrollComponent',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrPayrollComponentApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete payroll component'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Salary Structures
// ==========================================

export const fetchPayrollStructures = createAsyncThunk(
	'hr/fetchPayrollStructures',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrPayrollStructureApi.list();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch salary structures'));
		}
	}
);

export const createPayrollStructure = createAsyncThunk(
	'hr/createPayrollStructure',
	async (payload: HRSalaryStructureCreate, { rejectWithValue }) => {
		try {
			return await hrPayrollStructureApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create salary structure'));
		}
	}
);

export const updatePayrollStructure = createAsyncThunk(
	'hr/updatePayrollStructure',
	async (arg: { id: number; payload: HRSalaryStructureUpdate }, { rejectWithValue }) => {
		try {
			return await hrPayrollStructureApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update salary structure'));
		}
	}
);

export const deletePayrollStructure = createAsyncThunk(
	'hr/deletePayrollStructure',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrPayrollStructureApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete salary structure'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Employee Salary Assignment
// ==========================================

export const fetchEmployeeSalary = createAsyncThunk(
	'hr/fetchEmployeeSalary',
	async (userId: number, { rejectWithValue }) => {
		try {
			return await hrEmployeeSalaryApi.get(userId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch employee salary'));
		}
	}
);

export const assignEmployeeSalary = createAsyncThunk(
	'hr/assignEmployeeSalary',
	async (payload: HREmployeeSalaryCreate, { rejectWithValue }) => {
		try {
			return await hrEmployeeSalaryApi.assign(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to assign employee salary'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Payroll Runs & Variable Pay
// ==========================================

export const fetchPayrollRuns = createAsyncThunk(
	'hr/fetchPayrollRuns',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrPayrollRunApi.list();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch payroll runs'));
		}
	}
);

export const createPayrollRun = createAsyncThunk(
	'hr/createPayrollRun',
	async (payload: HRPayrollRunCreate, { rejectWithValue }) => {
		try {
			return await hrPayrollRunApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create payroll run'));
		}
	}
);

export const calculatePayrollRun = createAsyncThunk(
	'hr/calculatePayrollRun',
	async (id: number, { rejectWithValue }) => {
		try {
			return await hrPayrollRunApi.calculate(id);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to calculate payroll run'));
		}
	}
);

export const finalizePayrollRun = createAsyncThunk(
	'hr/finalizePayrollRun',
	async (id: number, { rejectWithValue }) => {
		try {
			return await hrPayrollRunApi.finalize(id);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to finalize payroll run'));
		}
	}
);

export const createVariablePayEntry = createAsyncThunk(
	'hr/createVariablePayEntry',
	async (arg: { runId: number; payload: HRVariablePayEntryCreate }, { rejectWithValue }) => {
		try {
			return await hrVariablePayApi.create(arg.runId, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to add variable pay entry'));
		}
	}
);

export const deleteVariablePayEntry = createAsyncThunk(
	'hr/deleteVariablePayEntry',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrVariablePayApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to remove variable pay entry'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Payslips
// ==========================================

export const fetchPayslips = createAsyncThunk(
	'hr/fetchPayslips',
	async (params: PayslipListParams | undefined, { rejectWithValue }) => {
		try {
			return await hrPayslipApi.list(params);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch payslips'));
		}
	}
);

export const fetchPayslip = createAsyncThunk(
	'hr/fetchPayslip',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await hrPayslipApi.get(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch payslip'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Checklist Templates & Instances
// ==========================================

export const fetchChecklistTemplates = createAsyncThunk(
	'hr/fetchChecklistTemplates',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrChecklistTemplateApi.list();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch checklist templates'));
		}
	}
);

export const createChecklistTemplate = createAsyncThunk(
	'hr/createChecklistTemplate',
	async (payload: Partial<HRChecklistTemplate>, { rejectWithValue }) => {
		try {
			return await hrChecklistTemplateApi.create(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create checklist template'));
		}
	}
);

export const updateChecklistTemplate = createAsyncThunk(
	'hr/updateChecklistTemplate',
	async (arg: { id: number; payload: Partial<HRChecklistTemplate> }, { rejectWithValue }) => {
		try {
			return await hrChecklistTemplateApi.update(arg.id, arg.payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update checklist template'));
		}
	}
);

export const deleteChecklistTemplate = createAsyncThunk(
	'hr/deleteChecklistTemplate',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrChecklistTemplateApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete checklist template'));
		}
	}
);

export const fetchChecklistInstances = createAsyncThunk(
	'hr/fetchChecklistInstances',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrChecklistInstanceApi.list();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch checklist trackers'));
		}
	}
);

export const launchChecklistInstance = createAsyncThunk(
	'hr/launchChecklistInstance',
	async (payload: { user_id: number; template_id: number; others?: any }, { rejectWithValue }) => {
		try {
			return await hrChecklistInstanceApi.launch(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to launch checklist'));
		}
	}
);

export const toggleChecklistTask = createAsyncThunk(
	'hr/toggleChecklistTask',
	async (arg: { id: number; taskId: string; completed: boolean }, { rejectWithValue }) => {
		try {
			return await hrChecklistInstanceApi.toggleTask(arg.id, arg.taskId, arg.completed);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update task state'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Employee Documents
// ==========================================

export const fetchDocuments = createAsyncThunk(
	'hr/fetchDocuments',
	async (userId: number | undefined, { rejectWithValue }) => {
		try {
			return await hrEmployeeDocumentApi.list(userId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch documents'));
		}
	}
);

export const uploadDocument = createAsyncThunk(
	'hr/uploadDocument',
	async (formData: FormData, { rejectWithValue }) => {
		try {
			return await hrEmployeeDocumentApi.upload(formData);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to upload document'));
		}
	}
);

export const verifyDocument = createAsyncThunk(
	'hr/verifyDocument',
	async (arg: { id: number; isVerified: boolean }, { rejectWithValue }) => {
		try {
			return await hrEmployeeDocumentApi.verify(arg.id, arg.isVerified);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update verification status'));
		}
	}
);

export const deleteDocument = createAsyncThunk(
	'hr/deleteDocument',
	async (id: number, { rejectWithValue }) => {
		try {
			await hrEmployeeDocumentApi.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete document'));
		}
	}
);

// ==========================================
// ASYNC THUNKS -- Analytics & Reports
// ==========================================

export const fetchHeadcountReport = createAsyncThunk(
	'hr/fetchHeadcountReport',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrAnalyticsApi.getHeadcount();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch headcount report'));
		}
	}
);

export const fetchAttritionReport = createAsyncThunk(
	'hr/fetchAttritionReport',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrAnalyticsApi.getAttrition();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch attrition report'));
		}
	}
);

export const fetchLeaveSummaryReport = createAsyncThunk(
	'hr/fetchLeaveSummaryReport',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrAnalyticsApi.getLeavesSummary();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch leave summary report'));
		}
	}
);

export const fetchPayrollCostReport = createAsyncThunk(
	'hr/fetchPayrollCostReport',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await hrAnalyticsApi.getPayrollCosts();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch payroll cost report'));
		}
	}
);

// A single thunk the Analytics dashboard can dispatch once instead of four separate calls.
export const fetchAllHRAnalytics = createAsyncThunk(
	'hr/fetchAllHRAnalytics',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			const [headcount, attrition, leaves, payroll] = await Promise.all([
				hrAnalyticsApi.getHeadcount(),
				hrAnalyticsApi.getAttrition(),
				hrAnalyticsApi.getLeavesSummary(),
				hrAnalyticsApi.getPayrollCosts(),
			]);
			return { headcount, attrition, leaves, payroll };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to load HR analytics'));
		}
	}
);

// ==========================================
// HR SLICE
// ==========================================

const hrSlice = createSlice({
	name: 'hr',
	initialState,
	reducers: {
		clearHRErrors(state) {
			state.departmentsError = null;
			state.designationsError = null;
			state.employeesError = null;
			state.currentEmployeeError = null;
			state.leaveTypesError = null;
			state.myLeaveRequestsError = null;
			state.payrollComponentsError = null;
			state.payrollStructuresError = null;
			state.payrollRunsError = null;
			state.payslipsError = null;
			state.checklistTemplatesError = null;
			state.checklistInstancesError = null;
			state.documentsError = null;
			state.analyticsError = null;
			state.actionError = null;
		},
		clearCurrentEmployee(state) {
			state.currentEmployee = null;
			state.currentEmployeeError = null;
		}
	},
	extraReducers: (builder) => {
		builder
			// --- Departments ---
			.addCase(fetchDepartments.pending, (state) => {
				state.departmentsLoading = true;
				state.departmentsError = null;
			})
			.addCase(fetchDepartments.fulfilled, (state, action: PayloadAction<HRDepartmentListItem[]>) => {
				state.departmentsLoading = false;
				state.departments = action.payload;
			})
			.addCase(fetchDepartments.rejected, (state, action) => {
				state.departmentsLoading = false;
				state.departmentsError = action.payload as string;
			})
			.addCase(createDepartment.fulfilled, (state, action: PayloadAction<HRDepartmentResponse>) => {
				state.departments.unshift(action.payload);
			})
			.addCase(updateDepartment.fulfilled, (state, action: PayloadAction<HRDepartmentResponse>) => {
				const idx = state.departments.findIndex((d) => d.id === action.payload.id);
				if (idx !== -1) state.departments[idx] = { ...state.departments[idx], ...action.payload };
			})
			.addCase(deleteDepartment.fulfilled, (state, action: PayloadAction<number>) => {
				state.departments = state.departments.filter((d) => d.id !== action.payload);
			})

			// --- Designations ---
			.addCase(fetchDesignations.pending, (state) => {
				state.designationsLoading = true;
				state.designationsError = null;
			})
			.addCase(fetchDesignations.fulfilled, (state, action: PayloadAction<HRDesignationListItem[]>) => {
				state.designationsLoading = false;
				state.designations = action.payload;
			})
			.addCase(fetchDesignations.rejected, (state, action) => {
				state.designationsLoading = false;
				state.designationsError = action.payload as string;
			})
			.addCase(createDesignation.fulfilled, (state, action: PayloadAction<HRDesignationResponse>) => {
				state.designations.unshift(action.payload);
			})
			.addCase(updateDesignation.fulfilled, (state, action: PayloadAction<HRDesignationResponse>) => {
				const idx = state.designations.findIndex((d) => d.id === action.payload.id);
				if (idx !== -1) state.designations[idx] = { ...state.designations[idx], ...action.payload };
			})
			.addCase(deleteDesignation.fulfilled, (state, action: PayloadAction<number>) => {
				state.designations = state.designations.filter((d) => d.id !== action.payload);
			})

			// --- Employees ---
			.addCase(fetchEmployees.pending, (state) => {
				state.employeesLoading = true;
				state.employeesError = null;
			})
			.addCase(fetchEmployees.fulfilled, (state, action) => {
				state.employeesLoading = false;
				state.employees = action.payload.items;
				state.employeesTotal = action.payload.total;
			})
			.addCase(fetchEmployees.rejected, (state, action) => {
				state.employeesLoading = false;
				state.employeesError = action.payload as string;
			})
			.addCase(fetchEmployee.pending, (state) => {
				state.currentEmployeeLoading = true;
				state.currentEmployeeError = null;
			})
			.addCase(fetchEmployee.fulfilled, (state, action: PayloadAction<HREmployeeResponse>) => {
				state.currentEmployeeLoading = false;
				state.currentEmployee = action.payload;
			})
			.addCase(fetchEmployee.rejected, (state, action) => {
				state.currentEmployeeLoading = false;
				state.currentEmployeeError = action.payload as string;
			})
			.addCase(fetchEmployeeByUserId.pending, (state) => {
				state.currentEmployeeLoading = true;
				state.currentEmployeeError = null;
			})
			.addCase(fetchEmployeeByUserId.fulfilled, (state, action: PayloadAction<HREmployeeResponse>) => {
				state.currentEmployeeLoading = false;
				state.currentEmployee = action.payload;
			})
			.addCase(fetchEmployeeByUserId.rejected, (state, action) => {
				state.currentEmployeeLoading = false;
				state.currentEmployeeError = action.payload as string;
			})
			.addCase(updateEmployee.fulfilled, (state, action: PayloadAction<HREmployeeResponse>) => {
				if (state.currentEmployee?.public_id === action.payload.public_id) {
					state.currentEmployee = action.payload;
				}
				const idx = state.employees.findIndex((e) => e.public_id === action.payload.public_id);
				if (idx !== -1) state.employees[idx] = { ...state.employees[idx], ...action.payload };
			})

			// --- Leave Types ---
			.addCase(fetchLeaveTypes.pending, (state) => {
				state.leaveTypesLoading = true;
				state.leaveTypesError = null;
			})
			.addCase(fetchLeaveTypes.fulfilled, (state, action: PayloadAction<HRLeaveTypeListItem[]>) => {
				state.leaveTypesLoading = false;
				state.leaveTypes = action.payload;
			})
			.addCase(fetchLeaveTypes.rejected, (state, action) => {
				state.leaveTypesLoading = false;
				state.leaveTypesError = action.payload as string;
			})
			.addCase(createLeaveType.fulfilled, (state, action: PayloadAction<HRLeaveTypeResponse>) => {
				state.leaveTypes.unshift(action.payload);
			})
			.addCase(updateLeaveType.fulfilled, (state, action: PayloadAction<HRLeaveTypeResponse>) => {
				const idx = state.leaveTypes.findIndex((t) => t.id === action.payload.id);
				if (idx !== -1) state.leaveTypes[idx] = { ...state.leaveTypes[idx], ...action.payload };
			})
			.addCase(deleteLeaveType.fulfilled, (state, action: PayloadAction<number>) => {
				state.leaveTypes = state.leaveTypes.filter((t) => t.id !== action.payload);
			})

			// --- Leave Balances ---
			.addCase(fetchMyLeaveBalances.pending, (state) => {
				state.myLeaveBalancesLoading = true;
			})
			.addCase(fetchMyLeaveBalances.fulfilled, (state, action: PayloadAction<HRLeaveBalanceResponse[]>) => {
				state.myLeaveBalancesLoading = false;
				state.myLeaveBalances = action.payload;
			})
			.addCase(fetchMyLeaveBalances.rejected, (state) => {
				state.myLeaveBalancesLoading = false;
			})
			.addCase(fetchEmployeeLeaveBalances.pending, (state) => {
				state.employeeLeaveBalancesLoading = true;
			})
			.addCase(fetchEmployeeLeaveBalances.fulfilled, (state, action: PayloadAction<HRLeaveBalanceResponse[]>) => {
				state.employeeLeaveBalancesLoading = false;
				state.employeeLeaveBalances = action.payload;
			})
			.addCase(fetchEmployeeLeaveBalances.rejected, (state) => {
				state.employeeLeaveBalancesLoading = false;
			})
			.addCase(updateLeaveBalance.fulfilled, (state, action: PayloadAction<HRLeaveBalanceResponse>) => {
				const updateIn = (list: HRLeaveBalanceResponse[]) => {
					const idx = list.findIndex((b) => b.id === action.payload.id);
					if (idx !== -1) list[idx] = action.payload;
				};
				updateIn(state.myLeaveBalances);
				updateIn(state.employeeLeaveBalances);
			})

			// --- Leave Requests ---
			.addCase(fetchMyLeaveRequests.pending, (state) => {
				state.myLeaveRequestsLoading = true;
				state.myLeaveRequestsError = null;
			})
			.addCase(fetchMyLeaveRequests.fulfilled, (state, action: PayloadAction<HRLeaveRequestResponse[]>) => {
				state.myLeaveRequestsLoading = false;
				state.myLeaveRequests = action.payload;
			})
			.addCase(fetchMyLeaveRequests.rejected, (state, action) => {
				state.myLeaveRequestsLoading = false;
				state.myLeaveRequestsError = action.payload as string;
			})
			.addCase(createLeaveRequest.fulfilled, (state, action: PayloadAction<HRLeaveRequestResponse>) => {
				state.myLeaveRequests.unshift(action.payload);
			})
			.addCase(fetchPendingLeaveRequests.pending, (state) => {
				state.pendingLeaveRequestsLoading = true;
			})
			.addCase(fetchPendingLeaveRequests.fulfilled, (state, action: PayloadAction<HRLeaveRequestResponse[]>) => {
				state.pendingLeaveRequestsLoading = false;
				state.pendingLeaveRequests = action.payload;
			})
			.addCase(fetchPendingLeaveRequests.rejected, (state) => {
				state.pendingLeaveRequestsLoading = false;
			})
			.addCase(approveRejectLeaveRequest.fulfilled, (state, action: PayloadAction<HRLeaveRequestResponse>) => {
				state.pendingLeaveRequests = state.pendingLeaveRequests.filter((r) => r.public_id !== action.payload.public_id);
				const idx = state.myLeaveRequests.findIndex((r) => r.public_id === action.payload.public_id);
				if (idx !== -1) state.myLeaveRequests[idx] = action.payload;
			})
			.addCase(cancelLeaveRequest.fulfilled, (state, action: PayloadAction<HRLeaveRequestResponse>) => {
				const idx = state.myLeaveRequests.findIndex((r) => r.public_id === action.payload.public_id);
				if (idx !== -1) state.myLeaveRequests[idx] = action.payload;
			})

			// --- Payroll Components ---
			.addCase(fetchPayrollComponents.pending, (state) => {
				state.payrollComponentsLoading = true;
				state.payrollComponentsError = null;
			})
			.addCase(fetchPayrollComponents.fulfilled, (state, action: PayloadAction<HRSalaryComponent[]>) => {
				state.payrollComponentsLoading = false;
				state.payrollComponents = action.payload;
			})
			.addCase(fetchPayrollComponents.rejected, (state, action) => {
				state.payrollComponentsLoading = false;
				state.payrollComponentsError = action.payload as string;
			})
			.addCase(createPayrollComponent.fulfilled, (state, action: PayloadAction<HRSalaryComponent>) => {
				state.payrollComponents.unshift(action.payload);
			})
			.addCase(updatePayrollComponent.fulfilled, (state, action: PayloadAction<HRSalaryComponent>) => {
				const idx = state.payrollComponents.findIndex((c) => c.id === action.payload.id);
				if (idx !== -1) state.payrollComponents[idx] = action.payload;
			})
			.addCase(deletePayrollComponent.fulfilled, (state, action: PayloadAction<number>) => {
				state.payrollComponents = state.payrollComponents.filter((c) => c.id !== action.payload);
			})

			// --- Salary Structures ---
			.addCase(fetchPayrollStructures.pending, (state) => {
				state.payrollStructuresLoading = true;
				state.payrollStructuresError = null;
			})
			.addCase(fetchPayrollStructures.fulfilled, (state, action: PayloadAction<HRSalaryStructure[]>) => {
				state.payrollStructuresLoading = false;
				state.payrollStructures = action.payload;
			})
			.addCase(fetchPayrollStructures.rejected, (state, action) => {
				state.payrollStructuresLoading = false;
				state.payrollStructuresError = action.payload as string;
			})
			.addCase(createPayrollStructure.fulfilled, (state, action: PayloadAction<HRSalaryStructure>) => {
				state.payrollStructures.unshift(action.payload);
			})
			.addCase(updatePayrollStructure.fulfilled, (state, action: PayloadAction<HRSalaryStructure>) => {
				const idx = state.payrollStructures.findIndex((s) => s.id === action.payload.id);
				if (idx !== -1) state.payrollStructures[idx] = action.payload;
			})
			.addCase(deletePayrollStructure.fulfilled, (state, action: PayloadAction<number>) => {
				state.payrollStructures = state.payrollStructures.filter((s) => s.id !== action.payload);
			})

			// --- Employee Salary Assignment ---
			.addCase(fetchEmployeeSalary.pending, (state) => {
				state.employeeSalaryLoading = true;
			})
			.addCase(fetchEmployeeSalary.fulfilled, (state, action: PayloadAction<HREmployeeSalary | null>) => {
				state.employeeSalaryLoading = false;
				state.employeeSalary = action.payload;
			})
			.addCase(fetchEmployeeSalary.rejected, (state) => {
				state.employeeSalaryLoading = false;
			})
			.addCase(assignEmployeeSalary.fulfilled, (state, action: PayloadAction<HREmployeeSalary>) => {
				state.employeeSalary = action.payload;
			})

			// --- Payroll Runs & Variable Pay ---
			.addCase(fetchPayrollRuns.pending, (state) => {
				state.payrollRunsLoading = true;
				state.payrollRunsError = null;
			})
			.addCase(fetchPayrollRuns.fulfilled, (state, action: PayloadAction<HRPayrollRun[]>) => {
				state.payrollRunsLoading = false;
				state.payrollRuns = action.payload;
			})
			.addCase(fetchPayrollRuns.rejected, (state, action) => {
				state.payrollRunsLoading = false;
				state.payrollRunsError = action.payload as string;
			})
			.addCase(createPayrollRun.fulfilled, (state, action: PayloadAction<HRPayrollRun>) => {
				state.payrollRuns.unshift(action.payload);
			})
			.addCase(calculatePayrollRun.fulfilled, (state, action: PayloadAction<HRPayrollRun>) => {
				const idx = state.payrollRuns.findIndex((r) => r.id === action.payload.id);
				if (idx !== -1) state.payrollRuns[idx] = action.payload;
			})
			.addCase(finalizePayrollRun.fulfilled, (state, action: PayloadAction<HRPayrollRun>) => {
				const idx = state.payrollRuns.findIndex((r) => r.id === action.payload.id);
				if (idx !== -1) state.payrollRuns[idx] = action.payload;
			})

			// --- Payslips ---
			.addCase(fetchPayslips.pending, (state) => {
				state.payslipsLoading = true;
				state.payslipsError = null;
			})
			.addCase(fetchPayslips.fulfilled, (state, action: PayloadAction<HRPayslip[]>) => {
				state.payslipsLoading = false;
				state.payslips = action.payload;
			})
			.addCase(fetchPayslips.rejected, (state, action) => {
				state.payslipsLoading = false;
				state.payslipsError = action.payload as string;
			})

			// --- Checklist Templates ---
			.addCase(fetchChecklistTemplates.pending, (state) => {
				state.checklistTemplatesLoading = true;
				state.checklistTemplatesError = null;
			})
			.addCase(fetchChecklistTemplates.fulfilled, (state, action: PayloadAction<HRChecklistTemplate[]>) => {
				state.checklistTemplatesLoading = false;
				state.checklistTemplates = action.payload;
			})
			.addCase(fetchChecklistTemplates.rejected, (state, action) => {
				state.checklistTemplatesLoading = false;
				state.checklistTemplatesError = action.payload as string;
			})
			.addCase(createChecklistTemplate.fulfilled, (state, action: PayloadAction<HRChecklistTemplate>) => {
				state.checklistTemplates.unshift(action.payload);
			})
			.addCase(updateChecklistTemplate.fulfilled, (state, action: PayloadAction<HRChecklistTemplate>) => {
				const idx = state.checklistTemplates.findIndex((t) => t.id === action.payload.id);
				if (idx !== -1) state.checklistTemplates[idx] = action.payload;
			})
			.addCase(deleteChecklistTemplate.fulfilled, (state, action: PayloadAction<number>) => {
				state.checklistTemplates = state.checklistTemplates.filter((t) => t.id !== action.payload);
			})

			// --- Checklist Instances ---
			.addCase(fetchChecklistInstances.pending, (state) => {
				state.checklistInstancesLoading = true;
				state.checklistInstancesError = null;
			})
			.addCase(fetchChecklistInstances.fulfilled, (state, action: PayloadAction<HRChecklistInstance[]>) => {
				state.checklistInstancesLoading = false;
				state.checklistInstances = action.payload;
			})
			.addCase(fetchChecklistInstances.rejected, (state, action) => {
				state.checklistInstancesLoading = false;
				state.checklistInstancesError = action.payload as string;
			})
			.addCase(launchChecklistInstance.fulfilled, (state, action: PayloadAction<HRChecklistInstance>) => {
				state.checklistInstances.unshift(action.payload);
			})
			.addCase(toggleChecklistTask.fulfilled, (state, action: PayloadAction<HRChecklistInstance>) => {
				const idx = state.checklistInstances.findIndex((i) => i.id === action.payload.id);
				if (idx !== -1) {
					// The toggle response doesn't carry the display-only fields joined in list()
					// (employee_name/template_name/checklist_type) -- keep them from the prior row.
					state.checklistInstances[idx] = { ...state.checklistInstances[idx], ...action.payload };
				}
			})

			// --- Employee Documents ---
			.addCase(fetchDocuments.pending, (state) => {
				state.documentsLoading = true;
				state.documentsError = null;
			})
			.addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<HREmployeeDocument[]>) => {
				state.documentsLoading = false;
				state.documents = action.payload;
			})
			.addCase(fetchDocuments.rejected, (state, action) => {
				state.documentsLoading = false;
				state.documentsError = action.payload as string;
			})
			.addCase(uploadDocument.fulfilled, (state, action: PayloadAction<HREmployeeDocument>) => {
				state.documents.unshift(action.payload);
			})
			.addCase(verifyDocument.fulfilled, (state, action: PayloadAction<HREmployeeDocument>) => {
				const idx = state.documents.findIndex((d) => d.id === action.payload.id);
				if (idx !== -1) state.documents[idx] = action.payload;
			})
			.addCase(deleteDocument.fulfilled, (state, action: PayloadAction<number>) => {
				state.documents = state.documents.filter((d) => d.id !== action.payload);
			})

			// --- Analytics & Reports ---
			.addCase(fetchHeadcountReport.fulfilled, (state, action: PayloadAction<HeadcountReport>) => {
				state.headcountReport = action.payload;
			})
			.addCase(fetchAttritionReport.fulfilled, (state, action: PayloadAction<AttritionReport>) => {
				state.attritionReport = action.payload;
			})
			.addCase(fetchLeaveSummaryReport.fulfilled, (state, action: PayloadAction<LeaveSummaryReport>) => {
				state.leaveSummaryReport = action.payload;
			})
			.addCase(fetchPayrollCostReport.fulfilled, (state, action: PayloadAction<PayrollCostReport>) => {
				state.payrollCostReport = action.payload;
			})
			.addCase(fetchAllHRAnalytics.pending, (state) => {
				state.analyticsLoading = true;
				state.analyticsError = null;
			})
			.addCase(fetchAllHRAnalytics.fulfilled, (state, action) => {
				state.analyticsLoading = false;
				state.headcountReport = action.payload.headcount;
				state.attritionReport = action.payload.attrition;
				state.leaveSummaryReport = action.payload.leaves;
				state.payrollCostReport = action.payload.payroll;
			})
			.addCase(fetchAllHRAnalytics.rejected, (state, action) => {
				state.analyticsLoading = false;
				state.analyticsError = action.payload as string;
			})

			// --- Generic mutation loading/error for actions not covered above ---
			.addMatcher(
				(action) =>
					action.type.startsWith('hr/') &&
					action.type.endsWith('/pending') &&
					(action.type.includes('create') || action.type.includes('update') ||
						action.type.includes('delete') || action.type.includes('assign') ||
						action.type.includes('calculate') || action.type.includes('finalize') ||
						action.type.includes('launch') || action.type.includes('toggle') ||
						action.type.includes('approveReject') || action.type.includes('cancel') ||
						action.type.includes('upload') || action.type.includes('verify')),
				(state) => {
					state.actionLoading = true;
					state.actionError = null;
				}
			)
			.addMatcher(
				(action) =>
					action.type.startsWith('hr/') &&
					(action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) &&
					(action.type.includes('create') || action.type.includes('update') ||
						action.type.includes('delete') || action.type.includes('assign') ||
						action.type.includes('calculate') || action.type.includes('finalize') ||
						action.type.includes('launch') || action.type.includes('toggle') ||
						action.type.includes('approveReject') || action.type.includes('cancel') ||
						action.type.includes('upload') || action.type.includes('verify')),
				(state, action: any) => {
					state.actionLoading = false;
					if (action.type.endsWith('/rejected')) {
						state.actionError = action.payload as string;
					}
				}
			);
	}
});

export const { clearHRErrors, clearCurrentEmployee } = hrSlice.actions;
export default hrSlice.reducer;
