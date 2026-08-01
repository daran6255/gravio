import React from 'react';
import { Box, Stack, Typography, IconButton, Chip, useTheme, alpha } from '@mui/material';
import { CloseOutlined, AutoAwesome } from '@mui/icons-material';

const BRAND = '#8B7CF6';

interface IrisPanelHeaderProps {
	/** e.g. a task title, "Leave assistant", "Timesheet assistant" -- shown under "IRIS". */
	subtitle: string;
	onClose: () => void;
}

/** Shared header for every per-module "Ask IRIS" side panel (Projects, Timesheets, Leave,
 * Meetings) -- factored out of IrisTaskPanel so all four panels get the exact same premium
 * treatment (and future header tweaks land in one place) instead of four independently
 * drifting copies. Matches the global ChatDrawer's header language: a real IRIS mark, a soft
 * brand wash behind the header instead of just a thin top bar, and a refined "AI co-worker"
 * chip. */
export const IrisPanelHeader: React.FC<IrisPanelHeaderProps> = ({ subtitle, onClose }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box
			sx={{
				position: 'relative',
				background: isDark
					? `linear-gradient(180deg, ${alpha(BRAND, 0.16)} 0%, ${alpha(BRAND, 0)} 100%)`
					: `linear-gradient(180deg, ${alpha(BRAND, 0.09)} 0%, ${alpha(BRAND, 0)} 100%)`,
			}}
		>
			<Box sx={{ height: 2.5, background: theme.gradients?.brandDiagonal }} />
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
					<Box
						sx={{
							width: 42,
							height: 42,
							borderRadius: '12px',
							background: theme.gradients?.brandDiagonal,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
							boxShadow: `0 4px 16px -4px ${alpha(BRAND, 0.55)}`,
						}}
					>
						<AutoAwesome sx={{ fontSize: 21, color: '#fff' }} />
					</Box>
					<Box sx={{ minWidth: 0 }}>
						<Stack direction="row" alignItems="center" spacing={0.9}>
							<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '1.05rem' }}>IRIS</Typography>
							<Chip
								label="AI co-worker"
								size="small"
								sx={{
									height: 19,
									fontSize: '0.62rem',
									fontWeight: 700,
									bgcolor: alpha(BRAND, 0.12),
									color: isDark ? '#C9BFFF' : '#6B54E8',
									border: '1px solid',
									borderColor: alpha(BRAND, 0.3),
									'& .MuiChip-label': { px: 0.85 },
								}}
							/>
						</Stack>
						<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }} noWrap>
							{subtitle}
						</Typography>
					</Box>
				</Stack>
				<IconButton size="small" onClick={onClose}>
					<CloseOutlined fontSize="small" />
				</IconButton>
			</Stack>
		</Box>
	);
};

export default IrisPanelHeader;
