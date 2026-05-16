import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Switch,
	FormControlLabel,
	CircularProgress,
	Divider,
	useTheme,
	Paper,
	Stack
} from '@mui/material';
import {
	Email as EmailIcon,
	Save as SaveIcon,
	Send as TestIcon,
	ShieldOutlined as ShieldIcon,
	DnsOutlined as ServerIcon
} from '@mui/icons-material';
import userEmailConfigService, { type UserEmailConfig } from '../../../services/userEmailConfigService';
import { useSnackbar } from 'notistack';

const EmailConfigurationSection: React.FC = () => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);
	const [config, setConfig] = useState<UserEmailConfig>({
		smtp_server: '',
		smtp_port: 587,
		smtp_username: '',
		smtp_password: '',
		sender_email: '',
		sender_name: '',
		encryption: 'tls',
		is_active: true
	});

	useEffect(() => {
		loadConfig();
	}, []);

	const loadConfig = async () => {
		setLoading(true);
		try {
			const data = await userEmailConfigService.getMyConfig();
			setConfig({
				...data,
				// Password won't be sent back for security (or it's masked)
				// If it's empty, we keep it as is
				smtp_password: ''
			});
		} catch (error: any) {
			if (error.response?.status !== 404) {
				console.error('Failed to load email config:', error);
				enqueueSnackbar('Failed to load email configuration', { variant: 'error' });
			}
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
		const { name, value } = e.target;
		setConfig(prev => ({
			...prev,
			[name as string]: value
		}));
	};

	const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setConfig(prev => ({
			...prev,
			is_active: e.target.checked
		}));
	};

	const handleTest = async () => {
		if (!config.smtp_server || !config.smtp_username || !config.smtp_password) {
			enqueueSnackbar('Please fill in server, username, and password before testing', { variant: 'warning' });
			return;
		}

		setTesting(true);
		try {
			const result = await userEmailConfigService.testConfig(config);
			enqueueSnackbar(result.message, { variant: 'success' });
		} catch (error: any) {
			const msg = error.response?.data?.detail || 'Connection test failed';
			enqueueSnackbar(msg, { variant: 'error' });
		} finally {
			setTesting(false);
		}
	};

	const handleSave = async () => {
		if (!config.smtp_server || !config.smtp_username || !config.sender_email) {
			enqueueSnackbar('Please fill in required fields', { variant: 'warning' });
			return;
		}

		setSaving(true);
		try {
			await userEmailConfigService.saveConfig(config);
			enqueueSnackbar('Configuration saved successfully', { variant: 'success' });
			// Clear password field after save
			setConfig(prev => ({ ...prev, smtp_password: '' }));
		} catch (error: any) {
			enqueueSnackbar('Failed to save configuration', { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
				<CircularProgress size={36} thickness={4} />
				<Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
					Loading configuration...
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				mb: 4,
				pb: 3,
				borderBottom: '1px solid #f2f3f3'
			}}>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1c21', mb: 0.5 }}>
						Personal Email Configuration
					</Typography>
					<Typography variant="body2" sx={{ color: '#64748b' }}>
						Configure your own SMTP service to send emails directly from your business account.
					</Typography>
				</Box>
				<FormControlLabel
					control={
						<Switch
							checked={config.is_active}
							onChange={handleSwitchChange}
							color="primary"
						/>
					}
					label={
						<Typography variant="body2" sx={{ fontWeight: 600, color: config.is_active ? 'primary.main' : '#64748b' }}>
							{config.is_active ? 'Enabled' : 'Disabled'}
						</Typography>
					}
				/>
			</Box>

			<Grid container spacing={4}>
				<Grid size={{ xs: 12, md: 7 }}>
					<Stack spacing={3}>
						<Box>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
								<ServerIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
								<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
									Server Settings
								</Typography>
							</Stack>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 8 }}>
									<TextField
										fullWidth
										label="SMTP Server"
										name="smtp_server"
										value={config.smtp_server}
										onChange={handleChange}
										placeholder="e.g. smtp.gmail.com"
										variant="outlined"
										size="small"
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										fullWidth
										label="Port"
										name="smtp_port"
										type="number"
										value={config.smtp_port}
										onChange={handleChange}
										placeholder="587"
										variant="outlined"
										size="small"
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<FormControl fullWidth size="small">
										<InputLabel>Encryption</InputLabel>
										<Select
											name="encryption"
											value={config.encryption}
											onChange={handleChange as any}
											label="Encryption"
										>
											<MenuItem value="none">None</MenuItem>
											<MenuItem value="tls">TLS (Recommended)</MenuItem>
											<MenuItem value="ssl">SSL</MenuItem>
										</Select>
									</FormControl>
								</Grid>
							</Grid>
						</Box>

						<Divider />

						<Box>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
								<ShieldIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
								<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
									Authentication
								</Typography>
							</Stack>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Username / Email"
										name="smtp_username"
										value={config.smtp_username}
										onChange={handleChange}
										variant="outlined"
										size="small"
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Password"
										name="smtp_password"
										type="password"
										value={config.smtp_password}
										onChange={handleChange}
										placeholder="••••••••"
										variant="outlined"
										size="small"
										helperText="Leave empty to keep existing password"
									/>
								</Grid>
							</Grid>
						</Box>

						<Divider />

						<Box>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
								<EmailIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
								<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
									Sender Info
								</Typography>
							</Stack>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Sender Email Address"
										name="sender_email"
										value={config.sender_email}
										onChange={handleChange}
										placeholder="your@email.com"
										variant="outlined"
										size="small"
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Sender Name (Display Name)"
										name="sender_name"
										value={config.sender_name}
										onChange={handleChange}
										placeholder="e.g. John Doe | WinVinaya"
										variant="outlined"
										size="small"
									/>
								</Grid>
							</Grid>
						</Box>
					</Stack>
				</Grid>

				<Grid size={{ xs: 12, md: 5 }}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							bgcolor: '#f8fafc',
							borderRadius: '12px',
							border: '1px solid #e2e8f0',
							height: '100%'
						}}
					>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
							Actions
						</Typography>
						<Stack spacing={2}>
							<Button
								fullWidth
								variant="outlined"
								startIcon={testing ? <CircularProgress size={20} /> : <TestIcon />}
								onClick={handleTest}
								disabled={testing || saving}
								sx={{
									py: 1.2,
									borderRadius: '8px',
									textTransform: 'none',
									fontWeight: 600
								}}
							>
								{testing ? 'Testing connection...' : 'Test Connection'}
							</Button>

							<Button
								fullWidth
								variant="contained"
								disableElevation
								startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
								onClick={handleSave}
								disabled={saving || testing}
								sx={{
									py: 1.2,
									borderRadius: '8px',
									textTransform: 'none',
									fontWeight: 600,
									bgcolor: theme.palette.primary.main
								}}
							>
								{saving ? 'Saving...' : 'Save Configuration'}
							</Button>

							<Box sx={{ mt: 2 }}>
								<Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.5, display: 'block' }}>
									<b>Note:</b> For Gmail, you may need to use an "App Password" if 2-factor authentication is enabled.
									Ensure your SMTP provider allows external connections.
								</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>
			</Grid>
		</Box>
	);
};

export default EmailConfigurationSection;
