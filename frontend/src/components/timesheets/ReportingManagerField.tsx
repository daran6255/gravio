import React, { useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOwners } from '../../store/slices/crmSlice';

interface ReportingManagerFieldProps {
	value: number | '';
	onChange: (value: number | '') => void;
	excludeUserId?: number;
	label?: string;
	error?: boolean;
	helperText?: string;
}

const ReportingManagerField: React.FC<ReportingManagerFieldProps> = ({
	value,
	onChange,
	excludeUserId,
	label = 'Reporting Manager',
	error = false,
	helperText = '',
}) => {
	const dispatch = useAppDispatch();
	const { owners } = useAppSelector((state) => state.crm);

	useEffect(() => {
		if (owners.length === 0) {
			dispatch(fetchOwners());
		}
	}, [dispatch, owners.length]);

	const availableManagers = excludeUserId
		? owners.filter((o) => o.id !== excludeUserId)
		: owners;

	return (
		<FormControl fullWidth error={error}>
			<InputLabel id="reporting-manager-select-label">{label}</InputLabel>
			<Select
				labelId="reporting-manager-select-label"
				value={value}
				label={label}
				onChange={(e) => onChange(e.target.value as any === '' ? '' : Number(e.target.value))}
			>
				<MenuItem value="">
					<em>None</em>
				</MenuItem>
				{availableManagers.map((m) => (
					<MenuItem key={m.id} value={m.id}>
						{m.full_name || m.email}
					</MenuItem>
				))}
			</Select>
			{helperText && <FormHelperText>{helperText}</FormHelperText>}
		</FormControl>
	);
};

export default ReportingManagerField;
