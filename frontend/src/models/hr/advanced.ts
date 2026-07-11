export type ChecklistType = 'onboarding' | 'offboarding';
export type ChecklistStatus = 'pending' | 'completed';

export interface HRChecklistTemplate {
  id: number;
  public_id: string;
  name: string;
  checklist_type: ChecklistType;
  tasks: Array<{
    id: string;
    title: string;
    role_required: string;
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
  }>;
  others?: Record<string, any>;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface HREmployeeDocument {
  id: number;
  public_id: string;
  user_id: number;
  employee_name?: string;
  document_type: string;
  file_url: string;
  expiry_date?: string | null;
  is_verified: boolean;
  verified_by_id?: number | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
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
