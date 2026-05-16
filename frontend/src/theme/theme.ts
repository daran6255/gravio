import { createTheme } from '@mui/material/styles';
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

const theme = createTheme({
	palette: {
		primary: {
			main: '#004de6', // Enterprise Blue
			light: '#4d88ff',
			dark: '#0033cc',
		},
		secondary: {
			main: '#16191f', // Premium Console Dark
			light: '#232f3e',
			dark: '#0f141a',
		},
		background: {
			default: '#f1f5f9', // Slightly cooler background
			paper: '#ffffff',
		},
		text: {
			primary: '#1e293b',
			secondary: '#64748b',
		},
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
			main: '#3b82f6',
		},
		accent: {
			main: '#ec7211', // Enterprise Brand Orange
			light: '#ff8a33',
			dark: '#c15d0e',
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
			color: '#1e293b', // theme.palette.text.primary
			textTransform: 'uppercase',
			letterSpacing: '0.05em',
			display: 'block'
		},
		awsFieldLabel: {
			fontSize: '0.875rem',
			marginBottom: '8px',
			color: '#334155', // theme.palette.text.secondary
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
		borderRadius: 2, // Shaper, more professional enterprise corners
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
					backgroundColor: '#004de6',
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
					borderBottom: '1px solid #e2e8f0',
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
					borderColor: '#e2e8f0',
					backgroundColor: '#f8fafc',
				}
			}
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: 'none',
				},
				elevation1: {
					boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				}
			}
		},
		MuiDrawer: {
			styleOverrides: {
				paper: {
					backgroundColor: '#16191f',
					borderRight: '1px solid #000000',
					color: '#f2f3f3',
				}
			}
		},
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					"&, & *": {
						scrollbarColor: "#d5dbdb transparent",
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
						background: '#d5dbdb',
						borderRadius: '10px',
					},
					"&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
						background: '#aab7b7',
					},
				},
			},
		},
	},
});

// Extend the theme with custom AWS console styles
export const awsStyles = {
	sectionTitle: theme.typography.awsSectionTitle,
	awsPanel: {
		border: '1px solid',
		borderColor: 'divider',
		borderRadius: '2px',
		p: 3,
		bgcolor: 'background.paper',
		boxShadow: '0 1px 1px 0 rgba(0,28,36,0.1)'
	},
	fieldLabel: theme.typography.awsFieldLabel,
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

export default theme;
