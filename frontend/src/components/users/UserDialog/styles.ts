import { alpha } from '@mui/material';
import type { Theme } from '@mui/material';

export const getInputSx = (theme: Theme) => ({
	'& .MuiOutlinedInput-root': {
		borderRadius: '4px',
		bgcolor: alpha(theme.palette.background.paper, 0.8),
		'& fieldset': { borderColor: theme.palette.divider },
		'&:hover fieldset': { borderColor: alpha(theme.palette.text.primary, 0.2) },
		'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px' },
		'& input': { padding: '10.5px 14px' }
	}
});
