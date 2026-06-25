import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, TextField, List, ListItemButton, ListItemText, Typography, CircularProgress, InputAdornment } from '@mui/material';
import { Search, Business, Person, TrendingUp, AttachMoney } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { searchCrm, clearSearchResults } from '../../../store/slices/crmSlice';

interface CrmQuickSearchDialogProps {
	open: boolean;
	onClose: () => void;
}

export const CrmQuickSearchDialog: React.FC<CrmQuickSearchDialogProps> = ({ open, onClose }) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { searchResults, searchLoading } = useAppSelector((state) => state.crm);
	const [query, setQuery] = useState('');

	useEffect(() => {
		if (!open) {
			setQuery('');
			dispatch(clearSearchResults());
		}
	}, [open, dispatch]);

	useEffect(() => {
		if (!query.trim()) {
			dispatch(clearSearchResults());
			return;
		}
		const handle = setTimeout(() => dispatch(searchCrm(query.trim())), 300);
		return () => clearTimeout(handle);
	}, [query, dispatch]);

	const goTo = (path: string, withQuery: boolean) => {
		navigate(withQuery ? `${path}?q=${encodeURIComponent(query.trim())}` : path);
		onClose();
	};

	const hasResults = !!searchResults && (
		searchResults.companies.length > 0 || searchResults.contacts.length > 0 ||
		searchResults.leads.length > 0 || searchResults.deals.length > 0
	);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogContent sx={{ p: 2 }}>
				<TextField
					autoFocus
					fullWidth
					placeholder="Search companies, contacts, leads, deals..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					InputProps={{
						startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
						endAdornment: searchLoading ? <CircularProgress size={16} /> : null,
					}}
					sx={{ mb: 2 }}
				/>

				{!hasResults && query.trim() && !searchLoading && (
					<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
						No matches for "{query}".
					</Typography>
				)}

				{searchResults && (
					<List dense disablePadding>
						{searchResults.companies.map((c) => (
							<ListItemButton key={c.public_id} onClick={() => goTo('/crm/companies', true)} sx={{ borderRadius: '8px' }}>
								<Business fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
								<ListItemText primary={c.name} secondary="Company" />
							</ListItemButton>
						))}
						{searchResults.contacts.map((c) => (
							<ListItemButton key={c.public_id} onClick={() => goTo('/crm/contacts', true)} sx={{ borderRadius: '8px' }}>
								<Person fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
								<ListItemText primary={`${c.first_name} ${c.last_name || ''}`.trim()} secondary="Contact" />
							</ListItemButton>
						))}
						{searchResults.leads.map((l) => (
							<ListItemButton key={l.public_id} onClick={() => goTo('/crm/leads', true)} sx={{ borderRadius: '8px' }}>
								<TrendingUp fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
								<ListItemText primary={l.title} secondary="Lead" />
							</ListItemButton>
						))}
						{searchResults.deals.map((d) => (
							<ListItemButton key={d.public_id} onClick={() => goTo('/crm/deals', false)} sx={{ borderRadius: '8px' }}>
								<AttachMoney fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
								<ListItemText primary={d.title} secondary="Deal" />
							</ListItemButton>
						))}
					</List>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default CrmQuickSearchDialog;
