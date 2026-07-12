export type ChecklistType = 'onboarding' | 'offboarding';
export type ChecklistStatus = 'pending' | 'completed';

export type ChecklistExitReason = 'resigned' | 'terminated';

export interface HRChecklistTemplate {
  id: number;
  public_id: string;
  name: string;
  checklist_type: ChecklistType;
  tasks: Array<{
    id: string;
    title: string;
    role_required: string;
    /** Days from launch this task is due by. Undefined/null = no deadline. */
    due_days?: number | null;
  }>;
  is_active: boolean;
  others?: Record<string, any>;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface HRChecklistInstance {
  id: number;
  public_id: string;
  user_id: number;
  employee_name?: string;
  template_id: number;
  template_name?: string;
  checklist_type?: ChecklistType;
  status: ChecklistStatus;
  task_statuses: Record<string, {
    completed: boolean;
    completed_by_id: number | null;
    completed_at: string | null;
    due_date?: string | null;
  }>;
  /** For offboarding instances, set at launch time: drives the employee status assigned on completion. */
  others?: { exit_reason?: ChecklistExitReason } & Record<string, any>;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export type DocumentType =
  | 'PAN Card'
  | 'Aadhaar Card'
  | 'NDA Signoff'
  | 'Offer Letter'
  | 'Degree Certificate'
  | 'Passport/Visa'
  | 'Resume'
  | 'Other Identity Proof';

export interface HREmployeeDocument {
  id: number;
  public_id: string;
  user_id: number;
  employee_name?: string;
  document_type: string;
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  expiry_date?: string | null;
  is_verified: boolean;
  verified_by_id?: number | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  uploaded_by_id?: number | null;
  uploaded_by_name?: string | null;
  others?: Record<string, any>;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface HeadcountReport {
  department_distribution: Record<string, number>;
  designation_distribution: Record<string, number>;
  employment_type_distribution: Record<string, number>;
  total_count: number;
  invited_count: number;
}

export interface AttritionReport {
  timeline: Array<{
    month_year: string;
    joiners: number;
    leavers: number;
    headcount: number;
  }>;
  annual_attrition_rate: number;
}

export interface LeaveSummaryReport {
  leave_type_balances: Array<{
    type: string;
    allocated: number;
    used: number;
    remaining: number;
  }>;
  total_approved_requests: number;
  average_leave_days: number;
}

export interface PayrollCostReport {
  monthly_trend: Array<{
    month_year: string;
    gross_total: number;
    net_total: number;
  }>;
  current_month_cost: number;
}
