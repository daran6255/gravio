import React from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';

interface TagInputProps {
	value: string[];
	onChange: (tags: string[]) => void;
	label?: string;
	placeholder?: string;
	size?: 'small' | 'medium';
	disabled?: boolean;
}

/** Free-form chip input for tagging CRM records (leads, deals, companies, contacts). */
export const TagInput: React.FC<TagInputProps> = ({
	value,
	onChange,
	label = 'Tags',
	placeholder = 'Add a tag and press Enter',
	size = 'small',
	disabled,
}) => {
	return (
		<Autocomplete
			multiple
			freeSolo
			options={[]}
			value={value}
			disabled={disabled}
			onChange={(_e, newValue) => onChange(newValue as string[])}
			renderTags={(tagValue, getTagProps) =>
				tagValue.map((option, index) => (
					<Chip
						{...getTagProps({ index })}
						key={option}
						label={option}
						size="small"
						sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.72rem' }}
					/>
				))
			}
			renderInput={(params) => (
				<TextField {...params} label={label} placeholder={value.length ? undefined : placeholder} size={size} />
			)}
		/>
	);
};

export default TagInput;
