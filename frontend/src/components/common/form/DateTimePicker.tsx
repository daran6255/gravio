import React from 'react';
import type { TextFieldProps } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker as MuiDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

interface DateTimePickerProps {
  label: string;
  value: string | null; // ISO datetime string or null
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  minDateTime?: string;
  textFieldProps?: Partial<TextFieldProps>;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  size = 'small',
  fullWidth = true,
  minDateTime,
  textFieldProps,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDateTimePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => onChange(newValue ? newValue.toISOString() : '')}
        minDateTime={minDateTime ? dayjs(minDateTime) : undefined}
        slotProps={{
          textField: {
            size,
            fullWidth,
            ...textFieldProps,
          }
        }}
      />
    </LocalizationProvider>
  );
};

export default DateTimePicker;
