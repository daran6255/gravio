import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import useToast from '../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchAISettings,
  updateAISettings,
  testAIConnection,
  clearAIError,
  clearTestResult,
} from '../../../store/slices/aiSlice';
import { AI_SETTING_KEYS, SECRET_MASK } from '../../../constants/ai';

import AIEngineSectionHeader from './AIEngineSectionHeader';
import EnableToggle from './EnableToggle';
import ProviderGrid from './ProviderGrid';
import ProviderConfig from './ProviderConfig';
import ProviderTips from './ProviderTips';

// ── Helpers ────────────────────────────────────────────────────────────────────

const getKeyName = (provider: string): string | null => {
  switch (provider) {
    case 'gemini':    return AI_SETTING_KEYS.GEMINI_KEY;
    case 'openai':    return AI_SETTING_KEYS.OPENAI_KEY;
    case 'anthropic': return AI_SETTING_KEYS.ANTHROPIC_KEY;
    case 'groq':      return AI_SETTING_KEYS.GROQ_KEY;
    case 'mistral':   return AI_SETTING_KEYS.MISTRAL_KEY;
    case 'together':  return AI_SETTING_KEYS.TOGETHER_KEY;
    case 'cohere':    return AI_SETTING_KEYS.COHERE_KEY;
    default:          return null;
  }
};

// ── Main Orchestrator ──────────────────────────────────────────────────────────

const AIEngineSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { settings: data, loading, saving, testing, error, testResult } =
    useAppSelector((state) => state.ai);

  // ── Local form state ──────────────────────────────────────────────────────────
  const [enabled, setEnabled] = useState(false);
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [modelOverride, setModelOverride] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.1');

  // ── Load ──────────────────────────────────────────────────────────────────────
  const loadSettings = useCallback(() => {
    dispatch(fetchAISettings());
  }, [dispatch]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Sync redux → local form on first load
  useEffect(() => {
    if (data) {
      const settingMap: Record<string, string | null> = {};
      data.settings.forEach(s => { settingMap[s.key] = s.value; });

      setEnabled(settingMap[AI_SETTING_KEYS.ENABLED] === 'true');
      setActiveProvider(data.active_provider || 'gemini');
      setModelOverride(settingMap[AI_SETTING_KEYS.MODEL_OVERRIDE] || '');
      setOllamaUrl(settingMap[AI_SETTING_KEYS.OLLAMA_URL] || 'http://localhost:11434');
      setOllamaModel(settingMap[AI_SETTING_KEYS.OLLAMA_MODEL] || 'llama3.1');
    }
  }, [data]);

  // Error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAIError());
    }
  }, [error, toast, dispatch]);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const payload: Record<string, string> = {
      [AI_SETTING_KEYS.ENABLED]:        enabled ? 'true' : 'false',
      [AI_SETTING_KEYS.PROVIDER]:       activeProvider,
      [AI_SETTING_KEYS.MODEL_OVERRIDE]: modelOverride,
      [AI_SETTING_KEYS.OLLAMA_URL]:     ollamaUrl,
      [AI_SETTING_KEYS.OLLAMA_MODEL]:   ollamaModel,
    };

    // Only include API keys that the user actually typed (not the masked placeholder)
    Object.entries(apiKeys).forEach(([key, val]) => {
      if (val && val !== SECRET_MASK) payload[key] = val;
    });

    const result = await dispatch(updateAISettings(payload));
    if (updateAISettings.fulfilled.match(result)) {
      toast.success('AI Engine settings saved successfully');
      setApiKeys({});
      loadSettings();
    }
  };

  // ── Test Connection ───────────────────────────────────────────────────────────
  const handleTest = async (providerName: string) => {
    dispatch(clearTestResult());
    const keyName = getKeyName(providerName);
    const localKey = keyName ? apiKeys[keyName] : undefined;

    const result = await dispatch(testAIConnection({ provider: providerName, apiKey: localKey }));
    if (testAIConnection.fulfilled.match(result)) {
      const res = result.payload;
      if (res.success) {
        toast.success(`${providerName} connected!`);
      } else {
        toast.error(res.message);
      }
    }
  };

  // ── Derived helper (passed down to children) ──────────────────────────────────
  const isKeySet = (providerName: string): boolean => {
    const keyName = getKeyName(providerName);
    if (!keyName) return true; // Ollama requires no key
    const setting = data?.settings.find(s => s.key === keyName);
    return setting?.is_set === true || (!!apiKeys[keyName] && apiKeys[keyName] !== SECRET_MASK);
  };

  // ── Loading splash ────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Loading AI Engine settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <AIEngineSectionHeader
        loading={loading}
        saving={saving}
        hasData={!!data}
        onSave={handleSave}
      />

      <Stack spacing={4}>
        <EnableToggle enabled={enabled} onChange={setEnabled} />

        <ProviderGrid
          activeProvider={activeProvider}
          isKeySet={isKeySet}
          onSelect={setActiveProvider}
        />

        <ProviderConfig
          activeProvider={activeProvider}
          apiKeys={apiKeys}
          showKeys={showKeys}
          modelOverride={modelOverride}
          ollamaUrl={ollamaUrl}
          ollamaModel={ollamaModel}
          testing={testing}
          loading={loading}
          testResult={testResult}
          isKeySet={isKeySet}
          getKeyName={getKeyName}
          onApiKeyChange={(keyName, value) =>
            setApiKeys(prev => ({ ...prev, [keyName]: value }))
          }
          onToggleKeyVisibility={(keyName) =>
            setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }))
          }
          onModelChange={setModelOverride}
          onOllamaUrlChange={setOllamaUrl}
          onOllamaModelChange={setOllamaModel}
          onTestConnection={handleTest}
        />

        <ProviderTips />
      </Stack>
    </Box>
  );
};

export default AIEngineSection;
