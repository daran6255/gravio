// HR Payroll Management models

export type SalaryComponentType = 'earning' | 'deduction';
export type SalaryCalculationType = 'flat' | 'formula';
export type PayrollRunStatus = 'draft' | 'processing' | 'finalized';

export const COMPONENT_TYPE_LABELS: Record<SalaryComponentType, string> = {
	earning: 'Earning',
	deduction: 'Deduction',
};

export const RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
	draft: 'Draft',
	processing: 'Processing',
	finalized: 'Finalized',
};

export const RUN_STATUS_COLORS: Record<PayrollRunStatus, 'info' | 'warning' | 'success'> = {
	draft: 'info',
	processing: 'warning',
	finalized: 'success',
};

// ---------------------------------------------------------------------------
// Salary Component Config
// ---------------------------------------------------------------------------

export interface HRSalaryComponent {
	id: number;
	public_id: string;
	name: string;
	code: string;
	component_type: SalaryComponentType;
	is_statutory: boolean;
	is_taxable: boolean;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
}

export interface HRSalaryComponentCreate {
	name: string;
	code: string;
	component_type: SalaryComponentType;
	is_statutory?: boolean;
	is_taxable?: boolean;
	others?: Record<string, unknown> | null;
}

export interface HRSalaryComponentUpdate {
	name?: string;
	code?: string;
	component_type?: SalaryComponentType;
	is_statutory?: boolean;
	is_taxable?: boolean;
	others?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Salary Structure Config
// ---------------------------------------------------------------------------

export interface HRSalaryStructureItem {
	id: number;
	structure_id: number;
	salary_component_id: number;
	calculation_type: SalaryCalculationType;
	value_expr: string;
	others: Record<string, unknown> | null;
	created_at: string;
	component?: HRSalaryComponent;
}

export interface HRSalaryStructureItemCreate {
	salary_component_id: number;
	calculation_type?: SalaryCalculationType;
	value_expr: string;
}

export interface HRSalaryStructure {
	id: number;
	public_id: string;
	name: string;
	description: string | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
	items: HRSalaryStructureItem[];
}

export interface HRSalaryStructureCreate {
	name: string;
	description?: string;
	items: HRSalaryStructureItemCreate[];
}

export interface HRSalaryStructureUpdate {
	name?: string;
	description?: string;
	items?: HRSalaryStructureItemCreate[];
}

// ---------------------------------------------------------------------------
// Employee Salary Allocation
// ---------------------------------------------------------------------------

export interface HREmployeeSalary {
	id: number;
	public_id: string;
	user_id: number;
	employee_name: string | null;
	employee_code: string | null;
	structure_id: number;
	structure_name: string | null;
	ctc: number;
	effective_from: string; // YYYY-MM-DD
	is_active: boolean;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
}

export interface HREmployeeSalaryCreate {
	user_id: number;
	structure_id: number;
	ctc: number;
	effective_from: string;
	is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Payroll Run
// ---------------------------------------------------------------------------

export interface HRPayrollRun {
	id: number;
	public_id: string;
	month: number;
	year: number;
	status: PayrollRunStatus;
	processed_by_id: number | null;
	processed_by_name: string | null;
	processed_at: string | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
}

export interface HRPayrollRunCreate {
	month: number;
	year: number;
}

// ---------------------------------------------------------------------------
// Variable Pay Entry
// ---------------------------------------------------------------------------

export interface HRVariablePayEntry {
	id: number;
	public_id: string;
	user_id: number;
	employee_name: string | null;
	payroll_run_id: number;
	component_code: string;
	amount: number;
	entry_type: SalaryComponentType;
	reason: string | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
}

export interface HRVariablePayEntryCreate {
	user_id: number;
	component_code: string;
	amount: number;
	entry_type: SalaryComponentType;
	reason?: string;
}

// ---------------------------------------------------------------------------
// Payslip
// ---------------------------------------------------------------------------

export interface HRPayslip {
	id: number;
	public_id: string;
	user_id: number;
	employee_id: string | null;
	employee_name: string | null;
	department_name: string | null;
	designation_name: string | null;
	bank_account_number: string | null;
	bank_name: string | null;
	pan_number: string | null;
	payroll_run_id: number;
	month?: number;
	year?: number;
	earnings_breakdown: Record<string, number>;
	deductions_breakdown: Record<string, number>;
	gross_earnings: number;
	total_deductions: number;
	net_pay: number;
	lop_days: number;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
	updated_at: string;
}
