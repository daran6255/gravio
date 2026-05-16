import React from 'react';
import {
  Cloud as CloudIcon,
  Token as TokenIcon,
  Security as SecureIcon,
  Bolt as FastIcon,
  Computer as LocalIcon,
} from '@mui/icons-material';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProviderMeta {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  models: string[];
  keyPlaceholder: string;
  docsUrl: string;
}

// ── Setting Keys ─────────────────────────────────────────────────────────────

/**
 * Database keys used in the system_settings table for AI configuration.
 * Must match the backend AI_SETTING_DEFINITIONS exactly.
 */
export const AI_SETTING_KEYS = {
  ENABLED: 'AI_ENABLED',
  PROVIDER: 'AI_PROVIDER',
  MODEL_OVERRIDE: 'AI_MODEL_OVERRIDE',
  GEMINI_KEY: 'GEMINI_API_KEY',
  OPENAI_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_KEY: 'ANTHROPIC_API_KEY',
  GROQ_KEY: 'GROQ_API_KEY',
  MISTRAL_KEY: 'MISTRAL_API_KEY',
  TOGETHER_KEY: 'TOGETHER_API_KEY',
  COHERE_KEY: 'COHERE_API_KEY',
  OLLAMA_URL: 'OLLAMA_BASE_URL',
  OLLAMA_MODEL: 'OLLAMA_MODEL',
};

export const SECRET_MASK = '••••••••';

// ── Status Colors ────────────────────────────────────────────────────────────

export const AI_STATUS_COLORS: Record<string, string> = {
  completed: '#10a37f',
  failed: '#dc2626',
  running: '#f59e0b',
  planning: '#6366f1',
  awaiting_approval: '#d97706',
  partially_completed: '#f59e0b',
  pending: '#64748b',
};

// ── Provider Metadata ────────────────────────────────────────────────────────

export const PROVIDER_META: Record<string, ProviderMeta> = {
  gemini: {
    label: 'Google Gemini',
    color: '#1a73e8',
    bgColor: '#e8f0fe',
    borderColor: '#4285f4',
    icon: React.createElement(CloudIcon),
    badge: 'Best Value',
    badgeColor: '#1a73e8',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://makersuite.google.com/app/apikey',
  },
  openai: {
    label: 'OpenAI (ChatGPT)',
    color: '#10a37f',
    bgColor: '#d4f4ec',
    borderColor: '#10a37f',
    icon: React.createElement(TokenIcon),
    badge: 'Most Popular',
    badgeColor: '#10a37f',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    label: 'Anthropic Claude',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#d97706',
    icon: React.createElement(SecureIcon),
    badge: 'Best Reasoning',
    badgeColor: '#d97706',
    models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  groq: {
    label: 'Groq',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    borderColor: '#7c3aed',
    icon: React.createElement(FastIcon),
    badge: 'Fastest',
    badgeColor: '#7c3aed',
    models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
  },
  mistral: {
    label: 'Mistral AI',
    color: '#e11d48',
    bgColor: '#fce7f3',
    borderColor: '#e11d48',
    icon: React.createElement(CloudIcon),
    badge: 'EU / GDPR',
    badgeColor: '#e11d48',
    models: ['mistral-small-latest', 'mistral-large-latest', 'codestral-latest'],
    keyPlaceholder: 'Paste your Mistral key...',
    docsUrl: 'https://console.mistral.ai/api-keys/',
  },
  together: {
    label: 'Together AI',
    color: '#0891b2',
    bgColor: '#cffafe',
    borderColor: '#0891b2',
    icon: React.createElement(CloudIcon),
    badge: 'Open Source',
    badgeColor: '#0891b2',
    models: ['meta-llama/Llama-3.1-8B-Instruct-Turbo', 'meta-llama/Llama-3.1-70B-Instruct-Turbo'],
    keyPlaceholder: 'Paste your Together AI key...',
    docsUrl: 'https://api.together.ai/settings/api-keys',
  },
  cohere: {
    label: 'Cohere',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#059669',
    icon: React.createElement(TokenIcon),
    badge: 'Enterprise',
    badgeColor: '#059669',
    models: ['command-r', 'command-r-plus'],
    keyPlaceholder: 'Paste your Cohere key...',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },
  ollama: {
    label: 'Ollama (Local)',
    color: '#374151',
    bgColor: '#f3f4f6',
    borderColor: '#6b7280',
    icon: React.createElement(LocalIcon),
    badge: 'Free / Private',
    badgeColor: '#374151',
    models: ['llama3.1', 'mistral', 'phi3', 'gemma2', 'qwen2'],
    keyPlaceholder: 'http://localhost:11434',
    docsUrl: 'https://ollama.com',
  },
};
