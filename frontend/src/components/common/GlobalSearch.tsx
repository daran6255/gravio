import React, { useState, useRef, useEffect } from 'react';
import {
	Box,
	InputBase,
	Paper,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	ListItemIcon,
	Typography,
	alpha,
	useTheme,
	styled,
	CircularProgress,
	useMediaQuery
} from '@mui/material';
import {
	Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSearchActions } from '../../hooks/useSearchActions';
import type { SearchAction } from '../../hooks/useSearchActions';

const SearchContainer = styled('div')(({ theme }) => ({
	position: 'relative',
	borderRadius: 5, // Rounded pill shape as in mockup
	backgroundColor: theme.palette.mode === 'light' ? '#f3f4f6' : '#1e293b',
	border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
	'&:hover': {
		backgroundColor: theme.palette.mode === 'light' ? '#e5e7eb' : '#334155',
		borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
	},
	'&:focus-within': {
		backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#0B0D12',
		borderColor: theme.palette.primary.main,
		boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
		'& .MuiInputBase-input': {
			color: theme.palette.text.primary,
			'&::placeholder': {
				color: theme.palette.text.secondary,
			},
		},
		'& .MuiSvgIcon-root': {
			color: theme.palette.text.secondary,
		},
		'& .shortcut-hint': {
			display: 'none',
		}
	},
	marginRight: theme.spacing(2),
	marginLeft: 0,
	width: '100%',
	minWidth: 0, // Ensure search box can shrink inside flex layouts
	maxWidth: '400px',
	transition: 'all 0.2s ease-in-out',
	[theme.breakpoints.up('sm')]: {
		marginLeft: theme.spacing(2),
		width: 'auto',
		minWidth: '200px',
	},
	[theme.breakpoints.up('md')]: {
		marginLeft: theme.spacing(3),
		minWidth: '320px',
	},
	[theme.breakpoints.up('lg')]: {
		minWidth: '400px',
	},
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
	padding: theme.spacing(0, 2),
	height: '100%',
	position: 'absolute',
	pointerEvents: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: theme.palette.mode === 'light' ? '#64748b' : '#94A3B8',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
	color: theme.palette.text.primary,
	width: '100%',
	minWidth: 0, // Enable shrinking inside parent
	'& .MuiInputBase-input': {
		padding: theme.spacing(1, 1, 1, 0),
		paddingLeft: `calc(1em + ${theme.spacing(4)})`,
		transition: theme.transitions.create('width'),
		width: '100%',
		fontSize: theme.typography.body2.fontSize,
		fontWeight: 500,
		'&::placeholder': {
			color: theme.palette.mode === 'light' ? '#64748b' : '#94A3B8',
			opacity: 1,
			fontWeight: 400,
		},
	},
}));

const ShortcutHint = styled('div')(({ theme }) => ({
	position: 'absolute',
	right: '8px',
	top: '50%',
	transform: 'translateY(-50%)',
	padding: '2px 6px',
	borderRadius: 4,
	backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
	border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
	color: theme.palette.mode === 'light' ? '#64748b' : '#94A3B8',
	fontSize: '0.7rem',
	fontWeight: 700,
	pointerEvents: 'none',
	display: 'flex',
	alignItems: 'center',
	gap: '2px',
	[theme.breakpoints.down('sm')]: {
		display: 'none',
	},
}));

