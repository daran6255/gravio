import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  type SelectChangeEvent,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

const REPORTS = {
  sourcing: "https://app.powerbi.com/view?r=eyJrIjoiOTQ5MzU3MTktMzBkZi00ZjYxLTkxYjEtZjFkZmQxYTU3MzU4IiwidCI6ImNkMzY0NTJmLWFjMzQtNDRhNS1iZTMzLThiYWE4MDFhM2ZmZCJ9",
  timesheet: "https://app.powerbi.com/view?r=eyJrIjoiZDI2NDAxZmUtMjBjMy00ZDI5LTgxOTAtYzBjMDMxZWM2N2FjIiwidCI6ImNkMzY0NTJmLWFjMzQtNDRhNS1iZTMzLThiYWE4MDFhM2ZmZCJ9"
} as const;

type ReportType = keyof typeof REPORTS;

const BIReport: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('sourcing');
  const [loading, setLoading] = useState<boolean>(true);

  const handleReportChange = useCallback((event: SelectChangeEvent) => {
    setReportType(event.target.value as ReportType);
    setLoading(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    window.open(REPORTS[reportType], '_blank');
  }, [reportType]);

  return (
    <Paper
      elevation={0}
      component="section"
      aria-labelledby="bi-report-title"
      sx={{
        width: '100%',
        mb: 2,
        borderRadius: 0,
        border: '1px solid #d5dbdb',
        bgcolor: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '500px'
      }}
    >
      {/* Enterprise-style Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #d5dbdb',
          bgcolor: '#fafafa',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon sx={{ color: '#545b64' }} fontSize="small" />
          <Typography
            variant="subtitle1"
            id="bi-report-title"
            component="h2"
            sx={{
              fontWeight: 'bold',
              color: '#232f3e',
              fontSize: '1rem',
            }}
          >
            Business Intelligence
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#ffffff' }}>
            <Select
              value={reportType}
              onChange={handleReportChange}
              inputProps={{ 'aria-label': 'Select Report Type' }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d5dbdb',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#232f3e',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007185',
                },
              }}
            >
              <MenuItem value="sourcing">Sourcing Analytics</MenuItem>
              <MenuItem value="timesheet">Timesheet Report</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Open in Fullscreen">
            <IconButton
              size="small"
              onClick={handleFullscreen}
              sx={{ color: '#545b64' }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content Area with Loading Overlay */}
      <Box sx={{ flexGrow: 1, width: '100%', position: 'relative', bgcolor: '#f2f3f3', minHeight: '450px' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
            }}
          >
            <CircularProgress size={40} sx={{ color: '#007185' }} />
          </Box>
        )}
        <iframe
          title={`${reportType} PowerBI Dashboard`}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: '450px', display: 'block', position: 'absolute', top: 0, left: 0 }}
          src={REPORTS[reportType]}
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      </Box>
    </Paper>
  );
};

export default BIReport;
