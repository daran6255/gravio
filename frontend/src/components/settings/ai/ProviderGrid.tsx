import React from 'react';
import { Box, Typography, Paper, Chip, Tooltip } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { PROVIDER_META } from '../../../constants/ai';

interface Props {
  activeProvider: string;
  isKeySet: (providerName: string) => boolean;
  onSelect: (providerName: string) => void;
}

const ProviderGrid: React.FC<Props> = ({ activeProvider, isKeySet, onSelect }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
      Choose LLM Provider
    </Typography>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 2,
      }}
    >
      {Object.entries(PROVIDER_META).map(([providerName, pm]) => {
        const isActive = activeProvider === providerName;
        const keyConfigured = isKeySet(providerName);

        return (
          <Paper
            key={providerName}
            elevation={0}
            onClick={() => onSelect(providerName)}
            id={`provider-card-${providerName}`}
            sx={{
              p: 2,
              borderRadius: '10px',
              border: '2px solid',
              borderColor: isActive ? pm.borderColor : '#e2e8f0',
              bgcolor: isActive ? pm.bgColor : '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: pm.borderColor,
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              },
            }}
          >
            {isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: pm.borderColor,
                }}
              />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ color: pm.color }}>{pm.icon}</Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {keyConfigured && providerName !== 'ollama' && (
                  <Tooltip title="API key configured">
                    <CheckIcon sx={{ color: '#10a37f', fontSize: 16 }} />
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {pm.label}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Chip
                label={pm.badge}
                size="small"
                sx={{
                  bgcolor: pm.bgColor,
                  color: pm.badgeColor,
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  border: `1px solid ${pm.borderColor}`,
                }}
              />
            </Box>
          </Paper>
        );
      })}
    </Box>
  </Box>
);

export default ProviderGrid;
