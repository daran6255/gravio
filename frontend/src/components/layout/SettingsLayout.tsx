import React from 'react';
import {
	Box,
	Typography,
	Button,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { SettingsProvider, useSettingsContext } from '../../context/SettingsContext';
import { ProfileTab, PreferencesTab, SecurityTab, NotificationsTab } from '../settings';

/**
 * Inner layout that has access to SettingsContext for the unsaved-changes bar.
 * Renders ALL settings sections on a single scrollable page.
 */
const SettingsLayoutInner: React.FC = () => {
	const theme = useTheme();
	const { hasChanges, unsavedCount, handleSave, handleDiscard, saving } = useSettingsContext();

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
					bgcolor: theme.palette.background.default,
				}}
			>
				{/* Scrollable content — all sections stacked */}
				<Box
					id="settings-scroll-container"
					sx={{
						flexGrow: 1,
						px: { xs: 1.5, sm: 3, md: 5 },
						py: { xs: 2, sm: 4 },
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
							left: { xs: 0, md: theme.layout.drawerWidth },
							right: 0,
							px: { xs: 2, sm: 4 },
							py: 1.5,
							flexWrap: 'wrap',
							gap: 1,
							bgcolor: theme.layout.unsavedBar.background,
							borderTop: `1px solid ${theme.palette.divider}`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							zIndex: theme.zIndex.appBar,
						}}
					>
						<Typography
							variant="body2"
							sx={{
								color: theme.layout.unsavedBar.text,
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
									color: theme.layout.unsavedBar.text,
									fontWeight: 600,
									fontSize: '0.85rem',
									'&:hover': { color: theme.layout.unsavedBar.textHover, bgcolor: theme.layout.unsavedBar.hoverBg },
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
									borderRadius: theme.layout.radius.button,
									px: 3,
									background: theme.gradients.brandDiagonal,
									boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
									'&:hover': {
										background: theme.gradients.brandDiagonalHover,
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
