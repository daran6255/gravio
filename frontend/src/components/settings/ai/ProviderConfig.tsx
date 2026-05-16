import React from 'react';
import {
  Box, Typography, Paper, Stack, Divider, TextField, Button, Chip,
  CircularProgress, Alert, Fade, IconButton, InputAdornment, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as ErrorIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
  WifiTethering as TestIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { PROVIDER_META } from '../../../constants/ai';

interface TestResult {
  success: boolean;
  message: string;
  model?: string | null;
  latency_ms?: number | null;
}

interface Props {
  activeProvider: string;
  apiKeys: Record<string, string>;
  showKeys: Record<string, boolean>;
  modelOverride: string;
  ollamaUrl: string;
  ollamaModel: string;
  testing: boolean;
  loading: boolean;
  testResult: TestResult | null;
  isKeySet: (provider: string) => boolean;
  getKeyName: (provider: string) => string | null;
  onApiKeyChange: (keyName: string, value: string) => void;
  onToggleKeyVisibility: (keyName: string) => void;
  onModelChange: (model: string) => void;
  onOllamaUrlChange: (url: string) => void;
  onOllamaModelChange: (model: string) => void;
  onTestConnection: (provider: string) => void;
}

const ProviderConfig: React.FC<Props> = ({
  activeProvider,
  apiKeys,
  showKeys,
  modelOverride,
  ollamaUrl,
  ollamaModel,
  testing,
  loading,
  testResult,
  isKeySet,
  getKeyName,
  onApiKeyChange,
  onToggleKeyVisibility,
  onModelChange,
  onOllamaUrlChange,
  onOllamaModelChange,
  onTestConnection,
}) => {
  const meta = PROVIDER_META[activeProvider] || PROVIDER_META.gemini;
  const activeKeyName = getKeyName(activeProvider);

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, border: `1px solid ${meta.borderColor}`, borderRadius: '10px', bgcolor: '#fff' }}
    >
      {/* Config Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ color: meta.color }}>{meta.icon}</Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            {meta.label} Configuration
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Get your API key from{' '}
            <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: meta.color }}>
              {meta.docsUrl}
            </a>
          </Typography>
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* Ollama-specific inputs */}
        {activeProvider === 'ollama' ? (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Ollama Server URL"
              value={ollamaUrl}
              onChange={e => onOllamaUrlChange(e.target.value)}
              placeholder="http://localhost:11434"
              helperText="The URL where your Ollama server is running"
              id="ollama-url-input"
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
            <TextField
              fullWidth
              label="Model Name"
              value={ollamaModel}
              onChange={e => onOllamaModelChange(e.target.value)}
              placeholder="llama3.1"
              id="ollama-model-input"
              sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
            />
          </Stack>
        ) : (
          <>
            {/* API Key Input */}
            {activeKeyName && (
              <TextField
                fullWidth
                label={`${meta.label} API Key`}
                type={showKeys[activeKeyName] ? 'text' : 'password'}
                value={apiKeys[activeKeyName] || ''}
                onChange={e => onApiKeyChange(activeKeyName, e.target.value)}
                placeholder={
                  isKeySet(activeProvider)
                    ? '•••••••• (key saved — enter new value to update)'
                    : meta.keyPlaceholder
                }
                id={`api-key-input-${activeProvider}`}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => onToggleKeyVisibility(activeKeyName)}
                        size="small"
                        id={`toggle-key-visibility-${activeProvider}`}
                      >
                        {showKeys[activeKeyName] ? (
                          <HideIcon fontSize="small" />
                        ) : (
                          <ShowIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{ autoComplete: 'new-password' }}
                sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
                helperText={
                  isKeySet(activeProvider)
                    ? '✓ API key is configured. Leave blank to keep the current key.'
                    : 'Your key is stored securely in the database and never exposed in the UI.'
                }
              />
            )}

            {/* Model Selector */}
            <FormControl fullWidth>
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                value={modelOverride || meta.models[0]}
                label="Model"
                onChange={e => onModelChange(e.target.value)}
                id={`model-select-${activeProvider}`}
                sx={{ borderRadius: '8px' }}
              >
                {meta.models.map(m => (
                  <MenuItem key={m} value={m}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{m}</Typography>
                      {m === meta.models[0] && (
                        <Chip
                          label="Recommended"
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem', bgcolor: meta.bgColor, color: meta.color }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem value="">
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Use default model
                  </Typography>
                </MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {/* Test Connection Row */}
        <Divider />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Test Connection
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Verify your configuration with a quick API ping
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={testing ? <CircularProgress size={14} /> : <TestIcon />}
            onClick={() => onTestConnection(activeProvider)}
            disabled={testing || loading}
            id={`test-connection-btn-${activeProvider}`}
            sx={{
              borderColor: meta.borderColor,
              color: meta.color,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: meta.color, bgcolor: meta.bgColor },
            }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </Box>

        {/* Test Result Banner */}
        {testResult && (
          <Fade in>
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              icon={testResult.success ? <CheckIcon /> : <ErrorIcon />}
              sx={{ borderRadius: '8px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {testResult.message}
                  </Typography>
                  {testResult.success && testResult.model && (
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Model: {testResult.model}
                    </Typography>
                  )}
                </Box>
                {testResult.latency_ms && (
                  <Chip
                    icon={<SpeedIcon />}
                    label={`${testResult.latency_ms}ms`}
                    size="small"
                    sx={{ bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                  />
                )}
              </Box>
            </Alert>
          </Fade>
        )}
      </Stack>
    </Paper>
  );
};

export default ProviderConfig;
