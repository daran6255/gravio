import { forwardRef, useCallback } from 'react';
import { SnackbarContent, useSnackbar, type CustomContentProps } from 'notistack';
import { Box, IconButton, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CheckCircleOutline as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  WarningAmberOutlined as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const StyledSnackbarContent = styled(SnackbarContent)(() => ({
  backgroundColor: 'transparent !important',
  boxShadow: 'none !important',
  padding: '0 !important',
  minWidth: 'auto !important',
  maxWidth: 'none !important',
  display: 'flex',
  justifyContent: 'center',
}));

interface CustomToastProps extends CustomContentProps {
  variant: 'success' | 'error' | 'warning' | 'info';
}

const CustomToast = forwardRef<HTMLDivElement, CustomToastProps>(
  ({ 
    id, 
    message, 
    variant, 
    anchorOrigin, 
    persist, 
    autoHideDuration, 
    hideIconVariant, 
    iconVariant,
    style,
    className,
    ...other 
  }, ref) => {
    const theme = useTheme();
    const { closeSnackbar } = useSnackbar();

    const handleClose = useCallback(() => {
      closeSnackbar(id);
    }, [closeSnackbar, id]);

    // Define styling configurations for each variant
    const config = {
      success: {
        color: theme.palette.success.main, // #10b981
        Icon: CheckCircleIcon,
      },
      error: {
        color: theme.palette.error.main, // #ef4444
        Icon: ErrorIcon,
      },
      warning: {
        color: theme.palette.warning.main, // #f59e0b
        Icon: WarningIcon,
      },
      info: {
        color: theme.palette.info.main, // #4EA8FF
        Icon: InfoIcon,
      },
    }[variant] || {
      color: theme.palette.info.main,
      Icon: InfoIcon,
    };

    const { color, Icon } = config;

    return (
      <StyledSnackbarContent ref={ref} role="alert" style={style} className={className} {...other}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 320,
            maxWidth: 480,
            backgroundColor: theme.palette.background.paper,
            borderRadius: '4px',
            borderLeft: `4px solid ${color}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)'
              : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            padding: '12px 16px',
            gap: '12px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', color: color }}>
            <Icon sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{
              flexGrow: 1,
              fontWeight: 500,
              color: theme.palette.text.primary,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {message}
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: theme.palette.text.secondary,
              padding: '4px',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Paper>
      </StyledSnackbarContent>
    );
  }
);

CustomToast.displayName = 'CustomToast';

export const CustomSuccessToast = forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => (
  <CustomToast {...props} ref={ref} variant="success" />
));
CustomSuccessToast.displayName = 'CustomSuccessToast';

export const CustomErrorToast = forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => (
  <CustomToast {...props} ref={ref} variant="error" />
));
CustomErrorToast.displayName = 'CustomErrorToast';

export const CustomWarningToast = forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => (
  <CustomToast {...props} ref={ref} variant="warning" />
));
CustomWarningToast.displayName = 'CustomWarningToast';

export const CustomInfoToast = forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => (
  <CustomToast {...props} ref={ref} variant="info" />
));
CustomInfoToast.displayName = 'CustomInfoToast';

export default CustomToast;
