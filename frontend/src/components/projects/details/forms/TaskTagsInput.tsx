import React, { useState } from 'react';
import { Box, Stack, TextField, IconButton, Popover, Typography, Autocomplete, alpha, useTheme } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import type { ProjectTaskTag } from '../../../../models/projects/projectTask';

const PRESET_COLORS = ['#8B7CF6', '#4EA8FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

interface TaskTagsInputProps {
	value: ProjectTaskTag[];
	onChange: (tags: ProjectTaskTag[]) => void;
	/** Tags already used elsewhere in the project, offered as reusable suggestions
	 * (picking one keeps its established color instead of assigning a new one). */
	existingTags: ProjectTaskTag[];
}

export const TaskTagsInput: React.FC<TaskTagsInputProps> = ({ value, onChange, existingTags }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [inputValue, setInputValue] = useState('');
	const [colorPicker, setColorPicker] = useState<{ anchorEl: HTMLElement; index: number } | null>(null);

	const usedNames = new Set(value.map((t) => t.name.toLowerCase()));
	const suggestions = existingTags.filter((t) => !usedNames.has(t.name.toLowerCase()));

	const addTag = (name: string) => {
		const trimmed = name.trim();
		if (!trimmed || usedNames.has(trimmed.toLowerCase())) {
			setInputValue('');
			return;
		}
		const reused = existingTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
		const color = reused ? reused.color : PRESET_COLORS[value.length % PRESET_COLORS.length];
		onChange([...value, { name: trimmed, color }]);
		setInputValue('');
	};

	const handleRemove = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const handleColorSelect = (color: string) => {
		if (!colorPicker) return;
		onChange(value.map((t, i) => (i === colorPicker.index ? { ...t, color } : t)));
		setColorPicker(null);
	};

	return (
		<Box>
			<Typography
				variant="caption"
				sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem', display: 'block', mb: 1 }}
			>
				Tags
			</Typography>

			{value.length > 0 && (
				<Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
					{value.map((tag, index) => (
						<Stack
							key={tag.name}
							direction="row"
							alignItems="center"
							spacing={0.5}
							sx={{
								pl: 0.75,
								pr: 0.5,
								py: 0.5,
								borderRadius: '8px',
								bgcolor: alpha(tag.color, isDark ? 0.18 : 0.1),
								border: '1px solid',
								borderColor: alpha(tag.color, 0.35),
							}}
						>
							<Box
								onClick={(e) => setColorPicker({ anchorEl: e.currentTarget, index })}
								sx={{
									width: 14,
									height: 14,
									borderRadius: '50%',
									bgcolor: tag.color,
									cursor: 'pointer',
									flexShrink: 0,
									'&:hover': { boxShadow: `0 0 0 2px ${alpha(tag.color, 0.4)}` },
								}}
							/>
							<Typography variant="caption" sx={{ fontWeight: 700, color: tag.color }}>
								{tag.name}
							</Typography>
							<IconButton size="small" onClick={() => handleRemove(index)} sx={{ p: 0.125 }}>
								<Close sx={{ fontSize: 13, color: alpha(tag.color, 0.8) }} />
							</IconButton>
						</Stack>
					))}
				</Stack>
			)}

			<Stack direction="row" spacing={1}>
				<Autocomplete
					freeSolo
					size="small"
					fullWidth
					options={suggestions}
					value={null}
					inputValue={inputValue}
					onInputChange={(_, newInputValue, reason) => {
						if (reason !== 'reset') setInputValue(newInputValue);
					}}
					getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
					onChange={(_, newValue) => {
						if (!newValue) return;
						addTag(typeof newValue === 'string' ? newValue : newValue.name);
					}}
					renderOption={(props, option) => {
						const isString = typeof option === 'string';
						return (
							<Box component="li" {...props} key={isString ? option : option.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isString ? 'text.disabled' : option.color, flexShrink: 0 }} />
								{isString ? option : option.name}
							</Box>
						);
					}}
					renderInput={(params) => (
						<TextField {...params} placeholder="Add a tag or pick an existing one" />
					)}
				/>
				<IconButton
					onClick={() => addTag(inputValue)}
					disabled={!inputValue.trim()}
					sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
				>
					<Add fontSize="small" />
				</IconButton>
			</Stack>

			<Popover
				open={!!colorPicker}
				anchorEl={colorPicker?.anchorEl}
				onClose={() => setColorPicker(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
			>
				<Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
					{PRESET_COLORS.map((color) => (
						<Box
							key={color}
							onClick={() => handleColorSelect(color)}
							sx={{
								width: 22,
								height: 22,
								borderRadius: '50%',
								bgcolor: color,
								cursor: 'pointer',
								border: '2px solid',
								borderColor: colorPicker && value[colorPicker.index]?.color === color ? 'text.primary' : 'transparent',
								transition: 'transform 0.15s ease',
								'&:hover': { transform: 'scale(1.15)' },
							}}
						/>
					))}
				</Stack>
			</Popover>
		</Box>
	);
};

export default TaskTagsInput;