const GlobalSearch: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const actions = useSearchActions();
	const [query, setQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	const [dynamicResults, setDynamicResults] = useState<SearchAction[]>([]);
	const loading = false;

	const navigationResults = query.trim() === ''
		? []
		: actions.filter(action =>
			action.title.toLowerCase().includes(query.toLowerCase()) ||
			action.category.toLowerCase().includes(query.toLowerCase())
		);

	const filteredResults = [...navigationResults, ...dynamicResults];

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (!isOpen) setIsOpen(true);
			setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex(prev => Math.max(prev - 1, 0));
		} else if (e.key === 'Enter') {
			if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
				handleSelect(filteredResults[selectedIndex]);
			}
		} else if (e.key === 'Escape') {
			setIsOpen(false);
			setSelectedIndex(-1);
			inputRef.current?.blur();
		}
	};

	const handleSelect = (action: SearchAction) => {
		navigate(action.path);
		setQuery('');
		setIsOpen(false);
		setSelectedIndex(-1);
		inputRef.current?.blur();
	};

	// Dynamic (cross-entity) search results — currently always empty.
	// There is no backend endpoint for searching users/orgs yet; this is reserved
	// for when one exists, rather than faking results against a non-existent API.
	useEffect(() => {
		setDynamicResults([]);
	}, [query, isOpen]);

	// Focus shortcut Alt+S
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			if (e.altKey && e.key === 's') {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => window.removeEventListener('keydown', handleGlobalKeyDown);
	}, []);

	// Reset scroll for results list
	useEffect(() => {
		if (selectedIndex >= 0 && resultsRef.current) {
			const selectedItem = resultsRef.current.children[1]?.children[selectedIndex] as HTMLElement; // children[1] is the List
			if (selectedItem) {
				selectedItem.scrollIntoView({ block: 'nearest' });
			}
		}
	}, [selectedIndex]);

	// Close results on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (resultsRef.current && !resultsRef.current.contains(e.target as Node) &&
				inputRef.current && !inputRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const resultsId = 'global-search-results';

	return (
		<Box
			sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}
			role="combobox"
			aria-expanded={isOpen && filteredResults.length > 0}
			aria-haspopup="listbox"
			aria-controls={resultsId}
		>
			<SearchContainer>
				<SearchIconWrapper>
					<SearchIcon fontSize="small" />
				</SearchIconWrapper>
				<StyledInputBase
					placeholder={isMobile ? "Search..." : "Search services, features, candidates"}
					inputRef={inputRef}
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
						setSelectedIndex(0);
					}}
					onFocus={() => {
						if (query.trim() !== '') setIsOpen(true);
					}}
					onKeyDown={handleKeyDown}
					endAdornment={loading ? (
						<CircularProgress size={16} sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94A3B8', mr: 2 }} />
					) : null}
					inputProps={{
						'aria-label': 'Search for services, features, candidates or users',
						'aria-autocomplete': 'list',
						'aria-controls': resultsId,
						'aria-activedescendant': selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined,
						autoComplete: 'off'
					}}
				/>
				<ShortcutHint aria-hidden="true" className="shortcut-hint">
					<Typography variant="inherit" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>Alt + S</Typography>
				</ShortcutHint>

				{isOpen && filteredResults.length > 0 && (
					<Paper
						ref={resultsRef}
						id={resultsId}
						role="listbox"
						elevation={4}
						sx={{
							position: 'absolute',
							top: 'calc(100% + 8px)',
							left: 0,
							right: 0,
							maxHeight: '400px',
							overflowY: 'auto',
							zIndex: 1400,
							backgroundColor: 'background.paper',
							borderRadius: 1,
							border: `1px solid ${theme.palette.divider}`,
						}}
					>
						<Box sx={{ px: 2, py: 1, backgroundColor: alpha(theme.palette.secondary.main, 0.04), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
								Results ({filteredResults.length})
							</Typography>
						</Box>
						<List sx={{ py: 0 }}>
							{['General', 'Admin', 'Candidates', 'Projects', 'Training', 'Candidate', 'User', 'Project'].map((cat) => {
								const catResults = filteredResults.filter(r => r.category === cat);
								if (catResults.length === 0) return null;

								return (
									<React.Fragment key={cat}>
										<Box sx={{ px: 2, py: 0.5, backgroundColor: alpha(theme.palette.secondary.main, 0.02), borderBottom: `1px solid ${theme.palette.divider}`, borderTop: cat !== 'General' ? `1px solid ${theme.palette.divider}` : 'none' }}>
											<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.65rem' }}>
												{cat === 'Candidate' || cat === 'User' || cat === 'Job Role' || cat === 'Project' ? `${cat}s` : cat}
											</Typography>
										</Box>
										{catResults.map((action) => {
											const resultIndex = filteredResults.indexOf(action);
											const Icon = action.icon as React.ComponentType<{ sx?: any }>;
											return (
												<ListItem key={action.id} disablePadding role="option" aria-selected={selectedIndex === resultIndex} id={`search-option-${resultIndex}`}>
													<ListItemButton
														selected={selectedIndex === resultIndex}
														onClick={() => handleSelect(action)}
														sx={{
															py: 0.75,
															'&.Mui-selected': {
																backgroundColor: alpha(theme.palette.primary.main, 0.08),
																'&:hover': {
																	backgroundColor: alpha(theme.palette.primary.main, 0.12),
																},
															},
														}}
													>
														<ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}>
															<Icon sx={{ fontSize: '1.2rem' }} />
														</ListItemIcon>
														<ListItemText
															primary={action.title}
															secondary={cat === 'Candidate' || cat === 'User' ? action.id.split('-')[1] : action.category}
															primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500, color: theme.palette.text.primary }}
															secondaryTypographyProps={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}
														/>
													</ListItemButton>
												</ListItem>
											);
										})}
									</React.Fragment>
								);
							})}
						</List>
					</Paper>
				)}
			</SearchContainer>
		</Box>
	);
};

export default GlobalSearch;
