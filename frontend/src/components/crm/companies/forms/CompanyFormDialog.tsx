import React, { useEffect, useState } from 'react';
import {
	Dialog,
	TextField,
	MenuItem,
	Stack,
	Autocomplete,
	InputAdornment,
	CircularProgress,
} from '@mui/material';
import { RoomOutlined as RoomIcon } from '@mui/icons-material';
import { MuiTelInput, type MuiTelInputCountry, type MuiTelInputInfo } from 'mui-tel-input';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch } from '../../../../store/hooks';
import { createCompany, updateCompany } from '../../../../store/slices/crmSlice';
import type { Company, CompanySize, CompanyStatus } from '../../../../models/crm/company';
import useToast from '../../../../hooks/useToast';
import usePhoneValidation from '../../../../hooks/usePhoneValidation';
import { COMPANY_INDUSTRIES } from '../../../../data/companyData';

const COMPANY_SIZES: CompanySize[] = ['startup', 'small', 'medium', 'enterprise'];
const COMPANY_STATUSES: CompanyStatus[] = ['prospect', 'customer', 'churned', 'partner'];

interface CompanyFormDialogProps {
	open: boolean;
	onClose: () => void;
	company?: Company | null;
	onSuccess: (company: Company) => void;
}

export const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({ open, onClose, company, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!company;

	const [name, setName] = useState('');
	const [industry, setIndustry] = useState('');
	const [website, setWebsite] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [size, setSize] = useState<CompanySize | ''>('');
	const [status, setStatus] = useState<CompanyStatus>('prospect');
	const [location, setLocation] = useState('');
	const [locationInputValue, setLocationInputValue] = useState('');
	const [locationOptions, setLocationOptions] = useState<string[]>([]);
	const [locationLoading, setLocationLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState<{ name?: boolean }>({});
	const { countryCode, setCountryCode, validatePhoneChange, getMaxLength } = usePhoneValidation();

	// Same debounced Nominatim (OpenStreetMap) geocoding search used on the
	// organization registration form, so location search behaves identically.
	useEffect(() => {
		if (locationInputValue.trim().length < 3) {
			setLocationOptions([]);
			return;
		}

		const fetchLocations = async () => {
			setLocationLoading(true);
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
						locationInputValue
					)}&format=json&addressdetails=1&limit=5&accept-language=en`,
					{
						headers: {
							'User-Agent': 'Gravit-Onboarding-App/1.0',
						},
					}
				);
				const data = await response.json();
				if (Array.isArray(data)) {
					const formattedLocations = data.map((item: any) => {
						const addr = item.address;
						const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.state_district || '';
						const state = addr.state || '';
						const country = addr.country || '';

						if (city && state) {
							return `${city}, ${state}`;
						} else if (city && country) {
							return `${city}, ${country}`;
						} else if (state && country) {
							return `${state}, ${country}`;
						}
						return item.display_name;
					});

					const uniqueLocations = Array.from(new Set(formattedLocations.filter(Boolean))) as string[];
					setLocationOptions(uniqueLocations);
				}
			} catch (error) {
				console.error('Failed to fetch locations:', error);
			} finally {
				setLocationLoading(false);
			}
		};

		const debounceTimer = setTimeout(() => {
			fetchLocations();
		}, 400);

		return () => clearTimeout(debounceTimer);
	}, [locationInputValue]);

	const handlePhoneChange = (value: string, info: MuiTelInputInfo) => {
		// Hard cap: reject the keystroke (or country switch) once the national
		// number would exceed the selected country's max length, instead of
		// just flagging it as an error after the fact.
		if (!validatePhoneChange(info)) return;
		if (info.countryCode) setCountryCode(info.countryCode);
		setPhone(value);
	};

	const fieldErrors = {
		name: name.trim() ? '' : 'Name is required',
	};
	const isValid = !fieldErrors.name;

	useEffect(() => {
		if (!open) return;
		setName(company?.name || '');
		setIndustry(company?.industry || '');
		setWebsite(company?.website || '');
		setPhone(company?.phone || '');
		setEmail(company?.email || '');
		setSize(company?.size || '');
		setStatus(company?.status || 'prospect');
		setLocation(company?.address?.location || '');
		setLocationInputValue(company?.address?.location || '');
		setError(null);
		setTouched({});
	}, [open, company]);

	const handleSave = async () => {
		setTouched({ name: true });
		if (!isValid) return;

		setSubmitting(true);
		setError(null);
		try {
			const payload = {
				name: name.trim(),
				industry: industry || undefined,
				website: website || undefined,
				phone: phone || undefined,
				email: email || undefined,
				size: size || undefined,
				status,
				address: location.trim()
					? { ...company?.address, location: location.trim() }
					: undefined,
			};

			const result = isEdit
				? await dispatch(updateCompany({ publicId: company!.public_id, payload })).unwrap()
				: await dispatch(createCompany(payload)).unwrap();

			toast.success(isEdit ? 'Company updated' : 'Company created');
			onSuccess(result);
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save company');
		} finally {
			setSubmitting(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Company Details',
			description: 'Basic profile information and size metrics',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Company Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						fullWidth
						error={touched.name && !!fieldErrors.name}
						helperText={touched.name && fieldErrors.name}
						placeholder="e.g. Acme Corp"
					/>

					<Autocomplete
						freeSolo
						options={locationOptions}
						loading={locationLoading}
						value={location}
						onChange={(_, newValue) => setLocation(newValue || '')}
						inputValue={locationInputValue}
						onInputChange={(_, newInputValue) => setLocationInputValue(newInputValue)}
						// Options already come pre-filtered by the geocoding API for the typed
						// text, so disable MUI's client-side re-filtering (it can hide results
						// when the input is a misspelling/alias of the returned name).
						filterOptions={(options) => options}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Location"
								placeholder="Search location (e.g. Bangalore, Karnataka)"
								fullWidth
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<InputAdornment position="start">
											<RoomIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
										</InputAdornment>
									),
									endAdornment: (
										<>
											{locationLoading ? <CircularProgress color="inherit" size={16} /> : null}
											{params.InputProps.endAdornment}
										</>
									)
								}}
							/>
						)}
					/>

					<TextField
						select
						label="Industry"
						value={industry}
						onChange={(e) => setIndustry(e.target.value)}
						fullWidth
					>
						<MenuItem value="">Unspecified</MenuItem>
						{COMPANY_INDUSTRIES.map((i) => (
							<MenuItem key={i} value={i}>{i}</MenuItem>
						))}
					</TextField>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							select
							label="Status"
							value={status}
							onChange={(e) => setStatus(e.target.value as CompanyStatus)}
							fullWidth
						>
							{COMPANY_STATUSES.map((s) => (
								<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
									{s}
								</MenuItem>
							))}
						</TextField>

						<TextField
							select
							label="Size"
							value={size}
							onChange={(e) => setSize(e.target.value as CompanySize)}
							fullWidth
						>
							<MenuItem value="">Unspecified</MenuItem>
							{COMPANY_SIZES.map((s) => (
								<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
									{s}
								</MenuItem>
							))}
						</TextField>
					</Stack>
				</Stack>
			)
		},
		{
			label: 'Contact Info',
			description: 'Web addresses and communication channels',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Website"
						value={website}
						onChange={(e) => setWebsite(e.target.value)}
						fullWidth
						placeholder="https://"
					/>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<MuiTelInput
							label="Phone"
							value={phone}
							onChange={handlePhoneChange}
							defaultCountry={countryCode as MuiTelInputCountry}
							forceCallingCode
							fullWidth
							helperText={`Max ${getMaxLength(countryCode)} digits for the selected country`}
						/>
						<TextField
							label="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							fullWidth
							placeholder="info@company.com"
						/>
					</Stack>
				</Stack>
			)
		}
	];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title={isEdit ? 'Edit Company' : 'New Company'}
				subtitle={isEdit ? company?.name : 'Add a new company record'}
				mode={isEdit ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={isEdit ? 'Save Changes' : 'Create Company'}
				error={error}
			/>
		</Dialog>
	);
};

export default CompanyFormDialog;
