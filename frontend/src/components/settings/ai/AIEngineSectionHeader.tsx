import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { SmartToy as AIIcon, Save as SaveIcon } from '@mui/icons-material';

interface Props {
  loading: boolean;
  saving: boolean;
  hasData: boolean;
  onSave: () => void;
}

const AIEngineSectionHeader: React.FC<Props> = ({ loading, saving, hasData, onSave }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      mb: 4,
      pb: 3,
      borderBottom: '1px solid #f2f3f3',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          bgcolor: '#f1f0ff',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AIIcon sx={{ color: '#6366f1', fontSize: 22 }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1c21' }}>
          AI Engine
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Connect an LLM provider to enable intelligent automation
        </Typography>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', gap: 2 }}>
      {loading && hasData && <CircularProgress size={20} sx={{ mt: 1 }} />}
      <Button
        variant="contained"
        disableElevation
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        onClick={onSave}
        disabled={saving || loading}
        id="ai-settings-save-btn"
        sx={{
          bgcolor: '#6366f1',
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          '&:hover': { bgcolor: '#4f46e5' },
        }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </Box>
  </Box>
);

export default AIEngineSectionHeader;
