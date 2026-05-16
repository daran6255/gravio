import React from 'react';
import { Box, Typography, Paper, Switch, FormControlLabel, Alert, Fade } from '@mui/material';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const EnableToggle: React.FC<Props> = ({ enabled, onChange }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      border: '1px solid',
      borderColor: enabled ? '#6366f1' : '#e2e8f0',
      borderRadius: '10px',
      bgcolor: enabled ? '#f5f3ff' : '#fff',
      transition: 'all 0.2s',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Enable AI Engine
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          When enabled, the AI engine can automate tasks like creating leads from WhatsApp enquiries,
          parsing JDs, and scheduling interviews.
        </Typography>
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={e => onChange(e.target.checked)}
            id="ai-engine-toggle"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1' },
            }}
          />
        }
        label=""
        sx={{ m: 0 }}
      />
    </Box>

    {enabled && (
      <Fade in>
        <Alert
          severity="info"
          sx={{ mt: 2, borderRadius: '8px', '& .MuiAlert-icon': { color: '#6366f1' } }}
        >
          AI Engine is <strong>active</strong>. Select a provider and enter your API key below.
        </Alert>
      </Fade>
    )}
  </Paper>
);

export default EnableToggle;
