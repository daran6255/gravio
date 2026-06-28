import React from 'react';
import { Box, TextField } from '@mui/material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface TaskTabProps {
	subject: string;
	setSubject: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	compact: boolean;
}

export const TaskTab: React.FC<TaskTabProps> = ({
	subject,
	setSubject,
	description,
	setDescription,
	compact,
}) => {
	return (
		<Box sx={{ mb: 1.5 }}>
			<TextField
				placeholder="What needs to be done?"
				value={subject}
				onChange={(e) => setSubject(e.target.value)}
				fullWidth
				size="small"
				variant={compact ? "standard" : "outlined"}
				InputProps={compact ? { disableUnderline: true } : undefined}
				sx={{ mb: 1.5 }}
			/>

			<RichTextEditor
				value={description}
				onChange={setDescription}
				placeholder="Details (optional)"
				minHeight={compact ? 90 : 100}
				variant="simple"
			/>
		</Box>
	);
};

export default TaskTab;
