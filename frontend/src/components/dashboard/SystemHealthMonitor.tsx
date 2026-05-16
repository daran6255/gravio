import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import CachedIcon from '@mui/icons-material/Cached';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { healthService } from '../../services/healthService';
import type { SystemMetric } from '../../models/health';

const SystemHealthMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await healthService.checkHealth();
      setMetrics(data.metrics || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching health metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'database':
        return <StorageIcon fontSize="small" />;
      case 'memory usage':
        return <MemoryIcon fontSize="small" />;
      case 'cache layer':
        return <CachedIcon fontSize="small" />;
      default:
        return <HealthAndSafetyIcon fontSize="small" />;
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'operational' ? (
      <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 16 }} />
    ) : (
      <ErrorIcon sx={{ color: '#d32f2f', fontSize: 16 }} />
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        flex: 1,
        border: '1px solid #d5dbdb',
        borderRadius: 0,
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HealthAndSafetyIcon sx={{ color: '#007185' }} fontSize="small" />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 'bold', color: '#232f3e', fontSize: '1rem' }}
        >
          Infrastructure Health
        </Typography>
      </Box>

      {loading && metrics.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ color: '#007185' }} />
        </Box>
      ) : (
        <List sx={{ width: '100%', p: 0 }}>
          {metrics.filter(m => m.name !== 'API Server').map((metric, index) => (
            <React.Fragment key={metric.name}>
              <ListItem
                sx={{
                  px: 0,
                  py: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 'auto', color: '#545b64' }}>
                    {getMetricIcon(metric.name)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#232f3e', fontSize: '0.85rem' }}>
                        {metric.name}
                      </Typography>
                    }
                    secondary={
                      metric.responseTime ? (
                        <Typography variant="caption" sx={{ color: '#545b64', fontSize: '0.7rem' }}>
                          Latency: {metric.responseTime}ms
                        </Typography>
                      ) : metric.uptime ? (
                        <Typography variant="caption" sx={{ color: '#545b64', fontSize: '0.7rem' }}>
                          Utilization: {metric.uptime}%
                        </Typography>
                      ) : null
                    }
                  />
                </Box>
                <Tooltip title={metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getStatusIcon(metric.status)}
                    <Typography variant="caption" sx={{ 
                        color: metric.status === 'operational' ? '#2e7d32' : '#d32f2f',
                        fontWeight: 'bold',
                        fontSize: '0.62rem',
                        textTransform: 'uppercase'
                    }}>
                        {metric.status}
                    </Typography>
                  </Box>
                </Tooltip>
              </ListItem>
              {index < metrics.filter(m => m.name !== 'API Server').length - 1 && <Divider sx={{ borderColor: '#f2f3f3' }} />}
            </React.Fragment>
          ))}
        </List>
      )}

      <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #f2f3f3' }}>
        <Typography variant="caption" sx={{ color: '#545b64', display: 'block', textAlign: 'center', fontSize: '0.65rem' }}>
          Last sync: {lastUpdated.toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SystemHealthMonitor;
