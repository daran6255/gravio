import React from 'react';
import { Box, Stack, Typography, IconButton, Chip, Tooltip, useTheme, alpha } from '@mui/material';
import {
	CloseOutlined,
	AutoAwesome,
	ArrowBackRounded,
	AddCircleOutlineRounded,
	HistoryRounded,
	OpenInFullRounded,
	CloseFullscreenRounded,
} from '@mui/icons-material';

const BRAND = '#8B7CF6';

interface IrisPanelHeaderProps {
	/** e.g. a task title, "Leave assistant", "Timesheet assistant" -- shown under "IRIS". */
	subtitle: string;
	onClose: () => void;
	/** When true, renders the back-arrow + "Conversations" title state instead of the IRIS
	 * mark + subtitle -- the session-history view. */
	showSessions?: boolean;
	onBack?: () => void;
	/** Provide both to render the grouped new-chat/history icon pill (hidden while
	 * `showSessions` is true, matching ChatDrawer). */
	onNewChat?: () => void;
	onShowHistory?: () => void;
	/** Provide both to render the widen/narrow panel toggle. */
	expanded?: boolean;
	onExpandToggle?: () => void;
}

/** Shared header for every IRIS chat surface -- the global ChatDrawer and every per-module
 * "Ask IRIS" panel (Projects, Timesheets, Leave, Meetings) -- so a header tweak lands in one
 * place instead of drifting across independent copies. Covers both the normal "chat" header
 * (IRIS mark, "AI co-worker" chip, new-chat/history/expand actions) and the session-history
 * header (back arrow + "Conversations" title) ChatDrawer already had inline. */
export const IrisPanelHeader: React.FC<IrisPanelHeaderProps> = ({
	subtitle,
	onClose,
	showSessions = false,
	onBack,
	onNewChat,
	onShowHistory,
	expanded,
	onExpandToggle,
}) => {
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
					{showSessions ? (
						<IconButton size="small" onClick={onBack} sx={{ bgcolor: 'action.hover' }}>
							<ArrowBackRounded fontSize="small" />
						</IconButton>
					) : (
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
					)}
					<Box sx={{ minWidth: 0 }}>
						<Stack direction="row" alignItems="center" spacing={0.9}>
							<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '1.05rem' }}>
								{showSessions ? 'Conversations' : 'IRIS'}
							</Typography>
							{!showSessions && (
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
							)}
						</Stack>
						{!showSessions && (
							<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }} noWrap>
								{subtitle}
							</Typography>
						)}
					</Box>
				</Stack>

				<Stack direction="row" alignItems="center" spacing={0.75}>
					{!showSessions && onNewChat && onShowHistory && (
						<>
							<Stack
								direction="row"
								alignItems="center"
								sx={{
									border: '1px solid',
									borderColor: 'divider',
									borderRadius: '10px',
									bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
									p: 0.25,
								}}
							>
								<Tooltip title="New chat">
									<IconButton size="small" onClick={onNewChat}>
										<AddCircleOutlineRounded fontSize="small" />
									</IconButton>
								</Tooltip>
								<Box sx={{ width: '1px', height: 16, bgcolor: 'divider' }} />
								<Tooltip title="Past conversations">
									<IconButton size="small" onClick={onShowHistory}>
										<HistoryRounded fontSize="small" />
									</IconButton>
								</Tooltip>
							</Stack>
							{onExpandToggle && (
								<Tooltip title={expanded ? 'Narrow panel' : 'Widen panel'}>
									<IconButton size="small" onClick={onExpandToggle} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
										{expanded ? <CloseFullscreenRounded sx={{ fontSize: 16 }} /> : <OpenInFullRounded sx={{ fontSize: 16 }} />}
									</IconButton>
								</Tooltip>
							)}
						</>
					)}
					<IconButton size="small" onClick={onClose}>
						<CloseOutlined fontSize="small" />
					</IconButton>
				</Stack>
			</Stack>
		</Box>
	);
};

export default IrisPanelHeader;
