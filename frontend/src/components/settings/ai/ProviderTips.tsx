import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';

const TIPS = [
  { label: 'Development / Testing', value: 'Groq (free tier, fastest response)', color: '#7c3aed' },
  { label: 'Production (intelligent tasks)', value: 'Anthropic Claude (best reasoning)', color: '#d97706' },
  { label: 'Cost-optimized production', value: 'Google Gemini Flash (best value)', color: '#1a73e8' },
  { label: 'Privacy / On-premise', value: 'Ollama (runs locally, zero cost)', color: '#374151' },
];

const ProviderTips: React.FC = () => (
  <Paper
    elevation={0}
    sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
      Provider Recommendations
    </Typography>

    <Stack spacing={1}>
      {TIPS.map(item => (
        <Box key={item.label} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: item.color,
              mt: 0.8,
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block' }}>
              {item.label}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {item.value}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  </Paper>
);

export default ProviderTips;
