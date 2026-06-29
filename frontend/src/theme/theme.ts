import { createTheme, type Theme } from '@mui/material/styles';
import './smoothScroll';

declare module '@mui/material/styles' {
	interface TypographyVariants {
		awsSectionTitle: React.CSSProperties;
		awsFieldLabel: React.CSSProperties;
		navLogo: React.CSSProperties;
		sidebarItem: React.CSSProperties;
		sidebarActive: React.CSSProperties;
	}
	interface TypographyVariantsOptions {
		awsSectionTitle?: React.CSSProperties;
		awsFieldLabel?: React.CSSProperties;
		navLogo?: React.CSSProperties;
		sidebarItem?: React.CSSProperties;
		sidebarActive?: React.CSSProperties;
	}
	interface Palette {
		accent: Palette['primary'];
	}
	interface PaletteOptions {
		accent?: PaletteOptions['primary'];
	}
}

declare module '@mui/material/Typography' {
	interface TypographyPropsVariantOverrides {
		awsSectionTitle: true;
		awsFieldLabel: true;
		navLogo: true;
		sidebarItem: true;
		sidebarActive: true;
	}
}

export const getThemeByMode = (mode: 'light' | 'dark'): Theme => {
	const isDark = mode === 'dark';

	return createTheme({
		palette: {
			mode,
			primary: {
				main: '#8B7CF6', // Logo Purple
				light: '#b2a7ff',
				dark: '#6052d9',
			},
			secondary: {
				main: '#0B0D12', // Logo Dark
				light: isDark ? '#1a1e26' : '#1e293b',
				dark: '#040507',
			},
			background: {
				default: isDark ? '#0B0D12' : '#F4F5F7', // Logo Light Gray / Logo Dark Gray
				paper: isDark ? '#141822' : '#ffffff',
			},
			text: {
				primary: isDark ? '#F4F5F7' : '#1e293b',
				secondary: isDark ? '#94A3B8' : '#64748b',
			},
			divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
			success: {
				main: '#10b981',
			},
			warning: {
				main: '#f59e0b',
			},
			error: {
				main: '#ef4444',
			},
			info: {
				main: '#4EA8FF', // Logo Blue
			},
			accent: {
				main: '#4EA8FF', // Logo Blue
				light: '#85c3ff',
				dark: '#157cd4',
			}
		},
		typography: {
			fontFamily: '"Inter", "Inter UI", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
			h4: {
				fontWeight: 700,
				letterSpacing: '-0.02em',
				fontSize: '1.75rem',
			},
			h5: {
				fontWeight: 600,
				letterSpacing: '-0.01em',
				fontSize: '1.5rem',
			},
			h6: {
				fontWeight: 500,
				fontSize: '1.125rem',
			},
			button: {
				textTransform: 'none',
				fontWeight: 600,
			},
			body1: {
				fontSize: '0.9375rem',
				lineHeight: 1.6,
			},
			body2: {
				fontSize: '0.875rem',
				lineHeight: 1.57,
			},
			awsSectionTitle: {
				fontWeight: 700,
				fontSize: '0.9rem',
				color: isDark ? '#F4F5F7' : '#1e293b',
				textTransform: 'uppercase',
				letterSpacing: '0.05em',
				display: 'block'
			},
			awsFieldLabel: {
				fontSize: '0.875rem',
				marginBottom: '8px',
				color: isDark ? '#cbd5e1' : '#334155',
				fontWeight: 600,
				display: 'block'
			},
			navLogo: {
				fontSize: '1.1rem',
				fontWeight: 800,
				letterSpacing: '-0.5px'
			},
			sidebarItem: {
				fontSize: '0.85rem',
				fontWeight: 500
			},
			sidebarActive: {
				fontSize: '0.85rem',
				fontWeight: 800
			}
		},
		spacing: 8,
		shape: {
			borderRadius: 2, // Sharp enterprise corners
		},
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						borderRadius: 6,
						padding: '8px 16px',
						boxShadow: 'none',
						'&:hover': {
							boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
						}
					},
					containedPrimary: {
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						'&:hover': {
							backgroundColor: '#6052d9',
						}
					}
				},
				defaultProps: {
					disableElevation: false,
				}
			},
			MuiAppBar: {
				defaultProps: {
					elevation: 0,
				},
				styleOverrides: {
					root: {
						borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
					}
				}
			},
			MuiChip: {
				styleOverrides: {
					root: {
						borderRadius: 4,
						fontWeight: 600,
						fontSize: '0.75rem',
						height: '24px',
					},
					outlined: {
						borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
						backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
					}
				}
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundImage: 'none',
					},
					elevation1: {
						boxShadow: isDark
							? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)'
							: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
					}
				}
			},
			MuiDrawer: {
				styleOverrides: {
					paper: {
						backgroundColor: '#0B0D12',
						borderRight: '1px solid #000000',
						color: '#f2f3f3',
					}
				}
			},
			MuiCssBaseline: {
				styleOverrides: {
					html: {
						scrollbarColor: isDark ? "#4a5568 transparent" : "#d5dbdb transparent",
						scrollbarWidth: 'thin',
						"&::-webkit-scrollbar": {
							width: '4px',
							height: '4px',
						},
						"&::-webkit-scrollbar-track": {
							background: 'transparent',
						},
						"&::-webkit-scrollbar-thumb": {
							background: isDark ? "#4a5568" : "#d5dbdb",
							borderRadius: '10px',
						},
						"&::-webkit-scrollbar-thumb:hover": {
							background: isDark ? "#718096" : "#aab7b7",
						},
					},
					body: {
						"&, & *": {
							scrollbarColor: isDark ? "#4a5568 transparent" : "#d5dbdb transparent",
							scrollbarWidth: 'thin',
						},
						"&::-webkit-scrollbar, & *::-webkit-scrollbar": {
							width: '4px',
							height: '4px',
						},
						"&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
							background: 'transparent',
						},
						"&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
							background: isDark ? "#4a5568" : "#d5dbdb",
							borderRadius: '10px',
						},
						"&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
							background: isDark ? "#718096" : "#aab7b7",
						},
					},
				},
			},
		},
	});
};

// Central AWS style templates
export const awsStyles = {
	sectionTitle: {
		fontWeight: 700 as const,
		fontSize: '0.9rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		display: 'block'
	},
	awsPanel: {
		border: '1px solid',
		borderColor: 'divider',
		borderRadius: '2px',
		p: 3,
		bgcolor: 'background.paper',
		boxShadow: '0 1px 1px 0 rgba(0,28,36,0.1)'
	},
	fieldLabel: {
		fontSize: '0.875rem',
		marginBottom: '8px',
		fontWeight: 600 as const,
		display: 'block'
	},
	helperBox: {
		bgcolor: 'rgba(0, 126, 185, 0.05)',
		border: '1px solid',
		borderColor: 'info.main',
		borderRadius: '2px',
		p: 1.5,
		display: 'flex',
		alignItems: 'flex-start',
		gap: 1.5,
		mb: 3
	}
};

// Default theme instance for backward compatibility (defaults to dark mode)
const defaultTheme = getThemeByMode('dark');

export default defaultTheme;
