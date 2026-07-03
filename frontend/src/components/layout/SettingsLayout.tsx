import React from 'react';
import {
	Box,
	Typography,
	Button,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { SettingsProvider, useSettingsContext } from '../../context/SettingsContext';
import { ProfileTab, PreferencesTab, SecurityTab, NotificationsTab } from '../settings';

/**
 * Inner layout that has access to SettingsContext for the unsaved-changes bar.
 * Renders ALL settings sections on a single scrollable page.
 */
const SettingsLayoutInner: React.FC = () => {
	const theme = useTheme();
	const { hasChanges, unsavedCount, handleSave, handleDiscard, saving } = useSettingsContext();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', flexGrow: 1 }}>
			{/* Main Content Area — ALL sections on one page */}
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					bgcolor: isDark ? '#0e1117' : '#F4F5F7',
				}}
			>
				{/* Scrollable content — all sections stacked */}
				<Box
					id="settings-scroll-container"
					sx={{
						flexGrow: 1,
						px: { xs: 3, sm: 5 },
						py: 4,
						pb: hasChanges ? 10 : 4,
						overflowY: 'auto',
						scrollPaddingTop: '24px',
					}}
				>
					{/* Content column — fills the available width; each tab's own grids
					    add wider breakpoints so the extra room gets used, not just stretched */}
					<Box sx={{ width: '100%' }}>
						{/* Profile Section */}
						<Box id="settings-profile" sx={{ mb: 6, scrollMarginTop: '88px' }}>
							<ProfileTab />
						</Box>

						{/* Preferences Section */}
						<Box id="settings-preferences" sx={{ mb: 6, scrollMarginTop: '88px' }}>
							<PreferencesTab />
						</Box>

						{/* Security Section */}
						<Box id="settings-security" sx={{ mb: 6, scrollMarginTop: '88px' }}>
							<SecurityTab />
						</Box>

						{/* Notifications Section */}
						<Box id="settings-notifications" sx={{ mb: 6, scrollMarginTop: '88px' }}>
							<NotificationsTab />
						</Box>
					</Box>
				</Box>

				{/* Unsaved Changes Bar */}
				{hasChanges && (
					<Box
						sx={{
							position: 'fixed',
							bottom: 0,
							left: 260,
							right: 0,
							px: 4,
							py: 1.5,
							bgcolor: isDark ? '#0B0D12' : '#1e293b',
							borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							zIndex: theme.zIndex.appBar,
						}}
					>
						<Typography
							variant="body2"
							sx={{
								color: '#94A3B8',
								fontStyle: 'italic',
								fontWeight: 500,
							}}
						>
							You have {unsavedCount} unsaved change{unsavedCount !== 1 ? 's' : ''}
						</Typography>
						<Box sx={{ display: 'flex', gap: 1.5 }}>
							<Button
								onClick={handleDiscard}
								sx={{
									textTransform: 'none',
									color: '#94A3B8',
									fontWeight: 600,
									fontSize: '0.85rem',
									'&:hover': { color: '#F4F5F7', bgcolor: 'rgba(255,255,255,0.06)' },
								}}
							>
								Discard
							</Button>
							<Button
								variant="contained"
								onClick={handleSave}
								disabled={saving}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									fontSize: '0.85rem',
									borderRadius: '8px',
									px: 3,
									background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
									boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
									'&:hover': {
										background: 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
									},
								}}
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};

/**
 * Settings layout wrapper — provides SettingsContext to all child sections.
 * Renders as a single page with scroll-to-section navigation.
 */
const SettingsLayout: React.FC = () => {
	return (
		<SettingsProvider>
			<SettingsLayoutInner />
		</SettingsProvider>
	);
};

export default SettingsLayout;
