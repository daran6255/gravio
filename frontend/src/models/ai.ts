/**
 * AI Engine — Data Models & Interfaces
 * =====================================
 */

export interface AISettingItem {
  key: string;
  value: string | null;
  description: string;
  is_secret: boolean;
  is_set: boolean;
}

export interface AIProviderInfo {
  name: string;
  is_active: boolean;
  configured: boolean;
  model: string;
  key_env_var: string;
}

export interface AISettingsData {
  settings: AISettingItem[];
  active_provider: string;
  providers: AIProviderInfo[];
  supported_providers: string[];
}

export interface AIConnectionTestResult {
  success: boolean;
  provider: string;
  model: string;
  message: string;
  latency_ms: number | null;
}

export interface AITaskLogItem {
  id: number;
  public_id: string;
  task_name: string;
  trigger: string;
  status: string;
  tools_called: number;
  records_affected: number;
  requires_approval: boolean;
  summary: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AITasksResponse {
  items: AITaskLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── AI Chat Interfaces ──────────────────────────────────────────────────────

export interface AIChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  task_log_id: number | null;
  created_at: string;
}

export interface AIChatSession {
  id: number;
  public_id: string;
  user_id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  messages?: AIChatMessage[];
}

export interface AIChatResponse {
  session_id: string;
  reply: AIChatMessage;
  task_id: string | null; // public_id of the AITaskLog
}
