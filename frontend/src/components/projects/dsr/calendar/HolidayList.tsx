import React from 'react';
import {
	Box,
	Typography,
	List,
	ListItem,
	CircularProgress,
	useTheme,
	alpha
} from '@mui/material';
import {
	EventAvailable as HolidayIcon,
	ErrorOutline as MissingIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { type CompanyHoliday } from '../../../../services/holidayService';

interface HolidayListProps {
	holidays: CompanyHoliday[];
	loading: boolean;
}

const HolidayList: React.FC<HolidayListProps> = ({ holidays, loading }) => {
	const theme = useTheme();

	return (
		<Box sx={{ p: 2, bgcolor: 'background.paper', flex: 1 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
				<HolidayIcon sx={{ fontSize: 18, color: 'primary.main' }} />
				<Typography variant="awsFieldLabel" sx={{ mb: 0, color: 'text.primary' }}>
					Holidays this Month
				</Typography>
				{loading && <CircularProgress size={14} sx={{ ml: 'auto' }} />}
			</Box>

			{holidays.length === 0 ? (
				<Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', px: 1, display: 'block' }}>
					No public holidays this month.
				</Typography>
			) : (
				<List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
					{holidays.map((h, i) => (
						<ListItem
							key={i}
							disablePadding
							sx={{
								py: 0.75,
								px: 1.5,
								borderRadius: '6px',
								bgcolor: alpha(theme.palette.background.default, 0.4),
								border: '1px solid',
								borderColor: 'divider',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								'&:hover': {
									bgcolor: alpha(theme.palette.background.default, 0.8),
									borderColor: alpha(theme.palette.primary.main, 0.2)
								}
							}}
						>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', minWidth: '60px' }}>
								{dayjs(h.holiday_date).format('DD MMM')}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textAlign: 'right' }}>
								{h.holiday_name}
							</Typography>
						</ListItem>
					))}
				</List>
			)}

			<Box sx={{ mt: 2, p: 1.5, borderRadius: '6px', bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1), display: 'flex', gap: 1.5, alignItems: 'center' }}>
				<MissingIcon sx={{ fontSize: 16, color: 'info.main' }} />
				<Typography variant="caption" sx={{ color: 'info.dark', fontWeight: 500, fontSize: '0.7rem', lineHeight: 1.3 }}>
					Missing indicators mark past workdays with no submissions.
				</Typography>
			</Box>
		</Box>
	);
};

export default HolidayList;
